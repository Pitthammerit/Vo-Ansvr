"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

export default function SimpleLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [user, setUser] = useState<any>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      // Get environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase environment variables")
      }

      console.log("🔍 Creating Supabase client...")
      const supabase = createClient(supabaseUrl, supabaseKey)

      console.log("🔑 Attempting login...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      console.log("✅ Login successful:", data)
      setMessage("Login successful!")
      setUser(data.user)
    } catch (error) {
      console.error("❌ Login failed:", error)
      setMessage(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase environment variables")
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

      console.log("📝 Attempting signup...")
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        throw error
      }

      console.log("✅ Signup successful:", data)
      setMessage("Signup successful! Check your email for verification.")
    } catch (error) {
      console.error("❌ Signup failed:", error)
      setMessage(`Signup failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-8">Simple Login Test</h1>

        {user ? (
          <div className="bg-gray-900 border border-gray-700 rounded p-6">
            <h2 className="text-lg font-semibold mb-4">Logged In Successfully!</h2>
            <div className="text-sm text-gray-300 mb-4">
              <div>Email: {user.email}</div>
              <div>ID: {user.id}</div>
              <div>Confirmed: {user.email_confirmed_at ? "Yes" : "No"}</div>
            </div>
            <button
              onClick={() => {
                setUser(null)
                setEmail("")
                setPassword("")
                setMessage("")
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
            >
              Try Again
            </button>
          </div>
        ) : (
          <form className="bg-gray-900 border border-gray-700 rounded p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                required
              />
            </div>

            {message && (
              <div
                className={`text-sm p-2 rounded ${
                  message.includes("successful") ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded"
              >
                {loading ? "Loading..." : "Login"}
              </button>

              <button
                type="button"
                onClick={handleSignup}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded"
              >
                {loading ? "Loading..." : "Sign Up"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => (window.location.href = "/debug/simple-test")}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Run Diagnostic Tests
          </button>
        </div>
      </div>
    </div>
  )
}
