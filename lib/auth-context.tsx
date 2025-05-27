"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient, checkSupabaseHealth } from "./supabase"
import { createLogger } from "./debug"

// Component-specific logger
const logger = createLogger("Auth")

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
  const [supabase, setSupabase] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const subscriptionRef = useRef<any>(null)
  const mountedRef = useRef(true)
  const initializationAttempts = useRef(0)
  const maxInitializationAttempts = 3

  // Initialize Supabase client with retry logic
  const initializeSupabase = useCallback(async () => {
    if (initializationAttempts.current >= maxInitializationAttempts) {
      logger.error("Max initialization attempts reached")
      setError("Failed to initialize authentication service after multiple attempts")
      setLoading(false)
      setInitialized(true)
      return
    }

    initializationAttempts.current++
    logger.debug(`Initializing Supabase client (attempt ${initializationAttempts.current})...`)

    try {
      // First check if Supabase is healthy
      const healthCheck = await checkSupabaseHealth()
      if (healthCheck.status === "unhealthy") {
        throw new Error(healthCheck.message)
      }

      const client = await getSupabaseClient()

      if (mountedRef.current) {
        setSupabase(client)
        setError(null)
        logger.info("✅ Supabase client initialized successfully")
      }
    } catch (error) {
      logger.error("❌ Failed to initialize Supabase:", error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      if (mountedRef.current) {
        setError(`Authentication service initialization failed: ${errorMessage}`)

        // If this was our last attempt, stop loading
        if (initializationAttempts.current >= maxInitializationAttempts) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }
  }, [])

  // Retry initialization function
  const retryInitialization = useCallback(async () => {
    initializationAttempts.current = 0
    setError(null)
    setLoading(true)
    setInitialized(false)
    await initializeSupabase()
  }, [initializeSupabase])

  // Initial Supabase setup
  useEffect(() => {
    initializeSupabase()

    return () => {
      mountedRef.current = false
    }
  }, [initializeSupabase])

  // Initialize auth when Supabase is ready
  useEffect(() => {
    if (!supabase || initialized) return

    let isMounted = true

    const initializeAuth = async () => {
      try {
        logger.debug("🔐 Initializing authentication...")

        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          logger.error("Error getting session:", error)
          if (isMounted && mountedRef.current) {
            setError(`Failed to get session: ${error.message}`)
          }
        } else {
          logger.info("Session retrieved:", session?.user?.email || "No session")
        }

        if (isMounted && mountedRef.current) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
          setInitialized(true)
        }

        // Set up auth state listener
        if (isMounted && !subscriptionRef.current) {
          logger.debug("👂 Setting up auth state listener...")

          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mountedRef.current) return

            logger.info(`🔄 Auth state changed: ${event}`, session?.user?.email || "No user")

            setSession(session)
            setUser(session?.user ?? null)
          })

          subscriptionRef.current = subscription
        }
      } catch (error) {
        logger.error("Error in initializeAuth:", error)
        if (isMounted && mountedRef.current) {
          setError(`Authentication initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`)
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
    }
  }, [supabase, initialized])

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    // Check if user has admin role in metadata
    const userRole = user.user_metadata?.role
    if (userRole === "admin") {
      setIsAdmin(true)
    } else {
      // Check admin email list
      const adminEmails = ["admin@example.com", "owewill22@gmail.com"] // Add your admin emails
      setIsAdmin(adminEmails.includes(user.email || ""))
    }
  }, [user])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        logger.debug("🧹 Cleaning up auth subscription")
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
      mountedRef.current = false
    }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      if (!supabase) {
        return { error: { message: "Authentication service is not available. Please try again later." } }
      }

      try {
        logger.debug("📝 Signing up user:", email)

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

        // If user needs email verification
        if (data.user && !data.session) {
          logger.info("✅ User signed up, email verification required")
          return { error: null, needsEmailVerification: true }
        }

        logger.info("✅ User signed up successfully")
        return { error: null, needsEmailVerification: false }
      } catch (error) {
        logger.error("Sign up error:", error)
        return { error }
      }
    },
    [supabase],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { error: { message: "Authentication service is not available. Please try again later." } }
      }

      try {
        logger.debug("🔑 Signing in user:", email)

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        logger.info("✅ User signed in successfully")
        return { error: null }
      } catch (error) {
        logger.error("Sign in error:", error)
        return { error }
      }
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    if (!supabase) {
      logger.error("Cannot sign out: Authentication service not available")
      return
    }

    try {
      logger.debug("👋 Signing out user")

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      logger.info("✅ User signed out successfully")
    } catch (error) {
      logger.error("Sign out error:", error)
    }
  }, [supabase])

  const resetPassword = useCallback(
    async (email: string) => {
      if (!supabase) {
        return { error: { message: "Authentication service is not available. Please try again later." } }
      }

      try {
        logger.debug("🔄 Resetting password for:", email)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        if (error) throw error

        logger.info("✅ Password reset email sent")
        return { error: null }
      } catch (error) {
        logger.error("Password reset error:", error)
        return { error }
      }
    },
    [supabase],
  )

  const updatePassword = useCallback(
    async (password: string) => {
      if (!supabase) {
        return { error: { message: "Authentication service is not available. Please try again later." } }
      }

      try {
        logger.debug("🔐 Updating password")

        const { error } = await supabase.auth.updateUser({
          password,
        })

        if (error) throw error

        logger.info("✅ Password updated successfully")
        return { error: null }
      } catch (error) {
        logger.error("Password update error:", error)
        return { error }
      }
    },
    [supabase],
  )

  const updateProfile = useCallback(
    async (data: { name?: string; email?: string; avatar_url?: string }) => {
      if (!supabase || !user) {
        return { error: { message: "Not authenticated or service unavailable" } }
      }

      try {
        logger.debug("👤 Updating profile for:", user.email)

        const { error } = await supabase.auth.updateUser({
          email: data.email,
          data: {
            name: data.name,
            avatar_url: data.avatar_url,
          },
        })

        if (error) throw error

        logger.info("✅ Profile updated successfully")
        return { error: null }
      } catch (error) {
        logger.error("Profile update error:", error)
        return { error }
      }
    },
    [supabase, user],
  )

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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
