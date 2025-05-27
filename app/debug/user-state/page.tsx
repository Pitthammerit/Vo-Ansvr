"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, User, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UserStateDebugPage() {
  const router = useRouter()
  const authContext = useAuth()
  const [directSupabaseData, setDirectSupabaseData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkDirectSupabase = async () => {
    setLoading(true)
    try {
      const supabase = await getSupabaseClient()

      // Get session directly
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      // Get user directly
      const { data: userData, error: userError } = await supabase.auth.getUser()

      setDirectSupabaseData({
        session: {
          data: sessionData,
          error: sessionError,
        },
        user: {
          data: userData,
          error: userError,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setDirectSupabaseData({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkDirectSupabase()
  }, [])

  const forceRefreshAuth = async () => {
    try {
      const supabase = await getSupabaseClient()
      await supabase.auth.refreshSession()

      // Wait a bit for the context to update
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Failed to refresh session:", error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <div className="text-white font-bold text-xl">
                  ANS/R<span className="text-red-500">.</span> User State Debug
                </div>
                <p className="text-gray-400 text-sm">Debugging user data availability</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={checkDirectSupabase}
                disabled={loading}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Check
                  </>
                )}
              </Button>
              <Button onClick={forceRefreshAuth} className="bg-[#2DAD71] hover:bg-[#2DAD71]/90">
                Force Refresh Session
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Auth Context State */}
        <Card className="bg-gray-900 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Auth Context State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-400">Loading:</span>
                  <span className={`ml-2 ${authContext.loading ? "text-yellow-400" : "text-green-400"}`}>
                    {authContext.loading ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">User:</span>
                  <span className={`ml-2 ${authContext.user ? "text-green-400" : "text-red-400"}`}>
                    {authContext.user ? "Present" : "Missing"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Session:</span>
                  <span className={`ml-2 ${authContext.session ? "text-green-400" : "text-red-400"}`}>
                    {authContext.session ? "Present" : "Missing"}
                  </span>
                </div>
              </div>

              {authContext.error && (
                <div className="bg-red-900/20 border border-red-700 p-3 rounded flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-bold">Auth Context Error:</p>
                    <p className="text-red-300 text-sm">{authContext.error}</p>
                  </div>
                </div>
              )}

              {authContext.user && (
                <div>
                  <h3 className="text-white font-medium mb-2">User Data from Context:</h3>
                  <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto text-gray-300">
                    {JSON.stringify(
                      {
                        id: authContext.user.id,
                        email: authContext.user.email,
                        email_confirmed_at: authContext.user.email_confirmed_at,
                        user_metadata: authContext.user.user_metadata,
                        app_metadata: authContext.user.app_metadata,
                        created_at: authContext.user.created_at,
                        updated_at: authContext.user.updated_at,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}

              {authContext.session && (
                <div>
                  <h3 className="text-white font-medium mb-2">Session Data from Context:</h3>
                  <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto text-gray-300">
                    {JSON.stringify(
                      {
                        access_token: authContext.session.access_token ? "Present" : "Missing",
                        refresh_token: authContext.session.refresh_token ? "Present" : "Missing",
                        expires_at: authContext.session.expires_at,
                        expires_in: authContext.session.expires_in,
                        token_type: authContext.session.token_type,
                        user_id: authContext.session.user?.id,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Direct Supabase Check */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Direct Supabase Check</CardTitle>
          </CardHeader>
          <CardContent>
            {directSupabaseData ? (
              <div className="space-y-4">
                {directSupabaseData.error ? (
                  <div className="bg-red-900/20 border border-red-700 p-3 rounded">
                    <p className="text-red-400">Error: {directSupabaseData.error}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-white font-medium mb-2">Session Check:</h3>
                      <div className="bg-gray-800 p-3 rounded">
                        <p className="text-sm mb-2">
                          <span className="text-gray-400">Status:</span>
                          <span
                            className={`ml-2 ${directSupabaseData.session.error ? "text-red-400" : directSupabaseData.session.data.session ? "text-green-400" : "text-yellow-400"}`}
                          >
                            {directSupabaseData.session.error
                              ? "Error"
                              : directSupabaseData.session.data.session
                                ? "Session Found"
                                : "No Session"}
                          </span>
                        </p>
                        {directSupabaseData.session.error && (
                          <p className="text-red-300 text-xs">Error: {directSupabaseData.session.error.message}</p>
                        )}
                        {directSupabaseData.session.data.session && (
                          <pre className="text-xs text-gray-300 mt-2 overflow-x-auto">
                            {JSON.stringify(
                              {
                                user_id: directSupabaseData.session.data.session.user?.id,
                                email: directSupabaseData.session.data.session.user?.email,
                                expires_at: directSupabaseData.session.data.session.expires_at,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-medium mb-2">User Check:</h3>
                      <div className="bg-gray-800 p-3 rounded">
                        <p className="text-sm mb-2">
                          <span className="text-gray-400">Status:</span>
                          <span
                            className={`ml-2 ${directSupabaseData.user.error ? "text-red-400" : directSupabaseData.user.data.user ? "text-green-400" : "text-yellow-400"}`}
                          >
                            {directSupabaseData.user.error
                              ? "Error"
                              : directSupabaseData.user.data.user
                                ? "User Found"
                                : "No User"}
                          </span>
                        </p>
                        {directSupabaseData.user.error && (
                          <p className="text-red-300 text-xs">Error: {directSupabaseData.user.error.message}</p>
                        )}
                        {directSupabaseData.user.data.user && (
                          <pre className="text-xs text-gray-300 mt-2 overflow-x-auto">
                            {JSON.stringify(
                              {
                                id: directSupabaseData.user.data.user.id,
                                email: directSupabaseData.user.data.user.email,
                                email_confirmed_at: directSupabaseData.user.data.user.email_confirmed_at,
                                user_metadata: directSupabaseData.user.data.user.user_metadata,
                                created_at: directSupabaseData.user.data.user.created_at,
                                updated_at: directSupabaseData.user.data.user.updated_at,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-400">Loading direct Supabase check...</p>
            )}
          </CardContent>
        </Card>

        {/* Troubleshooting Guide */}
        <Card className="bg-blue-900/20 border-blue-700 mt-6">
          <CardHeader>
            <CardTitle className="text-blue-400">Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-200 text-sm space-y-3">
            <div>
              <h4 className="font-bold text-blue-300">
                If Auth Context shows "No User" but Direct Supabase shows "User Found":
              </h4>
              <p>This indicates the auth context isn't updating properly. Try "Force Refresh Session".</p>
            </div>

            <div>
              <h4 className="font-bold text-blue-300">If Both show "No User":</h4>
              <p>The session has expired or was never properly established. You may need to log in again.</p>
            </div>

            <div>
              <h4 className="font-bold text-blue-300">If There are Errors:</h4>
              <p>Check the error messages for specific issues like network problems or invalid tokens.</p>
            </div>

            <div>
              <h4 className="font-bold text-blue-300">If Email is Not Confirmed:</h4>
              <p>Some features may not work until email verification is complete.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
