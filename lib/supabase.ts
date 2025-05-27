import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createLogger } from "./debug"

// Component-specific logger
const logger = createLogger("Supabase")

// Simple singleton
let supabaseInstance: SupabaseClient | null = null
let initializationError: Error | null = null

export async function getSupabaseClient(): Promise<SupabaseClient> {
  // Return existing instance if available
  if (supabaseInstance) {
    logger.debug("Returning existing Supabase instance")
    return supabaseInstance
  }

  // If we had a previous initialization error, throw it again
  if (initializationError) {
    logger.error("Previous initialization error:", initializationError.message)
    throw initializationError
  }

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Detailed environment variable validation
  if (!supabaseUrl) {
    const error = new Error("NEXT_PUBLIC_SUPABASE_URL is not set. Please add it to your .env.local file.")
    initializationError = error
    logger.error("Missing Supabase URL")
    throw error
  }

  if (!supabaseAnonKey) {
    const error = new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please add it to your .env.local file.")
    initializationError = error
    logger.error("Missing Supabase anon key")
    throw error
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    const error = new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
    initializationError = error
    logger.error("Invalid Supabase URL format")
    throw error
  }

  // Validate anon key format (basic check)
  if (supabaseAnonKey.length < 100) {
    const error = new Error("Supabase anon key appears to be invalid (too short)")
    initializationError = error
    logger.error("Invalid Supabase anon key format")
    throw error
  }

  try {
    logger.info("Creating Supabase client instance...")
    logger.debug("Supabase URL:", supabaseUrl)
    logger.debug("Supabase Key (first 20 chars):", supabaseAnonKey.substring(0, 20) + "...")

    // Create instance with comprehensive configuration
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        storageKey: "ansvr.auth.token",
        flowType: "pkce",
      },
      global: {
        headers: {
          "X-Client-Info": "ansvr-web-app",
        },
      },
      db: {
        schema: "public",
      },
    })

    // Test the connection immediately
    logger.debug("Testing Supabase connection...")
    const { error: testError } = await supabaseInstance.auth.getSession()

    if (testError && !testError.message.includes("session_not_found")) {
      throw new Error(`Supabase connection test failed: ${testError.message}`)
    }

    logger.info("✅ Supabase client initialized and tested successfully")
    return supabaseInstance
  } catch (error) {
    const enhancedError = new Error(
      `Failed to initialize Supabase client: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
    initializationError = enhancedError
    logger.error("❌ Supabase initialization failed:", enhancedError.message)
    throw enhancedError
  }
}

// Synchronous version for immediate access
export function getSupabaseClientSync(): SupabaseClient | null {
  return supabaseInstance
}

// Reset function for testing/debugging
export function resetSupabaseClient(): void {
  logger.debug("Resetting Supabase client")
  supabaseInstance = null
  initializationError = null
}

// Health check function
export async function checkSupabaseHealth(): Promise<{
  status: "healthy" | "unhealthy"
  message: string
  details?: any
}> {
  try {
    const client = await getSupabaseClient()
    const { data, error } = await client.auth.getSession()

    if (error && !error.message.includes("session_not_found")) {
      return {
        status: "unhealthy",
        message: `Supabase health check failed: ${error.message}`,
        details: error,
      }
    }

    return {
      status: "healthy",
      message: "Supabase is healthy and responding",
    }
  } catch (error) {
    return {
      status: "unhealthy",
      message: `Supabase health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      details: error,
    }
  }
}
