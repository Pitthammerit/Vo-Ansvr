"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient, type User, type Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (data: { name?: string; email?: string }) => Promise<{ error: any }>
  isDemo: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()
  const isDemo = !supabase

  useEffect(() => {
    if (!supabase) {
      // Demo mode - create a mock user
      setUser({
        id: "demo-user",
        email: "demo@ansvr.app",
        user_metadata: { name: "Demo User" },
      } as User)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signUp = async (email: string, password: string, name: string) => {
    if (!supabase) {
      return { error: null } // Demo mode
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      })

      if (error) throw error

      // If user needs email confirmation
      if (data.user && !data.session) {
        return { error: { message: "Please check your email to confirm your account" } }
      }

      return { error: null }
    } catch (error) {
      console.error("Sign up error:", error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: null } // Demo mode
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error("Sign in error:", error)
      return { error }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      // Demo mode - just clear state
      setUser(null)
      setSession(null)
      return
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: { message: "Password reset not available in demo mode" } }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error("Password reset error:", error)
      return { error }
    }
  }

  const updateProfile = async (data: { name?: string; email?: string }) => {
    if (!supabase || !user) {
      return { error: { message: "Not authenticated" } }
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
        data: { name: data.name },
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error("Profile update error:", error)
      return { error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    isDemo,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
