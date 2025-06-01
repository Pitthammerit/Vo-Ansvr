"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { sessionRecovery } from "@/lib/session-recovery"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Wrench } from "lucide-react"

export function SessionRecoveryPanel() {
  const { user, session, loading, error, recoverSession } = useAuth()
  const [recovering, setRecovering] = useState(false)
  const [recoveryResult, setRecoveryResult] = useState<any>(null)

  const handleRecovery = async () => {
    setRecovering(true)
    setRecoveryResult(null)

    try {
      const result = await recoverSession()
      setRecoveryResult(result)
    } catch (error) {
      setRecoveryResult({
        success: false,
        message: `Recovery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setRecovering(false)
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

      // Clear cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.includes("auth") || name.includes("supabase") || name.includes("token")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        }
      })

      setRecoveryResult({
        success: true,
        message: "All auth data cleared. Please refresh the page and sign in again.",
      })
    }
  }

  const recoveryStatus = sessionRecovery.getRecoveryStatus()
  const hasSessionIssue = !user && !loading && (error || !session)

  if (!hasSessionIssue) {
    return (
      <Card className="bg-green-900/20 border-green-700">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Session Healthy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-300 text-sm">Authentication session is working properly. User: {user?.email}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-red-900/20 border-red-700">
      <CardHeader>
        <CardTitle className="text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Session Recovery Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-red-300 text-sm">
          <p className="mb-2">Authentication session issue detected:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>User: {user ? user.email : "Not authenticated"}</li>
            <li>Session: {session ? "Present" : "Missing"}</li>
            <li>Loading: {loading ? "Yes" : "No"}</li>
            <li>Error: {error || "None"}</li>
          </ul>
        </div>

        <div className="text-yellow-300 text-sm">
          <p className="mb-2">Recovery Status:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>
              Attempts: {recoveryStatus.attempts}/{recoveryStatus.maxAttempts}
            </li>
            <li>Can Attempt: {recoveryStatus.canAttempt ? "Yes" : "No"}</li>
            <li>
              Last Attempt:{" "}
              {recoveryStatus.lastAttempt ? new Date(recoveryStatus.lastAttempt).toLocaleString() : "Never"}
            </li>
          </ul>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleRecovery}
            disabled={recovering || !recoveryStatus.canAttempt}
            className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600"
            size="sm"
          >
            {recovering ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Recovering...
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4 mr-2" />
                Attempt Recovery
              </>
            )}
          </Button>

          <Button onClick={clearAllAuthData} variant="destructive" size="sm">
            Clear Auth Data
          </Button>

          <Button onClick={() => (window.location.href = "/auth/login")} variant="outline" size="sm">
            Go to Login
          </Button>
        </div>

        {recoveryResult && (
          <div
            className={`p-3 rounded border ${
              recoveryResult.success
                ? "bg-green-900/20 border-green-700 text-green-300"
                : "bg-red-900/20 border-red-700 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {recoveryResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="font-bold text-sm">
                {recoveryResult.success ? "Recovery Successful" : "Recovery Failed"}
              </span>
            </div>
            <p className="text-xs">{recoveryResult.message}</p>
          </div>
        )}

        <div className="text-gray-400 text-xs">
          <p className="mb-1">Troubleshooting steps:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Try the "Attempt Recovery" button first</li>
            <li>If recovery fails, clear auth data and sign in again</li>
            <li>Check browser console for additional error details</li>
            <li>Verify environment variables are set correctly</li>
            <li>Check network connectivity to Supabase</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
