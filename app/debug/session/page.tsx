"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClientSync } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react"

interface SessionDebugInfo {
  name: string
  status: "success" | "error" | "warning" | "info"
  message: string
  details?: any
}

export default function SessionDebugPage() {
  const { user, session, loading, error } = useAuth()
  const [debugInfo, setDebugInfo] = useState<SessionDebugInfo[]>([])
  const [showSensitive, setShowSensitive] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const runSessionDiagnostics = async () => {
    setRefreshing(true)
    const info: SessionDebugInfo[] = []

    // Check Auth Context State
    info.push({
      name: "Auth Context Loading State",
      status: loading ? "warning" : "success",
      message: loading ? "Auth context is still loading" : "Auth context loaded",
      details: { loading, hasError: !!error },
    })

    if (error) {
      info.push({
        name: "Auth Context Error",
        status: "error",
        message: error,
        details: error,
      })
    }

    // Check User State
    info.push({
      name: "User State",
      status: user ? "success" : "warning",
      message: user ? `User found: ${user.email}` : "No user found",
      details: user
        ? {
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata,
          }
        : null,
    })

    // Check Session State
    info.push({
      name: "Session State",
      status: session ? "success" : "warning",
      message: session ? "Session found" : "No session found",
      details: session
        ? {
            access_token: session.access_token ? "Present" : "Missing",
            refresh_token: session.refresh_token ? "Present" : "Missing",
            expires_at: session.expires_at,
            expires_in: session.expires_in,
            token_type: session.token_type,
            user_id: session.user?.id,
          }
        : null,
    })

    // Check Supabase Client Direct
    const supabase = getSupabaseClientSync()
    if (supabase) {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        info.push({
          name: "Direct Supabase Session Check",
          status: sessionError ? "error" : sessionData.session ? "success" : "warning",
          message: sessionError
            ? `Session error: ${sessionError.message}`
            : sessionData.session
              ? "Session found via direct check"
              : "No session found via direct check",
          details: { sessionData, sessionError },
        })

        const { data: userData, error: userError } = await supabase.auth.getUser()
        info.push({
          name: "Direct Supabase User Check",
          status: userError ? "error" : userData.user ? "success" : "warning",
          message: userError
            ? `User error: ${userError.message}`
            : userData.user
              ? `User found: ${userData.user.email}`
              : "No user found via direct check",
          details: { userData, userError },
        })
      } catch (error) {
        info.push({
          name: "Direct Supabase Check",
          status: "error",
          message: `Failed to check Supabase directly: ${error}`,
          details: error,
        })
      }
    }

    // Check Local Storage
    if (typeof window !== "undefined") {
      const storageKeys = ["ansvr.auth.token", "sb-auth-token", "supabase.auth.token"]

      storageKeys.forEach((key) => {
        const value = localStorage.getItem(key)
        info.push({
          name: `Local Storage: ${key}`,
          status: value ? "info" : "warning",
          message: value ? "Token found in storage" : "No token in storage",
          details: value ? (showSensitive ? value : "Hidden - toggle to show") : null,
        })
      })

      // Check all localStorage keys for auth-related items
      const allKeys = Object.keys(localStorage)
      const authKeys = allKeys.filter(
        (key) => key.includes("auth") || key.includes("supabase") || key.includes("token") || key.includes("session"),
      )

      if (authKeys.length > 0) {
        info.push({
          name: "All Auth-Related Storage Keys",
          status: "info",
          message: `Found ${authKeys.length} auth-related keys`,
          details: authKeys.map((key) => ({
            key,
            hasValue: !!localStorage.getItem(key),
            value: showSensitive ? localStorage.getItem(key) : "Hidden",
          })),
        })
      }
    }

    // Check Cookies
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";").map((c) => c.trim())
      const authCookies = cookies.filter(
        (cookie) =>
          cookie.includes("auth") ||
          cookie.includes("supabase") ||
          cookie.includes("token") ||
          cookie.includes("session"),
      )

      info.push({
        name: "Auth-Related Cookies",
        status: authCookies.length > 0 ? "info" : "warning",
        message:
          authCookies.length > 0 ? `Found ${authCookies.length} auth-related cookies` : "No auth-related cookies found",
        details: authCookies.length > 0 ? authCookies : null,
      })
    }

    // Check URL for auth fragments
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      const hasAuthParams =
        url.hash.includes("access_token") || url.searchParams.has("code") || url.searchParams.has("token")

      info.push({
        name: "URL Auth Parameters",
        status: hasAuthParams ? "info" : "success",
        message: hasAuthParams ? "Auth parameters found in URL" : "No auth parameters in URL (normal)",
        details: hasAuthParams
          ? {
              hash: url.hash,
              searchParams: Object.fromEntries(url.searchParams.entries()),
            }
          : null,
      })
    }

    setDebugInfo(info)
    setRefreshing(false)
  }

  useEffect(() => {
    runSessionDiagnostics()
  }, [user, session, loading, error, showSensitive])

  const getStatusIcon = (status: SessionDebugInfo["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "info":
        return <AlertCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const clearAllAuthData = () => {
    if (typeof window !== "undefined") {
      // Clear localStorage
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.includes("auth") || key.includes("supabase") || key.includes("token")) {
          localStorage.removeItem(key)
        }
      })

      // Clear cookies (basic attempt)
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.includes("auth") || name.includes("supabase") || name.includes("token")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        }
      })

      alert("Auth data cleared. Please refresh the page.")
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Session Diagnostics</h1>
          <p className="text-gray-400">Debug authentication session and user state</p>
        </div>

        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={runSessionDiagnostics}
            disabled={refreshing}
            className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 text-white px-6 py-2 rounded-md flex items-center gap-2"
          >
            {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {refreshing ? "Refreshing..." : "Refresh Diagnostics"}
          </button>

          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
          >
            {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showSensitive ? "Hide Sensitive" : "Show Sensitive"}
          </button>

          <button onClick={clearAllAuthData} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">
            Clear Auth Data
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
          >
            Back to Home
          </button>
        </div>

        {/* Current State Summary */}
        <Card className="mb-6 bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Current Authentication State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded">
                <span className="text-red-400 font-bold">Error: </span>
                <span className="text-red-300">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Diagnostics */}
        <div className="grid gap-4">
          {debugInfo.map((info, index) => (
            <Card key={index} className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-white">
                  {getStatusIcon(info.status)}
                  {info.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-sm mb-2 ${
                    info.status === "success"
                      ? "text-green-400"
                      : info.status === "error"
                        ? "text-red-400"
                        : info.status === "warning"
                          ? "text-yellow-400"
                          : "text-blue-400"
                  }`}
                >
                  {info.message}
                </p>
                {info.details && (
                  <pre className="text-xs text-gray-400 bg-gray-800 p-2 rounded mt-2 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {typeof info.details === "string" ? info.details : JSON.stringify(info.details, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Common Issues Guide */}
        <Card className="mt-8 bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🔍 Common Session Issues</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <div>
              <h3 className="font-bold text-white mb-2">1. Session Not Persisting</h3>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Check if localStorage is working properly</li>
                <li>• Verify storage key configuration in Supabase client</li>
                <li>• Check if cookies are being blocked</li>
                <li>• Ensure domain/subdomain settings are correct</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">2. Session Expired</h3>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Check if refresh token is present</li>
                <li>• Verify token expiration times</li>
                <li>• Ensure auto-refresh is enabled</li>
                <li>• Check for clock skew issues</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">3. Email Not Verified</h3>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Check email_confirmed_at field</li>
                <li>• Verify email confirmation settings in Supabase</li>
                <li>• Check spam folder for verification email</li>
                <li>• Ensure email templates are configured</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">4. Multiple Auth States</h3>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Clear all auth data and try again</li>
                <li>• Check for conflicting storage keys</li>
                <li>• Verify single Supabase client instance</li>
                <li>• Check for race conditions in auth flow</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
