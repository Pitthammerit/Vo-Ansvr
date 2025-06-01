"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"

const AuthContext = createContext<{
  user: any | null
  loading: boolean
  signIn: (email: string) => Promise<any>
  signOut: () => Promise<void>
}>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    async function getInitialSession() {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })
  }, [])

  const signIn = async (email: string) => {
    const supabase = getSupabaseClient()
    return await supabase.auth.signInWithOtp({ email })
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  const value = { user, loading, signIn, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
