"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function AuthDiagnosticPage() {
  const { user, session, loading } = useAuth()
  const [diagnostics, setDiagnostics] = useState<any>(null)

  const runDiagnostics = () => {
    const results = {
      timestamp: new Date().toISOString(),
      userPresent: !!user,
      sessionPresent: !!session,
      loading,
      userAgent: navigator.userAgent,
      localStorage: {
        hasSupabaseSession: !!localStorage.getItem("supabase.auth.token"),
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
      },
    }

    setDiagnostics(results)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Auth Diagnostics</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Auth State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>User:</span>
                <span className={user ? "text-green-600" : "text-red-600"}>
                  {user ? "Authenticated" : "Not authenticated"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Session:</span>
                <span className={session ? "text-green-600" : "text-red-600"}>{session ? "Active" : "None"}</span>
              </div>
              <div className="flex justify-between">
                <span>Loading:</span>
                <span>{loading ? "Yes" : "No"}</span>
              </div>
            </div>

            <Button onClick={runDiagnostics} className="mt-4">
              Run Full Diagnostics
            </Button>
          </CardContent>
        </Card>

        {diagnostics && (
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
