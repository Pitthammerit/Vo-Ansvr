"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient, type User, type Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (data: { name?: string; email?: string }) => Promise<{ error: any }>
  isAuthenticated: boolean
  supabase: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Initialize Supabase client
  const supabase = (() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("⚠️ Supabase environment variables not configured - auth disabled")
      return null
    }

    return createClient(supabaseUrl, supabaseAnonKey)
  })()

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle different auth events
      switch (event) {
        case "SIGNED_IN":
          console.log("User signed in:", session?.user?.email)
          break
        case "SIGNED_OUT":
          console.log("User signed out")
          break
        case "TOKEN_REFRESHED":
          console.log("Token refreshed")
          break
        case "USER_UPDATED":
          console.log("User updated")
          break
        case "PASSWORD_RECOVERY":
          console.log("Password recovery initiated")
          break
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signUp = async (email: string, password: string, name: string) => {
    if (!supabase) {
      return { error: { message: "Authentication not available in demo mode" } }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name,
          },
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        return { error }
      }

      // If user is created but not confirmed, they need to check email
      if (data.user && !data.session) {
        console.log("User created, email confirmation required")
      }

      return { error: null }
    } catch (error) {
      console.error("Unexpected sign up error:", error)
      return { error: { message: "An unexpected error occurred" } }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: "Authentication not available in demo mode" } }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        return { error }
      }

      console.log("Sign in successful:", data.user?.email)
      return { error: null }
    } catch (error) {
      console.error("Unexpected sign in error:", error)
      return { error: { message: "An unexpected error occurred" } }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      return
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      } else {
        console.log("Sign out successful")
        // Clear any local state
        setUser(null)
        setSession(null)
        // Redirect to home
        router.push("/")
      }
    } catch (error) {
      console.error("Unexpected sign out error:", error)
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

      if (error) {
        console.error("Password reset error:", error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error("Unexpected password reset error:", error)
      return { error: { message: "An unexpected error occurred" } }
    }
  }

  const updateProfile = async (data: { name?: string; email?: string }) => {
    if (!supabase || !user) {
      return { error: { message: "Not authenticated" } }
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
        data: {
          name: data.name,
          full_name: data.name,
        },
      })

      if (error) {
        console.error("Profile update error:", error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error("Unexpected profile update error:", error)
      return { error: { message: "An unexpected error occurred" } }
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
    isAuthenticated: !!user,
    supabase,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
