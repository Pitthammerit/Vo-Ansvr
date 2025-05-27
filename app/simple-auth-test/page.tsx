"use client"

import type React from "react"

import { useState } from "react"
import { SimpleAuthProvider, useSimpleAuth } from "@/lib/simple-auth"

function AuthTestContent() {
  const { user, session, loading, error, signIn, signOut } = useSimpleAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signingIn, setSigningIn] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigningIn(true)

    const result = await signIn(email, password)

    if (result.error) {
      alert(`Sign in failed: ${result.error.message}`)
    }

    setSigningIn(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Simple Auth Test</h1>

        {/* Status */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Status</h2>
          <div className="space-y-2 text-sm">
            <div>Loading: {loading ? "Yes" : "No"}</div>
            <div>User: {user?.email || "None"}</div>
            <div>Session: {session ? "Active" : "None"}</div>
            <div>Error: {error || "None"}</div>
          </div>
        </div>

        {/* Sign In Form */}
        {!user && (
          <div className="bg-gray-900 border border-gray-700 rounded p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Sign In</h2>
            <form onSubmit={handleSignIn} className="space-y-4">
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
              <button
                type="submit"
                disabled={signingIn}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded"
              >
                {signingIn ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        )}

        {/* User Info */}
        {user && (
          <div className="bg-gray-900 border border-gray-700 rounded p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">User Info</h2>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              {JSON.stringify(
                {
                  id: user.id,
                  email: user.email,
                  emailConfirmed: user.email_confirmed_at,
                  createdAt: user.created_at,
                  metadata: user.user_metadata,
                },
                null,
                2,
              )}
            </pre>
            <button onClick={signOut} className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              Sign Out
            </button>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => (window.location.href = "/debug/simple-test")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Run Simple Tests
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SimpleAuthTestPage() {
  return (
    <SimpleAuthProvider>
      <AuthTestContent />
    </SimpleAuthProvider>
  )
}
