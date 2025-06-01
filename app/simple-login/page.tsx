"use client"

import type React from "react"

import { useState } from "react"
import { useSimpleAuth } from "@/lib/simple-auth"

export default function SimpleLoginPage() {
  const { user, loading, error, signIn, signOut } = useSimpleAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginStatus, setLoginStatus] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginStatus("Logging in...")

    // Remove dev password check
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setLoginStatus(`❌ Login failed: ${error.message}`)
      } else {
        setLoginStatus("✅ Login successful!")
      }
    } catch (err) {
      setLoginStatus(`❌ Exception: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      setLoginStatus("Logged out successfully")
    } catch (err) {
      setLoginStatus(`Logout error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Simple Login</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {user ? (
          <div>
            <div className="mb-4 p-3 bg-green-100 rounded-md">
              <p className="font-medium">Logged in as:</p>
              <p>{user.email}</p>
              <p className="text-sm text-gray-500">User ID: {user.id}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              Sign In
            </button>

            {loginStatus && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  loginStatus.includes("❌")
                    ? "bg-red-100 text-red-700"
                    : loginStatus.includes("✅")
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {loginStatus}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
