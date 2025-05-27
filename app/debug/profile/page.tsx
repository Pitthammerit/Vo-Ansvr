"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, User, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfileDebugPage() {
  const router = useRouter()
  const { user, updateProfile, loading: authLoading } = useAuth()
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showSensitive, setShowSensitive] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])

  const runDiagnostics = async () => {
    setLoading(true)
    const results: any[] = []

    try {
      const supabase = await getSupabaseClient()

      // 1. Check current user data
      results.push({
        test: "Current User Data",
        status: user ? "✅ Pass" : "❌ Fail",
        details: user
          ? {
              id: user.id,
              email: user.email,
              email_confirmed_at: user.email_confirmed_at,
              user_metadata: user.user_metadata,
              app_metadata: user.app_metadata,
              created_at: user.created_at,
              updated_at: user.updated_at,
            }
          : "No user found",
      })

      // 2. Check session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      results.push({
        test: "Current Session",
        status: sessionData.session ? "✅ Pass" : "❌ Fail",
        details:
          sessionError || sessionData.session
            ? {
                access_token: sessionData.session?.access_token ? "Present" : "Missing",
                refresh_token: sessionData.session?.refresh_token ? "Present" : "Missing",
                expires_at: sessionData.session?.expires_at,
                user_id: sessionData.session?.user?.id,
              }
            : "No session",
      })

      // 3. Test profile update capability
      if (user) {
        try {
          const testUpdate = {
            data: {
              test_timestamp: new Date().toISOString(),
              debug_test: true,
            },
          }

          const { data: updateData, error: updateError } = await supabase.auth.updateUser(testUpdate)

          results.push({
            test: "Profile Update Test",
            status: updateError ? "❌ Fail" : "✅ Pass",
            details: updateError || {
              message: "Test update successful",
              user_id: updateData.user?.id,
              updated_metadata: updateData.user?.user_metadata,
            },
          })
        } catch (error) {
          results.push({
            test: "Profile Update Test",
            status: "❌ Fail",
            details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          })
        }
      }

      // 4. Check auth permissions
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        results.push({
          test: "Auth Permissions",
          status: userError ? "❌ Fail" : "✅ Pass",
          details: userError || {
            message: "Can access user data",
            user_id: userData.user?.id,
            aud: userData.user?.aud,
          },
        })
      } catch (error) {
        results.push({
          test: "Auth Permissions",
          status: "❌ Fail",
          details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        })
      }

      // 5. Check if we can read user metadata
      if (user) {
        results.push({
          test: "User Metadata Access",
          status: "✅ Pass",
          details: {
            name: user.user_metadata?.name || "Not set",
            avatar_url: user.user_metadata?.avatar_url || "Not set",
            metadata_keys: Object.keys(user.user_metadata || {}),
            metadata_size: JSON.stringify(user.user_metadata || {}).length,
          },
        })
      }

      // 6. Test a real profile update
      if (user) {
        try {
          const testName = `Debug Test ${Date.now()}`
          const { error: realUpdateError } = await updateProfile({
            name: testName,
          })

          results.push({
            test: "Real Profile Update",
            status: realUpdateError ? "❌ Fail" : "✅ Pass",
            details: realUpdateError || {
              message: "Successfully updated profile via context",
              test_name: testName,
            },
          })
        } catch (error) {
          results.push({
            test: "Real Profile Update",
            status: "❌ Fail",
            details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          })
        }
      }

      setTestResults(results)
      setDebugData({
        timestamp: new Date().toISOString(),
        user_id: user?.id,
        session_exists: !!sessionData.session,
        tests_run: results.length,
      })
    } catch (error) {
      results.push({
        test: "Diagnostics Error",
        status: "❌ Fail",
        details: `Failed to run diagnostics: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
      setTestResults(results)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && !loading) {
      runDiagnostics()
    }
  }, [user])

  const getStatusColor = (status: string) => {
    if (status.includes("✅")) return "text-green-400"
    if (status.includes("❌")) return "text-red-400"
    if (status.includes("⚠️")) return "text-yellow-400"
    return "text-gray-400"
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
                  ANS/R<span className="text-red-500">.</span> Profile Debug
                </div>
                <p className="text-gray-400 text-sm">Debugging profile save functionality</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSensitive(!showSensitive)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
              >
                {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showSensitive ? "Hide" : "Show"} Sensitive
              </Button>
              <Button
                onClick={runDiagnostics}
                disabled={loading || authLoading}
                className="bg-[#2DAD71] hover:bg-[#2DAD71]/90"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run Diagnostics
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Current User Info */}
        <Card className="bg-gray-900 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Current User Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">ID:</span> <span className="text-white font-mono">{user.id}</span>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span> <span className="text-white">{user.email}</span>
                </div>
                <div>
                  <span className="text-gray-400">Email Confirmed:</span>{" "}
                  <span className="text-white">{user.email_confirmed_at ? "✅ Yes" : "❌ No"}</span>
                </div>
                <div>
                  <span className="text-gray-400">Name in Metadata:</span>{" "}
                  <span className="text-white">{user.user_metadata?.name || "Not set"}</span>
                </div>
                <div>
                  <span className="text-gray-400">Avatar in Metadata:</span>{" "}
                  <span className="text-white">{user.user_metadata?.avatar_url ? "✅ Set" : "❌ Not set"}</span>
                </div>
                <div>
                  <span className="text-gray-400">Last Updated:</span>{" "}
                  <span className="text-white">{user.updated_at}</span>
                </div>
              </div>
            ) : (
              <p className="text-red-400">No user data available</p>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Profile Save Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length > 0 ? (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">{result.test}</h3>
                      <span className={`font-mono text-sm ${getStatusColor(result.status)}`}>{result.status}</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      {typeof result.details === "object" ? (
                        <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      ) : (
                        <p>{result.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  {loading ? "Running diagnostics..." : "Click 'Run Diagnostics' to test profile functionality"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Data */}
        {debugData && (
          <Card className="bg-gray-900 border-gray-700 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Debug Session Info</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-800 p-4 rounded text-xs overflow-x-auto text-gray-300">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-900/20 border-blue-700 mt-6">
          <CardHeader>
            <CardTitle className="text-blue-400">Debugging Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-200 text-sm space-y-2">
            <p>
              1. <strong>Check all test results above</strong> - Look for any ❌ failures
            </p>
            <p>
              2. <strong>Try updating your profile</strong> - Go to /profile and make changes
            </p>
            <p>
              3. <strong>Come back and run diagnostics again</strong> - See if changes persisted
            </p>
            <p>
              4. <strong>Check the "Real Profile Update" test</strong> - This tests the actual save function
            </p>
            <p>
              5. <strong>Look for metadata changes</strong> - Check if user_metadata is being updated
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
