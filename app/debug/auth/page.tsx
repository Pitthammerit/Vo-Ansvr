"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { SessionRecoveryPanel } from "@/components/session-recovery-panel"

interface DiagnosticResult {
  name: string
  status: "success" | "error" | "warning" | "loading"
  message: string
  details?: string
}

export default function AuthDiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(true)

  const runDiagnostics = async () => {
    setLoading(true)
    const results: DiagnosticResult[] = []

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    results.push({
      name: "Environment Variables",
      status: supabaseUrl && supabaseAnonKey ? "success" : "error",
      message:
        supabaseUrl && supabaseAnonKey
          ? "All required environment variables are set"
          : "Missing required environment variables",
      details: `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✅ Set" : "❌ Missing"}\nNEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✅ Set" : "❌ Missing"}`,
    })

    if (supabaseUrl && supabaseAnonKey) {
      // Test Supabase client creation
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        results.push({
          name: "Supabase Client Creation",
          status: "success",
          message: "Supabase client created successfully",
        })

        // Test Supabase connection
        try {
          const { data, error } = await supabase.auth.getSession()
          results.push({
            name: "Supabase Connection",
            status: error ? "error" : "success",
            message: error ? `Connection failed: ${error.message}` : "Successfully connected to Supabase",
            details: error ? error.message : "Connection established",
          })
        } catch (connectionError) {
          results.push({
            name: "Supabase Connection",
            status: "error",
            message: "Failed to connect to Supabase",
            details: connectionError instanceof Error ? connectionError.message : "Unknown connection error",
          })
        }

        // Test auth service
        try {
          const { data, error } = await supabase.auth.getUser()
          results.push({
            name: "Auth Service",
            status: error && !error.message.includes("session_not_found") ? "error" : "success",
            message:
              error && !error.message.includes("session_not_found")
                ? `Auth service error: ${error.message}`
                : "Auth service is operational",
          })
        } catch (authError) {
          results.push({
            name: "Auth Service",
            status: "error",
            message: "Auth service is not responding",
            details: authError instanceof Error ? authError.message : "Unknown auth error",
          })
        }

        // Test network connectivity to Supabase
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: "HEAD",
            headers: {
              apikey: supabaseAnonKey,
            },
          })
          results.push({
            name: "Network Connectivity",
            status: response.ok ? "success" : "error",
            message: response.ok
              ? "Network connectivity is good"
              : `Network error: ${response.status} ${response.statusText}`,
          })
        } catch (networkError) {
          results.push({
            name: "Network Connectivity",
            status: "error",
            message: "Network connectivity failed",
            details: networkError instanceof Error ? networkError.message : "Unknown network error",
          })
        }
      } catch (clientError) {
        results.push({
          name: "Supabase Client Creation",
          status: "error",
          message: "Failed to create Supabase client",
          details: clientError instanceof Error ? clientError.message : "Unknown client creation error",
        })
      }
    }

    // Check browser environment
    results.push({
      name: "Browser Environment",
      status: "success",
      message: "Browser environment check",
      details: `User Agent: ${navigator.userAgent}\nURL: ${window.location.href}\nProtocol: ${window.location.protocol}`,
    })

    setDiagnostics(results)
    setLoading(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "loading":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
    }
  }

  const hasErrors = diagnostics.some((d) => d.status === "error")

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Authentication Diagnostics</h1>
          <p className="text-gray-400">Comprehensive check of authentication service dependencies</p>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 text-white px-6 py-2 rounded-md flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? "Running Diagnostics..." : "Run Diagnostics"}
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
          >
            Back to Home
          </button>
        </div>

        {hasErrors && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <h2 className="text-red-400 font-bold mb-2">⚠️ Issues Detected</h2>
            <p className="text-red-300 text-sm">
              Authentication service issues have been detected. Please review the diagnostics below and follow the
              troubleshooting steps.
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {diagnostics.map((diagnostic, index) => (
            <Card key={index} className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-white">
                  {getStatusIcon(diagnostic.status)}
                  {diagnostic.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-sm mb-2 ${
                    diagnostic.status === "success"
                      ? "text-green-400"
                      : diagnostic.status === "error"
                        ? "text-red-400"
                        : diagnostic.status === "warning"
                          ? "text-yellow-400"
                          : "text-blue-400"
                  }`}
                >
                  {diagnostic.message}
                </p>
                {diagnostic.details && (
                  <pre className="text-xs text-gray-400 bg-gray-800 p-2 rounded mt-2 overflow-x-auto whitespace-pre-wrap">
                    {diagnostic.details}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Troubleshooting Guide */}
        <Card className="mt-8 bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🔧 Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <div>
              <h3 className="font-bold text-white mb-2">1. Environment Variables Missing</h3>
              <p className="text-sm mb-2">If environment variables are missing:</p>
              <ul className="text-xs space-y-1 ml-4">
                <li>
                  • Check your <code className="bg-gray-800 px-1 rounded">.env.local</code> file
                </li>
                <li>
                  • Ensure <code className="bg-gray-800 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> is set
                </li>
                <li>
                  • Ensure <code className="bg-gray-800 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> is set
                </li>
                <li>• Restart your development server after adding variables</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">2. Supabase Connection Issues</h3>
              <p className="text-sm mb-2">If Supabase connection fails:</p>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Verify your Supabase project URL is correct</li>
                <li>• Check if your Supabase project is active</li>
                <li>• Verify the anon key is correct and not expired</li>
                <li>• Check Supabase service status</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">3. Network Connectivity Issues</h3>
              <p className="text-sm mb-2">If network connectivity fails:</p>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Check your internet connection</li>
                <li>• Verify firewall settings</li>
                <li>• Check if you're behind a corporate proxy</li>
                <li>• Try accessing Supabase dashboard directly</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">4. Development Environment</h3>
              <p className="text-sm mb-2">For development issues:</p>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Clear browser cache and cookies</li>
                <li>• Try in incognito/private mode</li>
                <li>• Check browser console for additional errors</li>
                <li>• Restart your development server</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Session Recovery Panel */}
        <div className="mt-8">
          <SessionRecoveryPanel />
        </div>

        {/* Quick Links */}
        <Card className="mt-8 bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🔗 Debug Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => (window.location.href = "/debug/session-analyzer")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Session Analyzer
              </button>
              <button
                onClick={() => (window.location.href = "/debug/session")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Session Debug
              </button>
              <button
                onClick={() => (window.location.href = "/debug/test-login")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Test Login
              </button>
              <button
                onClick={() => (window.location.href = "/debug/profile")}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Profile Debug
              </button>
              <button
                onClick={() => (window.location.href = "/debug/user-state")}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm"
              >
                User State
              </button>
              <button
                onClick={() => (window.location.href = "/env-check")}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Environment Check
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
