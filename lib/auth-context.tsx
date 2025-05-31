"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "./supabase"

// Update the UserProfile interface to match your actual schema
interface UserProfile {
  id: string
  created_at: string
  full_name?: string | null
  avatar_url?: string | null
  updated_at: string
  user_type?: string | null
  use_default_videos?: boolean | null
  default_welcome_video_id?: string | null
  default_thank_you_video_id?: string | null
  default_thank_you_type?: string | null
  default_thank_you_message?: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null // New field for public.profiles data
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
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
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
          }
        }

        if (!supabase) {
          throw new Error("Failed to initialize Supabase client")
        }
        console.log("✅ Got Supabase client")

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
            if (!error.message.includes("session_not_found")) {
              setError(`Session error: ${error.message}`)
            }
          } else {
            setSession(data.session)
            setUser(data.session?.user ?? null)
            setError(null)
            if (data.session?.user) {
              const fetchProfile = async (userId: string) => {
                try {
                  const supabase = getSupabaseClient()
                  const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select(`
        id, 
        created_at,
        full_name, 
        avatar_url,
        updated_at,
        user_type,
        use_default_videos,
        default_welcome_video_id,
        default_thank_you_video_id,
        default_thank_you_type,
        default_thank_you_message
      `)
                    .eq("id", userId)
                    .single()
                  if (profileError) {
                    console.error("Error fetching initial profile:", profileError)
                    if (mounted) setProfile(null)
                  } else {
                    if (mounted) setProfile(profileData as UserProfile)
                  }
                } catch (e) {
                  console.error("Exception fetching initial profile:", e)
                  if (mounted) setProfile(null)
                }
              }
              fetchProfile(data.session.user.id)
            } else {
              if (mounted) setProfile(null)
            }
          }
          setLoading(false)
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("🔄 Auth state changed:", event, session?.user?.email || "No user")
          if (mounted) {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
              // Fetch profile data when user is available
              const fetchProfile = async (userId: string) => {
                try {
                  const supabase = getSupabaseClient()
                  const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select(`
        id, 
        created_at,
        full_name, 
        avatar_url,
        updated_at,
        user_type,
        use_default_videos,
        default_welcome_video_id,
        default_thank_you_video_id,
        default_thank_you_type,
        default_thank_you_message
      `)
                    .eq("id", userId)
                    .single()

                  if (profileError) {
                    console.error("Error fetching profile:", profileError)
                    setProfile(null) // Or handle error appropriately
                  } else {
                    setProfile(profileData as UserProfile)
                  }
                } catch (e) {
                  console.error("Exception fetching profile:", e)
                  setProfile(null)
                }
              }
              fetchProfile(session.user.id)
            } else {
              setProfile(null) // Clear profile if no user
            }
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
          data: { name }, // This name will be picked up by handle_new_user
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
      if (!supabase) {
        throw new Error("Supabase client not available")
      }
      const { data: healthCheck } = await supabase.from("campaigns").select("count").limit(1).maybeSingle()
      console.log("🏥 Connection test:", healthCheck ? "✅ Connected" : "⚠️ Limited connectivity")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        console.error("❌ Supabase auth error:", error)
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
      let supabase
      try {
        supabase = getSupabaseClient()
      } catch (clientError) {
        console.warn("⚠️ Could not get Supabase client for sign out, clearing local state:", clientError)
        setUser(null)
        setSession(null)
        setError(null)
        return
      }
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.warn("⚠️ Supabase sign out error (clearing local state anyway):", error)
      } else {
        console.log("✅ User signed out successfully from Supabase")
      }
      setUser(null)
      setSession(null)
      setError(null)
    } catch (error) {
      console.warn("⚠️ Sign out error (clearing local state anyway):", error)
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

  // --- MODIFIED updateProfile ---
  const updateProfile = async (data: { name?: string; email?: string; avatar_url?: string }) => {
    if (!user) {
      return { error: { message: "Not authenticated" } }
    }

    try {
      console.log("👤 Updating profile in public.profiles for:", user.email)
      console.log("📤 Update data:", data)

      const supabase = getSupabaseClient()
      const profileUpdates: any = {}

      if (data.name !== undefined) {
        profileUpdates.full_name = data.name
      }
      if (data.avatar_url !== undefined) {
        profileUpdates.avatar_url = data.avatar_url
      }
      // Note: We are NOT updating email here directly. Email changes should go through supabase.auth.updateUser({ email })
      // and then a trigger (if desired) could sync it to public.profiles.email.
      // For now, profile page only updates name and avatar.

      if (Object.keys(profileUpdates).length === 0) {
        console.log("🤷 No actual profile data to update in public.profiles")
        return { error: null } // No changes to make
      }

      profileUpdates.updated_at = new Date().toISOString()

      console.log("📤 Updating public.profiles with:", profileUpdates)
      const { error: profileError } = await supabase.from("profiles").update(profileUpdates).eq("id", user.id)

      if (profileError) {
        console.error("❌ Profile table update error:", profileError)
        throw profileError
      }

      console.log("✅ Public.profiles updated successfully")

      // Refresh the profile data in context
      const { data: updatedProfile, error: fetchError } = await supabase
        .from("profiles")
        .select(`
    id, 
    created_at,
    full_name, 
    avatar_url,
    updated_at,
    user_type,
    use_default_videos,
    default_welcome_video_id,
    default_thank_you_video_id,
    default_thank_you_type,
    default_thank_you_message
  `)
        .eq("id", user.id)
        .single()

      if (!fetchError && updatedProfile) {
        setProfile(updatedProfile as UserProfile)
      }

      // If email needs to be updated, it's a separate auth concern
      if (data.email && data.email !== user.email) {
        console.log("📧 Email change detected, attempting to update auth.users.email")
        const { error: emailUpdateError } = await supabase.auth.updateUser({ email: data.email })
        if (emailUpdateError) {
          console.error("❌ Error updating email in auth.users:", emailUpdateError)
          // Decide how to handle this: maybe return a partial success or specific error
          return { error: { message: `Profile updated, but email change failed: ${emailUpdateError.message}` } }
        }
        console.log("✅ Email update initiated in auth.users. User will need to confirm.")
      }

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
  // --- END MODIFIED updateProfile ---

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
    profile, // Add profile here
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
