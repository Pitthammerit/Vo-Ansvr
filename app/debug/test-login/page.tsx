"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SessionStatus } from "@/components/session-status"

export default function TestLoginPage() {
  const { signIn, signOut, user, session, loading } = useAuth()
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("password123")
  const [testLoading, setTestLoading] = useState(false)
  const [result, setResult] = useState<string>("")

  const handleTestLogin = async () => {
    setTestLoading(true)
    setResult("")

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setResult(`Login failed: ${error.message}`)
      } else {
        setResult("Login successful!")
      }
    } catch (err) {
      setResult(`Login error: ${err}`)
    } finally {
      setTestLoading(false)
    }
  }

  const handleTestLogout = async () => {
    setTestLoading(true)
    try {
      await signOut()
      setResult("Logout successful!")
    } catch (err) {
      setResult(`Logout error: ${err}`)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <SessionStatus />

      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Test Login Flow</h1>
          <p className="text-gray-400">Test authentication with debug information</p>
        </div>

        <Card className="mb-6 bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Current State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Loading:</span>
                <span className={`ml-2 ${loading ? "text-yellow-400" : "text-green-400"}`}>
                  {loading ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">User:</span>
                <span className={`ml-2 ${user ? "text-green-400" : "text-red-400"}`}>{user ? user.email : "None"}</span>
              </div>
              <div>
                <span className="text-gray-400">Session:</span>
                <span className={`ml-2 ${session ? "text-green-400" : "text-red-400"}`}>
                  {session ? "Present" : "Missing"}
                </span>
              </div>
              {user && (
                <div>
                  <span className="text-gray-400">Email Verified:</span>
                  <span className={`ml-2 ${user.email_confirmed_at ? "text-green-400" : "text-red-400"}`}>
                    {user.email_confirmed_at ? "Yes" : "No"}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!user ? (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Test Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 border border-gray-600 rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 border border-gray-600 rounded"
                />
              </div>
              <button
                onClick={handleTestLogin}
                disabled={testLoading}
                className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 text-white py-2 rounded"
              >
                {testLoading ? "Testing..." : "Test Login"}
              </button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Logged In</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-400 mb-4">Successfully logged in as {user.email}</p>
              <button
                onClick={handleTestLogout}
                disabled={testLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded"
              >
                {testLoading ? "Logging out..." : "Test Logout"}
              </button>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="mt-4 bg-gray-900 border-gray-700">
            <CardContent className="pt-6">
              <p className={`text-sm ${result.includes("successful") ? "text-green-400" : "text-red-400"}`}>{result}</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => (window.location.href = "/debug/session")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Session Diagnostics
          </button>
          <button
            onClick={() => (window.location.href = "/debug/auth")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded"
          >
            Auth Diagnostics
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
