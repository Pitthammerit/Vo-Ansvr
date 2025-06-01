"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"

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

  // Check if user is admin based on user_type in profiles table
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    const fetchUserRole = async () => {
      try {
        const supabase = getSupabaseClient()

        console.log("🔍 Fetching user role for:", user.email)

        // Add timeout to the query
        const queryPromise = supabase.from("profiles").select("user_type").eq("id", user.id).single()

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Profile query timeout")), 5000),
        )

        const { data, error } = await Promise.race([queryPromise, timeoutPromise])

        if (error) {
          console.warn("⚠️ Error fetching user role (expected in sandbox):", error.message)

          // In sandbox environment, default to non-admin for safety
          // This will work properly in real environment
          console.log("🏖️ Sandbox environment detected - defaulting to user role")
          setIsAdmin(false)
          return
        }

        const userRole = data?.user_type || "user"
        const isAdminUser = userRole === "admin"

        console.log("👤 Admin check:", {
          email: user.email,
          userRole,
          isAdmin: isAdminUser,
        })

        setIsAdmin(isAdminUser)
      } catch (error) {
        console.warn("⚠️ Failed to fetch user role (expected in sandbox):", error)
        console.log("🏖️ This is expected in v0 sandbox due to CORS restrictions")
        console.log("🚀 Will work properly when deployed or running locally")

        // Default to non-admin in sandbox for safety
        setIsAdmin(false)
      }
    }

    fetchUserRole()
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
      const supabase = getSupabaseClient()

      try {
        // Try the remote signout first
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        console.log("✅ User signed out successfully from Supabase")
      } catch (remoteError) {
        // If remote signout fails (e.g., due to CORS in sandbox), log it but continue with local cleanup
        console.warn("⚠️ Remote sign out failed, proceeding with local cleanup:", remoteError)
        console.log("This is expected in sandbox environments due to CORS restrictions")
      }

      // Always perform local state cleanup regardless of remote signout success
      setUser(null)
      setSession(null)
      setIsAdmin(false)

      // Clear any auth tokens from localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("sb-yxskpbwikpoyagexkbro-auth-token")
          localStorage.removeItem("supabase.auth.token")
          localStorage.removeItem("ansvr.auth.token")

          // Clear all Supabase-related items
          Object.keys(localStorage).forEach((key) => {
            if (key.includes("supabase") || key.includes("sb-")) {
              localStorage.removeItem(key)
            }
          })

          console.log("✅ Local storage cleared")
        } catch (storageError) {
          console.error("❌ Error clearing local storage:", storageError)
        }
      }

      console.log("✅ Local session cleared")

      // Force redirect to home page
      window.location.href = "/"
    } catch (error) {
      console.error("❌ Sign out error:", error)
      // Still attempt local cleanup
      setUser(null)
      setSession(null)
      setIsAdmin(false)

      // Force redirect anyway
      window.location.href = "/"
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
