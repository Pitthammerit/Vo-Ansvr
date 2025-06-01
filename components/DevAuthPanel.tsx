"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

export default function DevAuthPanel() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("")
  const [user, setUser] = useState<any>(null)
  const [supabase, setSupabase] = useState<any>(null)
  const [devMode, setDevMode] = useState(false)

  // Initialize Supabase client
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey)
      setSupabase(client)

      // Check if dev mode is enabled via URL parameter or localStorage
      const urlParams = new URLSearchParams(window.location.search)
      const devParam = urlParams.get("dev")
      const storedDevMode = localStorage.getItem("dev_mode") === "true"

      if (devParam === "true" || storedDevMode) {
        setDevMode(true)
        localStorage.setItem("dev_mode", "true")
      }

      // Check current auth state
      client.auth.getSession().then(({ data }) => {
        setUser(data.session?.user || null)
      })

      // Listen for auth changes
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null)
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    setStatus("Signing in...")

    // Remove dev password functionality
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setStatus(`Error: ${error.message}`)
      } else {
        setStatus("Login successful!")
      }
    } catch (error) {
      setStatus(`Exception: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleSignOut = async () => {
    if (!supabase) return

    // Remove dev auth check
    try {
      await supabase.auth.signOut()
      setStatus("Signed out successfully")
    } catch (error) {
      setStatus(`Sign out error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const toggleDevMode = () => {
    const newDevMode = !devMode
    setDevMode(newDevMode)
    localStorage.setItem("dev_mode", newDevMode ? "true" : "false")
  }

  if (!supabase) {
    return <div className="p-4 bg-red-100 text-red-800 rounded">Supabase client not initialized</div>
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-semibold mb-4">Developer Authentication Panel</h2>

      <div className="mb-4">
        <button
          onClick={toggleDevMode}
          className={`px-3 py-1 rounded text-sm ${devMode ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"}`}
        >
          Dev Mode: {devMode ? "ON" : "OFF"}
        </button>
      </div>

      {user ? (
        <div>
          <div className="mb-4 p-3 bg-green-100 rounded">
            <p>
              <strong>Logged in as:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
          </div>
          <button onClick={handleSignOut} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Sign Out
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Sign In
          </button>

          {status && <div className="mt-4 p-2 bg-gray-100 rounded">{status}</div>}
        </form>
      )}
    </div>
  )
}
