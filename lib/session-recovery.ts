import { createLogger } from "./debug"
import { getSupabaseClient } from "./supabase"

const logger = createLogger("SessionRecovery")

export interface SessionRecoveryResult {
  success: boolean
  action: string
  message: string
  details?: any
}

export class SessionRecoveryService {
  private static instance: SessionRecoveryService
  private recoveryAttempts = 0
  private maxRecoveryAttempts = 3
  private lastRecoveryTime = 0
  private recoveryTimeout = 30000 // 30 seconds between recovery attempts

  static getInstance(): SessionRecoveryService {
    if (!SessionRecoveryService.instance) {
      SessionRecoveryService.instance = new SessionRecoveryService()
    }
    return SessionRecoveryService.instance
  }

  async attemptSessionRecovery(): Promise<SessionRecoveryResult> {
    const now = Date.now()

    // Prevent too frequent recovery attempts
    if (now - this.lastRecoveryTime < this.recoveryTimeout) {
      return {
        success: false,
        action: "rate_limited",
        message: "Recovery attempt rate limited",
        details: {
          timeRemaining: this.recoveryTimeout - (now - this.lastRecoveryTime),
          lastAttempt: new Date(this.lastRecoveryTime).toISOString(),
        },
      }
    }

    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      return {
        success: false,
        action: "max_attempts_reached",
        message: "Maximum recovery attempts reached",
        details: { attempts: this.recoveryAttempts },
      }
    }

    this.recoveryAttempts++
    this.lastRecoveryTime = now

    logger.info(`🔄 Attempting session recovery (attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`)

    try {
      // Step 1: Check if we have a valid refresh token in storage
      const refreshTokenResult = await this.checkAndUseRefreshToken()
      if (refreshTokenResult.success) {
        this.resetRecoveryState()
        return refreshTokenResult
      }

      // Step 2: Try to recover from URL fragments (OAuth callback)
      const urlRecoveryResult = await this.recoverFromUrlFragments()
      if (urlRecoveryResult.success) {
        this.resetRecoveryState()
        return urlRecoveryResult
      }

      // Step 3: Clean up corrupted session data
      const cleanupResult = await this.cleanupCorruptedSession()
      if (cleanupResult.success) {
        return cleanupResult
      }

      // Step 4: Force re-initialization
      const reinitResult = await this.forceReinitialization()
      return reinitResult
    } catch (error) {
      logger.error("Session recovery failed:", error)
      return {
        success: false,
        action: "recovery_error",
        message: `Recovery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: { error, attempt: this.recoveryAttempts },
      }
    }
  }

  private async checkAndUseRefreshToken(): Promise<SessionRecoveryResult> {
    logger.debug("🔍 Checking for valid refresh token...")

    if (typeof window === "undefined") {
      return {
        success: false,
        action: "no_browser",
        message: "Not in browser environment",
      }
    }

    try {
      const supabase = await getSupabaseClient()

      // Check localStorage for auth tokens
      const authKeys = [
        "ansvr.auth.token",
        "sb-auth-token",
        "supabase.auth.token",
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] || "unknown"}-auth-token`,
      ]

      for (const key of authKeys) {
        const tokenData = localStorage.getItem(key)
        if (tokenData) {
          try {
            const parsed = JSON.parse(tokenData)
            if (parsed.refresh_token) {
              logger.debug(`📱 Found refresh token in ${key}`)

              // Try to refresh the session
              const { data, error } = await supabase.auth.refreshSession({
                refresh_token: parsed.refresh_token,
              })

              if (error) {
                logger.warn(`❌ Refresh failed for ${key}:`, error.message)
                continue
              }

              if (data.session) {
                logger.info(`✅ Session refreshed successfully using ${key}`)
                return {
                  success: true,
                  action: "refresh_token_used",
                  message: "Session recovered using refresh token",
                  details: {
                    storageKey: key,
                    newSession: {
                      user: data.session.user?.email,
                      expiresAt: data.session.expires_at,
                    },
                  },
                }
              }
            }
          } catch (parseError) {
            logger.warn(`❌ Failed to parse token from ${key}:`, parseError)
            // Remove corrupted token
            localStorage.removeItem(key)
          }
        }
      }

      return {
        success: false,
        action: "no_valid_refresh_token",
        message: "No valid refresh token found in storage",
      }
    } catch (error) {
      return {
        success: false,
        action: "refresh_token_error",
        message: `Refresh token check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: { error },
      }
    }
  }

  private async recoverFromUrlFragments(): Promise<SessionRecoveryResult> {
    logger.debug("🔍 Checking URL for auth fragments...")

    if (typeof window === "undefined") {
      return {
        success: false,
        action: "no_browser",
        message: "Not in browser environment",
      }
    }

    try {
      const url = new URL(window.location.href)
      const hasAuthFragment =
        url.hash.includes("access_token") || url.hash.includes("refresh_token") || url.searchParams.has("code")

      if (!hasAuthFragment) {
        return {
          success: false,
          action: "no_auth_fragments",
          message: "No auth fragments found in URL",
        }
      }

      logger.debug("📱 Found auth fragments in URL, attempting recovery...")

      const supabase = await getSupabaseClient()

      // Let Supabase handle the auth callback
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        return {
          success: false,
          action: "url_recovery_failed",
          message: `URL recovery failed: ${error.message}`,
          details: { error, url: window.location.href },
        }
      }

      if (data.session) {
        logger.info("✅ Session recovered from URL fragments")

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)

        return {
          success: true,
          action: "url_recovery_success",
          message: "Session recovered from URL fragments",
          details: {
            session: {
              user: data.session.user?.email,
              expiresAt: data.session.expires_at,
            },
          },
        }
      }

      return {
        success: false,
        action: "no_session_from_url",
        message: "No session found despite auth fragments in URL",
      }
    } catch (error) {
      return {
        success: false,
        action: "url_recovery_error",
        message: `URL recovery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: { error },
      }
    }
  }

  private async cleanupCorruptedSession(): Promise<SessionRecoveryResult> {
    logger.debug("🧹 Cleaning up corrupted session data...")

    if (typeof window === "undefined") {
      return {
        success: false,
        action: "no_browser",
        message: "Not in browser environment",
      }
    }

    try {
      let cleanedItems = 0

      // Clean localStorage
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.includes("auth") || key.includes("supabase") || key.includes("token")) {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              const parsed = JSON.parse(value)

              // Check if token is expired
              if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) {
                localStorage.removeItem(key)
                cleanedItems++
                logger.debug(`🗑️ Removed expired token: ${key}`)
              }

              // Check if token is malformed
              if (parsed.access_token && typeof parsed.access_token !== "string") {
                localStorage.removeItem(key)
                cleanedItems++
                logger.debug(`🗑️ Removed malformed token: ${key}`)
              }
            }
          } catch (parseError) {
            // Remove unparseable items
            localStorage.removeItem(key)
            cleanedItems++
            logger.debug(`🗑️ Removed unparseable item: ${key}`)
          }
        }
      }

      // Clean cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.includes("auth") || name.includes("supabase") || name.includes("token")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          cleanedItems++
          logger.debug(`🗑️ Removed cookie: ${name}`)
        }
      })

      return {
        success: true,
        action: "cleanup_completed",
        message: `Cleaned up ${cleanedItems} corrupted auth items`,
        details: { cleanedItems },
      }
    } catch (error) {
      return {
        success: false,
        action: "cleanup_error",
        message: `Cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: { error },
      }
    }
  }

  private async forceReinitialization(): Promise<SessionRecoveryResult> {
    logger.debug("🔄 Forcing auth system reinitialization...")

    try {
      // Import the reset function dynamically to avoid circular dependencies
      const { resetSupabaseClient } = await import("./supabase")

      // Reset the Supabase client
      resetSupabaseClient()

      // Try to get a fresh client
      const supabase = await getSupabaseClient()

      // Test the new client
      const { data, error } = await supabase.auth.getSession()

      if (error && !error.message.includes("session_not_found")) {
        return {
          success: false,
          action: "reinitialization_failed",
          message: `Reinitialization failed: ${error.message}`,
          details: { error },
        }
      }

      return {
        success: true,
        action: "reinitialization_success",
        message: "Auth system reinitialized successfully",
        details: {
          hasSession: !!data.session,
          sessionUser: data.session?.user?.email,
        },
      }
    } catch (error) {
      return {
        success: false,
        action: "reinitialization_error",
        message: `Reinitialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: { error },
      }
    }
  }

  private resetRecoveryState(): void {
    this.recoveryAttempts = 0
    this.lastRecoveryTime = 0
    logger.info("✅ Session recovery successful - reset recovery state")
  }

  public resetRecoveryAttempts(): void {
    this.recoveryAttempts = 0
    this.lastRecoveryTime = 0
    logger.debug("🔄 Recovery attempts manually reset")
  }

  public getRecoveryStatus() {
    return {
      attempts: this.recoveryAttempts,
      maxAttempts: this.maxRecoveryAttempts,
      lastAttempt: this.lastRecoveryTime,
      canAttempt:
        this.recoveryAttempts < this.maxRecoveryAttempts && Date.now() - this.lastRecoveryTime >= this.recoveryTimeout,
    }
  }
}

// Export singleton instance
export const sessionRecovery = SessionRecoveryService.getInstance()
