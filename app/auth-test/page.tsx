"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw, User, LogOut } from "lucide-react"

export default function AuthTestPage() {
  const { user, session, loading, error, signOut, recoverSession } = useAuth()
  const [testResults, setTestResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)

  const runAuthTests = async () => {
    setTesting(true)
    const results = []

    // Test 1: Auth Context State
    results.push({
      name: "Auth Context State",
      status: !loading && !error ? "pass" : "fail",
      details: { loading, hasUser: !!user, hasSession: !!session, error },
    })

    // Test 2: User Data
    results.push({
      name: "User Data",
      status: user ? "pass" : "info",
      details: user
        ? {
            id: user.id,
            email: user.email,
            emailConfirmed: !!user.email_confirmed_at,
            metadata: user.user_metadata,
          }
        : "No user logged in",
    })

    // Test 3: Session Data
    results.push({
      name: "Session Data",
      status: session ? "pass" : "info",
      details: session
        ? {
            expiresAt: session.expires_at,
            tokenType: session.token_type,
            hasAccessToken: !!session.access_token,
            hasRefreshToken: !!session.refresh_token,
          }
        : "No active session",
    })

    // Test 4: Session Recovery
    if (!user && !loading) {
      try {
        const recoveryResult = await recoverSession()
        results.push({
          name: "Session Recovery",
          status: recoveryResult.success ? "pass" : "fail",
          details: recoveryResult,
        })
      } catch (e) {
        results.push({
          name: "Session Recovery",
          status: "fail",
          details: { error: e instanceof Error ? e.message : "Unknown error" },
        })
      }
    }

    setTestResults(results)
    setTesting(false)
  }

  const handleSignOut = async () => {
    await signOut()
    setTestResults([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "fail":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "info":
        return <User className="w-4 h-4 text-blue-500" />
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Authentication Test</h1>
          <p className="text-gray-400">Test and verify the authentication system</p>
        </div>

        {/* Current Status */}
        <Card className="bg-gray-900 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Current Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Status:</span>
                {loading ? (
                  <span className="text-yellow-400 flex items-center gap-1">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : user ? (
                  <span className="text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Authenticated
                  </span>
                ) : (
                  <span className="text-gray-400">Not authenticated</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">User:</span>
                <span className="text-white">{user?.email || "None"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Session:</span>
                <span className="text-white">{session ? "Active" : "None"}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <Button onClick={runAuthTests} disabled={testing} className="bg-[#2DAD71] hover:bg-[#2DAD71]/90">
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Auth Tests"
            )}
          </Button>

          {user && (
            <Button onClick={handleSignOut} variant="outline" className="border-gray-600 text-gray-300">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}

          <Button
            onClick={() => (window.location.href = "/auth/login")}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Go to Login
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border border-gray-700 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium text-white">{result.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          result.status === "pass"
                            ? "bg-green-900/20 text-green-400"
                            : result.status === "fail"
                              ? "bg-red-900/20 text-red-400"
                              : "bg-blue-900/20 text-blue-400"
                        }`}
                      >
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-400 bg-gray-800 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
