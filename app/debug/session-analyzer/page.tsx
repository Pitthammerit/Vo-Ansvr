"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClientSync, checkSupabaseHealth } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Bug, Database, Key } from "lucide-react"

interface SessionIssue {
  category: "critical" | "warning" | "info"
  title: string
  description: string
  solution: string
  technical: string
}

interface SessionAnalysis {
  timestamp: string
  issues: SessionIssue[]
  sessionState: any
  storageState: any
  cookieState: any
  supabaseState: any
}

export default function SessionAnalyzerPage() {
  const { user, session, loading, error } = useAuth()
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const analyzeSession = async () => {
    setAnalyzing(true)
    const issues: SessionIssue[] = []

    // Get current timestamp
    const timestamp = new Date().toISOString()

    // 1. Check Supabase Client Health
    const supabase = getSupabaseClientSync()
    const supabaseState: any = { clientExists: !!supabase }

    if (!supabase) {
      issues.push({
        category: "critical",
        title: "Supabase Client Not Initialized",
        description: "The Supabase client instance is null or undefined",
        solution: "Ensure environment variables are set and Supabase client is properly initialized",
        technical: "Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
      })
    } else {
      try {
        const healthCheck = await checkSupabaseHealth()
        supabaseState.health = healthCheck

        if (healthCheck.status === "unhealthy") {
          issues.push({
            category: "critical",
            title: "Supabase Service Unhealthy",
            description: healthCheck.message,
            solution: "Check Supabase service status and network connectivity",
            technical: "Verify Supabase project is active and accessible",
          })
        }

        // Test direct session retrieval
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        supabaseState.directSession = { data: sessionData, error: sessionError }

        if (sessionError) {
          issues.push({
            category: "critical",
            title: "Direct Session Retrieval Failed",
            description: `Supabase auth.getSession() failed: ${sessionError.message}`,
            solution: "Check authentication configuration and session storage",
            technical: `Error: ${sessionError.message}`,
          })
        }

        // Test user retrieval
        const { data: userData, error: userError } = await supabase.auth.getUser()
        supabaseState.directUser = { data: userData, error: userError }

        if (userError && !userError.message.includes("session_not_found")) {
          issues.push({
            category: "warning",
            title: "User Retrieval Issues",
            description: `auth.getUser() returned error: ${userError.message}`,
            solution: "Verify user session validity and token expiration",
            technical: `Error: ${userError.message}`,
          })
        }
      } catch (error) {
        issues.push({
          category: "critical",
          title: "Supabase Client Error",
          description: `Failed to interact with Supabase client: ${error}`,
          solution: "Check client configuration and network connectivity",
          technical: `Exception: ${error}`,
        })
      }
    }

    // 2. Analyze Auth Context State
    const sessionState = {
      user: user
        ? {
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
          }
        : null,
      session: session
        ? {
            access_token: session.access_token ? "present" : "missing",
            refresh_token: session.refresh_token ? "present" : "missing",
            expires_at: session.expires_at,
            expires_in: session.expires_in,
            token_type: session.token_type,
          }
        : null,
      loading,
      error,
    }

    if (loading) {
      issues.push({
        category: "warning",
        title: "Auth Context Still Loading",
        description: "Authentication context is in loading state for extended period",
        solution: "Check for initialization timeouts or async issues",
        technical: "Auth context loading state should resolve within 5 seconds",
      })
    }

    if (error) {
      issues.push({
        category: "critical",
        title: "Auth Context Error",
        description: `Auth context has error: ${error}`,
        solution: "Resolve the underlying authentication error",
        technical: `Error: ${error}`,
      })
    }

    if (!user && !loading && !error) {
      issues.push({
        category: "warning",
        title: "No Authenticated User",
        description: "User is not authenticated but no error is present",
        solution: "User needs to sign in or session has expired",
        technical: "Normal state for unauthenticated users",
      })
    }

    if (user && !session) {
      issues.push({
        category: "critical",
        title: "User Without Session",
        description: "User object exists but session is missing",
        solution: "This indicates a critical auth state inconsistency",
        technical: "User and session should always be synchronized",
      })
    }

    // 3. Check Local Storage
    const storageState: any = {}
    if (typeof window !== "undefined") {
      const authKeys = [
        "ansvr.auth.token",
        "sb-auth-token",
        "supabase.auth.token",
        "sb-" + (process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] || "unknown") + "-auth-token",
      ]

      storageState.keys = {}
      authKeys.forEach((key) => {
        const value = localStorage.getItem(key)
        storageState.keys[key] = value ? "present" : "missing"

        if (value) {
          try {
            const parsed = JSON.parse(value)
            storageState.keys[key + "_parsed"] = {
              hasAccessToken: !!parsed.access_token,
              hasRefreshToken: !!parsed.refresh_token,
              expiresAt: parsed.expires_at,
            }
          } catch (e) {
            storageState.keys[key + "_parsed"] = "invalid_json"
          }
        }
      })

      // Check for any auth-related keys
      const allKeys = Object.keys(localStorage)
      const foundAuthKeys = allKeys.filter(
        (key) => key.includes("auth") || key.includes("supabase") || key.includes("token"),
      )
      storageState.allAuthKeys = foundAuthKeys

      if (foundAuthKeys.length === 0) {
        issues.push({
          category: "warning",
          title: "No Auth Tokens in Storage",
          description: "No authentication tokens found in localStorage",
          solution: "User needs to sign in to establish session",
          technical: "Expected to find tokens after successful authentication",
        })
      }

      // Check for expired tokens
      foundAuthKeys.forEach((key) => {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            const parsed = JSON.parse(value)
            if (parsed.expires_at) {
              const expiresAt = new Date(parsed.expires_at * 1000)
              const now = new Date()
              if (expiresAt < now) {
                issues.push({
                  category: "warning",
                  title: "Expired Token in Storage",
                  description: `Token in ${key} has expired`,
                  solution: "Clear expired tokens and re-authenticate",
                  technical: `Token expired at: ${expiresAt.toISOString()}`,
                })
              }
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      })
    }

    // 4. Check Cookies
    const cookieState: any = {}
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";").map((c) => c.trim())
      const authCookies = cookies.filter(
        (cookie) =>
          cookie.includes("auth") ||
          cookie.includes("supabase") ||
          cookie.includes("token") ||
          cookie.includes("session"),
      )

      cookieState.authCookies = authCookies
      cookieState.allCookies = cookies.length

      if (authCookies.length === 0) {
        issues.push({
          category: "info",
          title: "No Auth Cookies Found",
          description: "No authentication-related cookies detected",
          solution: "This is normal for localStorage-based auth",
          technical: "Supabase typically uses localStorage, not cookies",
        })
      }
    }

    // 5. Check Session Timing
    if (session) {
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        issues.push({
          category: "critical",
          title: "Session Expired",
          description: "Current session has expired",
          solution: "Refresh the session or re-authenticate",
          technical: `Session expired at: ${new Date(session.expires_at * 1000).toISOString()}`,
        })
      } else if (session.expires_at && session.expires_at - now < 300) {
        issues.push({
          category: "warning",
          title: "Session Expiring Soon",
          description: "Session will expire within 5 minutes",
          solution: "Session should auto-refresh, monitor for refresh attempts",
          technical: `Session expires at: ${new Date(session.expires_at * 1000).toISOString()}`,
        })
      }
    }

    // 6. Check Environment Variables
    const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

    requiredEnvVars.forEach((envVar) => {
      const value = process.env[envVar]
      if (!value) {
        issues.push({
          category: "critical",
          title: `Missing Environment Variable: ${envVar}`,
          description: `Required environment variable ${envVar} is not set`,
          solution: `Add ${envVar} to your .env.local file`,
          technical: `Environment variable must be prefixed with NEXT_PUBLIC_ for client access`,
        })
      }
    })

    setAnalysis({
      timestamp,
      issues,
      sessionState,
      storageState,
      cookieState,
      supabaseState,
    })

    setAnalyzing(false)
  }

  useEffect(() => {
    analyzeSession()
  }, [user, session, loading, error])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(analyzeSession, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const getCategoryIcon = (category: SessionIssue["category"]) => {
    switch (category) {
      case "critical":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "info":
        return <CheckCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const criticalIssues = analysis?.issues.filter((i) => i.category === "critical") || []
  const warningIssues = analysis?.issues.filter((i) => i.category === "warning") || []

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Bug className="w-8 h-8 text-red-500" />
            Session Issue Analyzer
          </h1>
          <p className="text-gray-400">Deep analysis of authentication session problems</p>
        </div>

        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={analyzeSession}
            disabled={analyzing}
            className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 text-white px-6 py-2 rounded-md flex items-center gap-2"
          >
            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`${autoRefresh ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"} text-white px-6 py-2 rounded-md`}
          >
            {autoRefresh ? "Stop Auto-Refresh" : "Start Auto-Refresh"}
          </button>

          <button
            onClick={() => (window.location.href = "/debug/auth")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
          >
            Back to Auth Debug
          </button>
        </div>

        {/* Critical Issues Alert */}
        {criticalIssues.length > 0 && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <h2 className="text-red-400 font-bold mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5" />🚨 Critical Issues Detected ({criticalIssues.length})
            </h2>
            <p className="text-red-300 text-sm mb-3">
              These issues are preventing proper authentication and must be resolved immediately.
            </p>
            <div className="space-y-2">
              {criticalIssues.map((issue, index) => (
                <div key={index} className="text-sm">
                  <span className="font-bold text-red-400">• {issue.title}:</span>
                  <span className="text-red-300 ml-2">{issue.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Issues */}
        {warningIssues.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <h2 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              ⚠️ Warnings ({warningIssues.length})
            </h2>
            <p className="text-yellow-300 text-sm">
              These issues may cause authentication problems and should be investigated.
            </p>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="grid gap-6">
            {/* Issues List */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bug className="w-5 h-5" />
                  Detected Issues ({analysis.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.issues.length === 0 ? (
                  <div className="text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    No issues detected - authentication appears healthy
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysis.issues.map((issue, index) => (
                      <div key={index} className="border border-gray-700 rounded p-4">
                        <div className="flex items-start gap-3 mb-2">
                          {getCategoryIcon(issue.category)}
                          <div className="flex-1">
                            <h3 className="font-bold text-white">{issue.title}</h3>
                            <p className="text-gray-300 text-sm mt-1">{issue.description}</p>
                          </div>
                        </div>
                        <div className="ml-8 space-y-2">
                          <div>
                            <span className="text-green-400 font-bold">Solution: </span>
                            <span className="text-green-300 text-sm">{issue.solution}</span>
                          </div>
                          <div>
                            <span className="text-blue-400 font-bold">Technical: </span>
                            <span className="text-blue-300 text-sm">{issue.technical}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session State */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Session State Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-400 bg-gray-800 p-4 rounded overflow-x-auto">
                  {JSON.stringify(analysis.sessionState, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Storage State */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Storage State Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-400 bg-gray-800 p-4 rounded overflow-x-auto">
                  {JSON.stringify(analysis.storageState, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Supabase State */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Supabase Client State
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-400 bg-gray-800 p-4 rounded overflow-x-auto">
                  {JSON.stringify(analysis.supabaseState, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analysis Timestamp */}
        {analysis && (
          <div className="mt-6 text-center text-gray-500 text-sm">
            Last analyzed: {new Date(analysis.timestamp).toLocaleString()}
            {autoRefresh && <span className="ml-2">(Auto-refreshing every 5s)</span>}
          </div>
        )}
      </div>
    </div>
  )
}
