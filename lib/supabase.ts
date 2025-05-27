import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseClient: SupabaseClient | null = null
let initializationPromise: Promise<SupabaseClient> | null = null

export async function getSupabaseClient(): Promise<SupabaseClient> {
  // If we already have a client, return it
  if (supabaseClient) {
    return supabaseClient
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise
  }

  // Start initialization
  initializationPromise = initializeClient()

  try {
    supabaseClient = await initializationPromise
    return supabaseClient
  } finally {
    initializationPromise = null
  }
}

async function initializeClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })

  // Test the client connection
  try {
    await client.auth.getSession()
    console.log("✅ Supabase client initialized successfully")
  } catch (error) {
    console.warn("⚠️ Initial session check failed, but client created:", error)
  }

  return client
}
