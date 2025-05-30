"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient, type User, type Session } from "@supabase/supabase-js"

interface SimpleAuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  supabase: any
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined)

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext)
  if (!context) {
    throw new Error("useSimpleAuth must be used within SimpleAuthProvider")
  }
  return context
}

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("🔍 Environment check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      url: supabaseUrl,
      keyLength: supabaseKey?.length,
    })

    if (!supabaseUrl || !supabaseKey) {
      setError("Missing Supabase environment variables")
      setLoading(false)
      return
    }

    try {
      // Create Supabase client with minimal config
      const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })

      console.log("✅ Supabase client created")
      setSupabase(client)

      // Get initial session
      client.auth
        .getSession()
        .then(({ data, error }) => {
          console.log("📋 Initial session check:", {
            hasSession: !!data.session,
            error: error?.message,
            user: data.session?.user?.email,
          })

          if (error) {
            console.error("❌ Session error:", error)
            setError(`Session error: ${error.message}`)
          } else {
            setSession(data.session)
            setUser(data.session?.user ?? null)
            setError(null)
          }
          setLoading(false)
        })
        .catch((err) => {
          console.error("❌ Session check failed:", err)
          setError(`Session check failed: ${err.message}`)
          setLoading(false)
        })

      // Listen for auth changes
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((event, session) => {
        console.log("🔄 Auth state changed:", event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        if (session) {
          setError(null)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (err) {
      console.error("❌ Failed to create Supabase client:", err)
      setError(`Failed to create Supabase client: ${err instanceof Error ? err.message : "Unknown error"}`)
      setLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: "Supabase client not initialized" } }
    }

    try {
      console.log("🔑 Attempting sign in for:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ Sign in error:", error)
        return { error }
      }

      console.log("✅ Sign in successful")
      return { error: null }
    } catch (err) {
      console.error("❌ Sign in exception:", err)
      return { error: { message: err instanceof Error ? err.message : "Unknown error" } }
    }
  }

  const signOut = async () => {
    if (!supabase) return

    try {
      console.log("👋 Signing out")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ Sign out error:", error)
      } else {
        console.log("✅ Sign out successful")
      }
    } catch (err) {
      console.error("❌ Sign out exception:", err)
    }
  }

  return (
    <SimpleAuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signIn,
        signOut,
        supabase,
      }}
    >
      {children}
    </SimpleAuthContext.Provider>
  )
}
