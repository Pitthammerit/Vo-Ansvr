"use client"

import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { useState } from "react"

export default function SessionDebugPage() {
  const { user, session, signOut } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const checkSession = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.getSession()
      setDebugInfo({
        authContextUser: user,
        authContextSession: session,
        supabaseSession: data.session,
        supabaseError: error,
        localStorage: typeof window !== "undefined" ? localStorage.getItem("ansvr.auth.token") : null,
      })
    } catch (err) {
      setDebugInfo({ error: err })
    }
  }

  const forceSignOut = async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }
      window.location.reload()
    } catch (err) {
      console.error("Force sign out error:", err)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Session Debug</h1>

      <div className="space-y-4 mb-6">
        <button onClick={checkSession} className="bg-blue-600 px-4 py-2 rounded">
          Check Current Session
        </button>

        <button onClick={signOut} className="bg-red-600 px-4 py-2 rounded ml-4">
          Normal Sign Out
        </button>

        <button onClick={forceSignOut} className="bg-red-800 px-4 py-2 rounded ml-4">
          Force Sign Out + Clear Storage
        </button>
      </div>

      {debugInfo && (
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-bold mb-2">Debug Info:</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
