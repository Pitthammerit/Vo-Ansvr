import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createLogger } from "./debug"

// Component-specific logger
const logger = createLogger("Supabase")

// Global singleton with stronger protection
let supabaseInstance: SupabaseClient | null = null
let isInitializing = false

// Unique identifier for this app session
const APP_SESSION_ID = `ansvr_${Date.now()}_${Math.random().toString(36).substring(7)}`

// Storage key for tracking the active instance
const INSTANCE_TRACKER_KEY = "ansvr_supabase_active_instance"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Enhanced singleton protection
function getGlobalInstance(): SupabaseClient | null {
  if (!isBrowser) return null

  // Check if there's already a global instance
  const globalInstance = (window as any).__ansvr_supabase_singleton
  if (globalInstance && globalInstance.supabaseUrl) {
    logger.debug("Found existing global Supabase instance")
    return globalInstance
  }

  return null
}

// Set global instance with protection
function setGlobalInstance(instance: SupabaseClient): void {
  if (!isBrowser) return

  // Only set if not already set by another instance
  if (!(window as any).__ansvr_supabase_singleton) {
    ;(window as any).__ansvr_supabase_singleton = instance

    // Track this session as the owner
    sessionStorage.setItem(INSTANCE_TRACKER_KEY, APP_SESSION_ID)

    logger.debug("Set global Supabase instance", APP_SESSION_ID)

    // Cleanup on page unload
    const cleanup = () => {
      const currentOwner = sessionStorage.getItem(INSTANCE_TRACKER_KEY)
      if (currentOwner === APP_SESSION_ID) {
        delete (window as any).__ansvr_supabase_singleton
        sessionStorage.removeItem(INSTANCE_TRACKER_KEY)
        logger.debug("Cleaned up global instance on unload")
      }
    }

    window.addEventListener("beforeunload", cleanup, { once: true })
    window.addEventListener("pagehide", cleanup, { once: true })
  }
}

export async function getSupabaseClient(): Promise<SupabaseClient> {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    )
  }

  // Return existing instance if available
  if (supabaseInstance) {
    logger.debug("Returning existing singleton instance")
    return supabaseInstance
  }

  // Check for existing global instance
  const existingInstance = getGlobalInstance()
  if (existingInstance) {
    supabaseInstance = existingInstance
    logger.debug("Using existing global instance")
    return supabaseInstance
  }

  // Prevent multiple concurrent initializations
  if (isInitializing) {
    logger.debug("Already initializing, waiting...")
    // Wait for initialization to complete
    while (isInitializing && !supabaseInstance) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    return supabaseInstance!
  }

  // Initialize new instance
  return await initializeNewInstance(supabaseUrl, supabaseAnonKey)
}

async function initializeNewInstance(supabaseUrl: string, supabaseAnonKey: string): Promise<SupabaseClient> {
  isInitializing = true

  try {
    logger.info("Creating new Supabase client instance")

    // Create instance with optimized configuration
    const newInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: isBrowser ? window.localStorage : undefined,
        storageKey: "ansvr.auth.token", // Unique storage key for our app
        flowType: "pkce",
      },
      global: {
        headers: {
          "X-Client-Info": `ansvr-${APP_SESSION_ID}`,
        },
      },
      db: {
        schema: "public",
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })

    // Set as singleton
    supabaseInstance = newInstance
    setGlobalInstance(newInstance)

    logger.info("✅ Supabase client initialized successfully")
    return supabaseInstance
  } catch (error) {
    logger.error("❌ Failed to initialize Supabase client:", error)
    throw error
  } finally {
    isInitializing = false
  }
}

// Synchronous version for immediate access
export function getSupabaseClientSync(): SupabaseClient | null {
  return supabaseInstance || getGlobalInstance()
}

// Enhanced cleanup function
export function cleanupSupabaseInstance(): void {
  logger.debug("🧹 Cleaning up Supabase instance")

  if (isBrowser) {
    const currentOwner = sessionStorage.getItem(INSTANCE_TRACKER_KEY)

    // Only cleanup if we own the instance
    if (currentOwner === APP_SESSION_ID) {
      if (supabaseInstance) {
        // Don't destroy the client, just clear references
        supabaseInstance = null
      }

      delete (window as any).__ansvr_supabase_singleton
      sessionStorage.removeItem(INSTANCE_TRACKER_KEY)
      logger.debug("Cleaned up owned instance")
    } else {
      logger.debug("Not cleaning up - not the owner")
    }
  }

  isInitializing = false
}
