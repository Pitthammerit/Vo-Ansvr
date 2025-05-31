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
        console.log("🔄 Initializing auth...")

        // Get the singleton Supabase client with retry logic
        let supabase
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries) {
          try {
            supabase = getSupabaseClient()
            break
          } catch (clientError) {
            retryCount++
            console.warn(`⚠️ Supabase client creation attempt ${retryCount} failed:`, clientError)
            if (retryCount >= maxRetries) {
              throw new Error(
                `Failed to create Supabase client after ${maxRetries} attempts: ${clientError instanceof Error ? clientError.message : "Unknown error"}`,
              )
            }
            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
          }
        }

        if (!supabase) {
          throw new Error("Failed to initialize Supabase client")
        }

        console.log("✅ Got Supabase client")

        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Session check timeout")), 10000),
        )

        const { data, error } = (await Promise.race([sessionPromise, timeoutPromise])) as any

        console.log("📋 Initial session check:", {
          hasSession: !!data?.session,
          error: error?.message,
          user: data?.session?.user?.email,
        })

        if (mounted) {
          if (error) {
            console.error("❌ Session error:", error)
            // Don't set error for session_not_found as it's normal for logged out users
            if (!error.message.includes("session_not_found")) {
              setError(`Session error: ${error.message}`)
            }
          } else {
            setSession(data.session)
            setUser(data.session?.user ?? null)
            setError(null)
          }
          setLoading(false)
        }

        // Set up auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("🔄 Auth state changed:", event, session?.user?.email || "No user")

          if (mounted) {
            setSession(session)
            setUser(session?.user ?? null)
            if (session) {
              setError(null)
            }
          }
        })

        authSubscription = subscription
      } catch (err) {
        console.error("❌ Failed to initialize auth:", err)
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : "Unknown initialization error"
          setError(`Failed to initialize authentication: ${errorMessage}`)
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

      // Check if we have a valid Supabase client
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client not available")
      }

      // Test connection first
      const { data: healthCheck } = await supabase.from("campaigns").select("count").limit(1).maybeSingle()
      console.log("🏥 Connection test:", healthCheck ? "✅ Connected" : "⚠️ Limited connectivity")

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ Supabase auth error:", error)

        // Handle specific error types
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please check your credentials and try again.")
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error("Please verify your email before logging in. Check your inbox for a verification link.")
        } else if (error.message.includes("Too many requests")) {
          throw new Error("Too many login attempts. Please wait a moment and try again.")
        } else if (error.message.includes("Network")) {
          throw new Error("Network connection issue. Please check your internet connection and try again.")
        } else {
          throw new Error(`Login failed: ${error.message}`)
        }
      }

      if (!data.user) {
        throw new Error("Login failed: No user data received")
      }

      console.log("✅ User signed in successfully")
      return { error: null }
    } catch (error) {
      console.error("❌ Sign in error:", error)

      // Return a more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during login"
      return {
        error: {
          message: errorMessage,
          originalError: error,
        },
      }
    }
  }

  const signOut = async () => {
    try {
      console.log("👋 Signing out user")

      // Try to get Supabase client with error handling
      let supabase
      try {
        supabase = getSupabaseClient()
      } catch (clientError) {
        console.warn("⚠️ Could not get Supabase client for sign out, clearing local state:", clientError)
        // Clear local state even if Supabase client fails
        setUser(null)
        setSession(null)
        setError(null)
        return
      }

      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.warn("⚠️ Supabase sign out error (clearing local state anyway):", error)
        // Don't throw error, just log it and clear local state
      } else {
        console.log("✅ User signed out successfully from Supabase")
      }

      // Always clear local state regardless of Supabase response
      setUser(null)
      setSession(null)
      setError(null)
    } catch (error) {
      console.warn("⚠️ Sign out error (clearing local state anyway):", error)
      // Don't throw the error, just clear local state
      setUser(null)
      setSession(null)
      setError(null)
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
      console.log("📤 Update data:", data)

      const supabase = getSupabaseClient()

      // Prepare auth.users update
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

      // Update auth.users first
      console.log("📤 Updating auth.users with:", updateData)
      const { data: updatedUser, error: authError } = await supabase.auth.updateUser(updateData)

      if (authError) {
        console.error("❌ Auth update error:", authError)
        throw authError
      }

      console.log("✅ Auth.users updated successfully")

      // Now update public.profiles table
      const profileUpdates: any = {}

      if (data.name !== undefined) {
        profileUpdates.full_name = data.name
      }
      if (data.avatar_url !== undefined) {
        profileUpdates.avatar_url = data.avatar_url
      }

      // Always update the updated_at timestamp
      profileUpdates.updated_at = new Date().toISOString()

      if (Object.keys(profileUpdates).length > 1) {
        // More than just updated_at
        console.log("📤 Updating public.profiles with:", profileUpdates)

        const { error: profileError } = await supabase.from("profiles").update(profileUpdates).eq("id", user.id)

        if (profileError) {
          console.error("❌ Profile table update error:", profileError)
          // Don't throw this error, just log it since auth.users was updated successfully
          console.warn("⚠️ Auth.users updated but profiles table sync failed:", profileError.message)
        } else {
          console.log("✅ Public.profiles updated successfully")
        }
      }

      console.log("✅ Profile update completed")
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
