"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "./supabase"
import { createLogger } from "./debug"

// Global auth initialization tracking
let globalAuthInitialized = false
const AUTH_INIT_KEY = "ansvr_auth_initialized"

// Development configuration - client-safe
const DEV_CONFIG = {
  PERSISTENT_LOGIN: typeof window !== "undefined" ? window.location.hostname === "localhost" : false,
  DEV_USER_EMAIL: "owewill22@gmail.com",
  DEV_USER_PASSWORD: process.env.NEXT_PUBLIC_DEV_PASSWORD || "dev123456",
  STORAGE_KEY: "ansvr_dev_persistent_login",
}

// Component-specific logger
const logger = createLogger("Auth")

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: any; needsEmailVerification?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  updateProfile: (data: { name?: string; email?: string; avatar_url?: string }) => Promise<{ error: any }>
  isAdmin: boolean
  devUtils?: {
    enablePersistentLogin: () => void
    disablePersistentLogin: () => void
    isPersistentLoginEnabled: () => boolean
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Global counter to prevent multiple providers
let authProviderCount = 0
const AUTH_PROVIDER_ID = `auth_provider_${Date.now()}_${Math.random().toString(36).substring(7)}`

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

const isBrowser = typeof window !== "undefined"

// Development helper: Check if dev user should be auto-logged in
const shouldAutoLoginDevUser = (): boolean => {
  if (!DEV_CONFIG.PERSISTENT_LOGIN || !isBrowser) return false

  const persistentLogin = localStorage.getItem(DEV_CONFIG.STORAGE_KEY)
  return persistentLogin === "enabled"
}

// Development helper: Enable/disable persistent login
const setDevPersistentLogin = (enabled: boolean): void => {
  if (!DEV_CONFIG.PERSISTENT_LOGIN || !isBrowser) return

  if (enabled) {
    localStorage.setItem(DEV_CONFIG.STORAGE_KEY, "enabled")
  } else {
    localStorage.removeItem(DEV_CONFIG.STORAGE_KEY)
  }
}

// Development helper: Auto-login dev user
const autoLoginDevUser = async (supabase: any): Promise<boolean> => {
  if (!DEV_CONFIG.PERSISTENT_LOGIN || !supabase) return false

  try {
    logger.debug("🔧 Attempting auto-login for dev user:", DEV_CONFIG.DEV_USER_EMAIL)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEV_CONFIG.DEV_USER_EMAIL,
      password: DEV_CONFIG.DEV_USER_PASSWORD,
    })

    if (error) {
      logger.warn("Dev auto-login failed:", error.message)
      return false
    }

    logger.info("✅ Dev user auto-logged in successfully")
    setDevPersistentLogin(true)
    return true
  } catch (error) {
    logger.error("Dev auto-login error:", error)
    return false
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClientMounted, setIsClientMounted] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const subscriptionRef = useRef<any>(null)
  const initializationRef = useRef(false)
  const mountedRef = useRef(true)

  // Track provider instances
  useEffect(() => {
    authProviderCount++
    logger.debug(`Provider mounted (count: ${authProviderCount}, id: ${AUTH_PROVIDER_ID})`)

    if (authProviderCount > 1) {
      logger.warn(`Multiple AuthProvider instances detected (${authProviderCount}). This may cause issues.`)
    }

    return () => {
      authProviderCount--
      mountedRef.current = false
      logger.debug(`Provider unmounted (count: ${authProviderCount})`)
    }
  }, [])

  // Initialize Supabase client
  useEffect(() => {
    let isMounted = true

    const initializeSupabase = async () => {
      try {
        logger.debug("Initializing Supabase client...")
        const client = await getSupabaseClient()

        if (isMounted && mountedRef.current) {
          setSupabase(client)
          logger.info("Supabase client set: ✅ Connected")
        }
      } catch (error) {
        logger.error("Error initializing Supabase:", error)
        if (isMounted && mountedRef.current) {
          setSupabase(null)
        }
      }
    }

    initializeSupabase()

    return () => {
      isMounted = false
    }
  }, [])

  // Handle client mounting
  useEffect(() => {
    setIsClientMounted(true)
  }, [])

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
      // Check admin email list (could be stored in env var or config)
      const adminEmails = ["admin@example.com"] // Replace with your admin emails
      setIsAdmin(adminEmails.includes(user.email || ""))
    }
  }, [user])

  // Auth initialization
  useEffect(() => {
    if (!isClientMounted || !supabase) {
      return
    }

    // Prevent multiple auth initializations across the app
    if (isBrowser && globalAuthInitialized) {
      logger.debug("Auth already initialized globally, skipping")
      setLoading(false)
      return
    }

    let isMounted = true
    globalAuthInitialized = true

    // Mark auth as initialized
    if (isBrowser) {
      sessionStorage.setItem(AUTH_INIT_KEY, AUTH_PROVIDER_ID)
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        logger.debug("🔐 Initializing authentication...")

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          logger.error("Error getting session:", error)
        } else {
          logger.info("Session retrieved:", session?.user?.email || "No session")
        }

        // If no session and in dev mode, try auto-login
        if (!session && DEV_CONFIG.PERSISTENT_LOGIN && shouldAutoLoginDevUser()) {
          const autoLoginSuccess = await autoLoginDevUser(supabase)
          if (autoLoginSuccess) {
            // Get the new session after auto-login
            const {
              data: { session: newSession },
            } = await supabase.auth.getSession()
            if (isMounted && mountedRef.current) {
              setSession(newSession)
              setUser(newSession?.user ?? null)
              setLoading(false)
            }
            return
          }
        }

        if (isMounted && mountedRef.current) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        logger.error("Error in initializeAuth:", error)
        if (isMounted && mountedRef.current) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes - ensure only one subscription globally
    if (!subscriptionRef.current) {
      logger.debug("👂 Setting up auth state listener...")

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted || !mountedRef.current) return

        logger.info(`🔄 Auth state changed: ${event}`, session?.user?.email || "No user")

        setSession(session)
        setUser(session?.user ?? null)

        if (loading) {
          setLoading(false)
        }
      })

      subscriptionRef.current = subscription
    }

    return () => {
      isMounted = false

      // Clean up subscription
      if (subscriptionRef.current) {
        logger.debug("🧹 Cleaning up auth subscription")
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }

      // Reset global state if we're the owner
      if (isBrowser) {
        const currentInitializer = sessionStorage.getItem(AUTH_INIT_KEY)
        if (currentInitializer === AUTH_PROVIDER_ID) {
          globalAuthInitialized = false
          sessionStorage.removeItem(AUTH_INIT_KEY)
          logger.debug("Reset global auth state")
        }
      }
    }
  }, [supabase, isClientMounted, loading])

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      if (!supabase) {
        return { error: { message: "Supabase not configured. Please set up environment variables." } }
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
        return { error: { message: "Supabase not configured. Please set up environment variables." } }
      }

      try {
        logger.debug("🔑 Signing in user:", email)

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Enable persistent login for dev user
        if (DEV_CONFIG.PERSISTENT_LOGIN && email === DEV_CONFIG.DEV_USER_EMAIL) {
          setDevPersistentLogin(true)
          logger.debug("🔧 Enabled persistent login for dev user")
        }

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
      logger.error("Cannot sign out: Supabase not configured")
      return
    }

    try {
      logger.debug("👋 Signing out user")

      // Disable persistent login for dev user
      if (DEV_CONFIG.PERSISTENT_LOGIN && user?.email === DEV_CONFIG.DEV_USER_EMAIL) {
        setDevPersistentLogin(false)
        logger.debug("🔧 Disabled persistent login for dev user")
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      logger.info("✅ User signed out successfully")
    } catch (error) {
      logger.error("Sign out error:", error)
    }
  }, [supabase, user])

  const resetPassword = useCallback(
    async (email: string) => {
      if (!supabase) {
        return { error: { message: "Supabase not configured. Please set up environment variables." } }
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
        return { error: { message: "Supabase not configured. Please set up environment variables." } }
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
        return { error: { message: "Not authenticated" } }
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
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAdmin,
    // Development utilities
    ...(DEV_CONFIG.PERSISTENT_LOGIN && {
      devUtils: {
        enablePersistentLogin: () => setDevPersistentLogin(true),
        disablePersistentLogin: () => setDevPersistentLogin(false),
        isPersistentLoginEnabled: shouldAutoLoginDevUser,
      },
    }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
