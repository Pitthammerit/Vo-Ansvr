import { createLogger } from "./debug"
import { getSupabaseClient } from "./supabase"
import { sessionRecovery } from "./session-recovery"

const logger = createLogger("SessionMonitor")

export class SessionMonitor {
  private static instance: SessionMonitor
  private monitorInterval: NodeJS.Timeout | null = null
  private isMonitoring = false
  private healthCheckInterval = 30000 // 30 seconds
  private lastHealthCheck = 0
  private consecutiveFailures = 0
  private maxConsecutiveFailures = 3

  static getInstance(): SessionMonitor {
    if (!SessionMonitor.instance) {
      SessionMonitor.instance = new SessionMonitor()
    }
    return SessionMonitor.instance
  }

  startMonitoring(): void {
    if (this.isMonitoring || typeof window === "undefined") {
      return
    }

    logger.info("🔍 Starting session health monitoring...")
    this.isMonitoring = true

    this.monitorInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.healthCheckInterval)

    // Perform initial health check
    this.performHealthCheck()
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return
    }

    logger.info("⏹️ Stopping session health monitoring...")
    this.isMonitoring = false

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
  }

  private async performHealthCheck(): Promise<void> {
    const now = Date.now()

    // Prevent too frequent checks
    if (now - this.lastHealthCheck < this.healthCheckInterval / 2) {
      return
    }

    this.lastHealthCheck = now

    try {
      const supabase = await getSupabaseClient()
      const { data, error } = await supabase.auth.getSession()

      if (error && !error.message.includes("session_not_found")) {
        this.consecutiveFailures++
        logger.warn(
          `Session health check failed (${this.consecutiveFailures}/${this.maxConsecutiveFailures}):`,
          error.message,
        )

        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
          logger.error("🚨 Multiple consecutive session failures detected, attempting recovery...")
          await this.attemptRecovery()
        }
      } else {
        if (this.consecutiveFailures > 0) {
          logger.info("✅ Session health restored")
        }
        this.consecutiveFailures = 0
      }
    } catch (error) {
      this.consecutiveFailures++
      logger.error(`Session health check error (${this.consecutiveFailures}/${this.maxConsecutiveFailures}):`, error)

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        logger.error("🚨 Multiple consecutive health check errors, attempting recovery...")
        await this.attemptRecovery()
      }
    }
  }

  private async attemptRecovery(): Promise<void> {
    try {
      logger.info("🔄 Attempting automatic session recovery...")
      const result = await sessionRecovery.attemptSessionRecovery()

      if (result.success) {
        logger.info("✅ Automatic session recovery successful:", result.message)
        this.consecutiveFailures = 0

        // Dispatch custom event to notify components
        window.dispatchEvent(
          new CustomEvent("session-recovered", {
            detail: { result },
          }),
        )
      } else {
        logger.warn("❌ Automatic session recovery failed:", result.message)

        // Dispatch custom event to notify components of failure
        window.dispatchEvent(
          new CustomEvent("session-recovery-failed", {
            detail: { result },
          }),
        )
      }
    } catch (error) {
      logger.error("Session recovery attempt failed:", error)
    }
  }

  getHealthStatus() {
    return {
      isMonitoring: this.isMonitoring,
      consecutiveFailures: this.consecutiveFailures,
      lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
      healthCheckInterval: this.healthCheckInterval,
    }
  }
}

// Export singleton instance
export const sessionMonitor = SessionMonitor.getInstance()
