import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createLogger } from "./debug"

// Component-specific logger
const logger = createLogger("Supabase")

// Simple singleton
let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  // Return existing instance if available
  if (supabaseInstance) {
    logger.debug("Returning existing Supabase instance")
    return supabaseInstance
  }

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
  }

  if (!supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set")
  }

  logger.info("Creating new Supabase client instance...")

  // Create instance with proper session persistence
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
  })

  logger.info("✅ Supabase client created successfully")
  return supabaseInstance
}

// Synchronous version for immediate access
export function getSupabaseClientSync(): SupabaseClient | null {
  return supabaseInstance
}

// Reset function for testing/debugging
export function resetSupabaseClient(): void {
  logger.debug("Resetting Supabase client")
  supabaseInstance = null
}

// Health check function
export async function checkSupabaseHealth(): Promise<{
  status: "healthy" | "unhealthy"
  message: string
  details?: any
}> {
  try {
    const client = getSupabaseClient()
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
      details: { hasSession: !!data.session },
    }
  } catch (error) {
    return {
      status: "unhealthy",
      message: `Supabase health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      details: error,
    }
  }
}
