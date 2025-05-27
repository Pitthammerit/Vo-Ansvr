"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "./supabase"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, name: string) => Promise<{ error: any; needsEmailVerification?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  updateProfile: (data: { name?: string; email?: string; avatar_url?: string }) => Promise<{ error: any }>
  isAdmin: boolean
  retryInitialization: () => Promise<void>
  recoverSession: () => Promise<{ success: boolean; message: string }>
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
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    console.log("🔄 AuthProvider initializing...")

    let mounted = true
    let authSubscription: any = null

    const initializeAuth = async () => {
      try {
        // Get the singleton Supabase client
        const supabase = getSupabaseClient()
        console.log("✅ Got Supabase client")

        // Add retry logic for initial session check
        let sessionData = null
        let sessionError = null
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries && !sessionData) {
          const { data, error } = await supabase.auth.getSession()

          if (error && !error.message.includes("session_not_found")) {
            sessionError = error
            console.warn(`Session check attempt ${retryCount + 1} failed:`, error.message)

            // Wait a bit before retrying
            if (retryCount < maxRetries - 1) {
              await new Promise((resolve) => setTimeout(resolve, 500))
            }
          } else {
            sessionData = data
            sessionError = error
            break
          }

          retryCount++
        }

        console.log("📋 Initial session check:", {
          hasSession: !!sessionData?.session,
          error: sessionError?.message,
          user: sessionData?.session?.user?.email,
          retryCount,
        })

        if (mounted) {
          if (sessionError && !sessionError.message.includes("session_not_found")) {
            console.error("❌ Session error after retries:", sessionError)
            setError(`Session error: ${sessionError.message}`)
          } else {
            setSession(sessionData?.session || null)
            setUser(sessionData?.session?.user ?? null)
            setError(null)
          }
          setLoading(false)
        }

        // Set up auth state listener with better error handling
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("🔄 Auth state changed:", event, session?.user?.email || "No user")

          if (mounted) {
            // Handle specific auth events
            if (event === "SIGNED_IN" && session) {
              console.log("✅ User signed in successfully")
              setSession(session)
              setUser(session.user)
              setError(null)
            } else if (event === "SIGNED_OUT") {
              console.log("👋 User signed out")
              setSession(null)
              setUser(null)
              setError(null)
            } else if (event === "TOKEN_REFRESHED" && session) {
              console.log("🔄 Token refreshed")
              setSession(session)
              setUser(session.user)
              setError(null)
            } else {
              setSession(session)
              setUser(session?.user ?? null)
              if (session) {
                setError(null)
              }
            }
          }
        })

        authSubscription = subscription
      } catch (err) {
        console.error("❌ Failed to initialize auth:", err)
        if (mounted) {
          setError(`Failed to initialize auth: ${err instanceof Error ? err.message : "Unknown error"}`)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      if (authSubscription) {
        console.log("🧹 Cleaning up auth subscription")
        authSubscription.unsubscribe()
      }
    }
  }, [])

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    const userRole = user.user_metadata?.role
    if (userRole === "admin") {
      setIsAdmin(true)
    } else {
      const adminEmails = ["admin@example.com", "owewill22@gmail.com"]
      setIsAdmin(adminEmails.includes(user.email || ""))
    }
  }, [user])

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log("📝 Signing up user:", email)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      })

      if (error) throw error

      if (data.user && !data.session) {
        console.log("✅ User signed up, email verification required")
        return { error: null, needsEmailVerification: true }
      }

      console.log("✅ User signed up successfully")
      return { error: null, needsEmailVerification: false }
    } catch (error) {
      console.error("❌ Sign up error:", error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔑 Signing in user:", email)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log("✅ User signed in successfully")
      return { error: null }
    } catch (error) {
      console.error("❌ Sign in error:", error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log("👋 Signing out user")
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      console.log("✅ User signed out successfully")
    } catch (error) {
      console.error("❌ Sign out error:", error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log("🔄 Resetting password for:", email)
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      console.log("✅ Password reset email sent")
      return { error: null }
    } catch (error) {
      console.error("❌ Password reset error:", error)
      return { error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      console.log("🔐 Updating password")
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      console.log("✅ Password updated successfully")
      return { error: null }
    } catch (error) {
      console.error("❌ Password update error:", error)
      return { error }
    }
  }

  const updateProfile = async (data: { name?: string; email?: string; avatar_url?: string }) => {
    if (!user) {
      return { error: { message: "Not authenticated" } }
    }

    try {
      console.log("👤 Updating profile for:", user.email)
      const supabase = getSupabaseClient()

      const updateData: any = {}

      if (data.email && data.email !== user.email) {
        updateData.email = data.email
      }

      const metadataUpdates: any = {}
      if (data.name !== undefined) {
        metadataUpdates.name = data.name
      }
      if (data.avatar_url !== undefined) {
        metadataUpdates.avatar_url = data.avatar_url
      }

      if (Object.keys(metadataUpdates).length > 0) {
        updateData.data = metadataUpdates
      }

      const { data: updatedUser, error } = await supabase.auth.updateUser(updateData)

      if (error) throw error

      console.log("✅ Profile updated successfully")
      return { error: null }
    } catch (error) {
      console.error("❌ Profile update error:", error)
      return {
        error: {
          message: error instanceof Error ? error.message : "Failed to update profile",
        },
      }
    }
  }

  const retryInitialization = async () => {
    setError(null)
    setLoading(true)
    window.location.reload()
  }

  const recoverSession = async () => {
    try {
      console.log("🔄 Manual session recovery requested")
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.getSession()

      if (!error && data.session) {
        setSession(data.session)
        setUser(data.session.user)
        setError(null)
        return { success: true, message: "Session recovered successfully" }
      }

      return { success: false, message: error?.message || "No session found" }
    } catch (error) {
      const message = `Session recovery failed: ${error instanceof Error ? error.message : "Unknown error"}`
      console.error(message)
      return { success: false, message }
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAdmin,
    retryInitialization,
    recoverSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
