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
    let mounted = true
    let authSubscription: any = null

    const initializeAuth = async () => {
      try {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.auth.getSession()

        if (mounted) {
          if (error && !error.message.includes("session_not_found")) {
            setError(`Session error: ${error.message}`)
          } else {
            setSession(data.session)
            setUser(data.session?.user ?? null)
            setError(null)
          }
          setLoading(false)
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
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
    const appMetadataRole = user.app_metadata?.role
    const isAdminRole = userRole === "admin" || appMetadataRole === "admin"

    setIsAdmin(isAdminRole)
  }, [user])

  const signUp = async (email: string, password: string, name: string) => {
    try {
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
        return { error: null, needsEmailVerification: true }
      }

      return { error: null, needsEmailVerification: false }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please check your credentials and try again.")
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error("Please verify your email before logging in. Check your inbox for a verification link.")
        } else {
          throw new Error(`Login failed: ${error.message}`)
        }
      }

      if (!data.user) {
        throw new Error("Login failed: No user data received")
      }

      return { error: null }
    } catch (error) {
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
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      // Continue with local cleanup even if remote signout fails
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (data: { name?: string; email?: string; avatar_url?: string }) => {
    if (!user) {
      return { error: { message: "Not authenticated" } }
    }

    try {
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

      const { error } = await supabase.auth.updateUser(updateData)

      if (error) throw error

      return { error: null }
    } catch (error) {
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
