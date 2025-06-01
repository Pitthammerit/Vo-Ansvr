"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = getSupabaseClient()

        // Get the code from URL parameters
        const code = searchParams.get("code")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (error) {
          console.error("Auth callback error:", error, errorDescription)
          setStatus("error")
          setMessage(errorDescription || error)
          return
        }

        if (!code) {
          setStatus("error")
          setMessage("No confirmation code found in URL")
          return
        }

        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error("Error exchanging code for session:", exchangeError)
          setStatus("error")
          setMessage(exchangeError.message)
          return
        }

        if (data.user) {
          console.log("✅ Email confirmed successfully for user:", data.user.email)
          setStatus("success")
          setMessage("Email confirmed successfully!")

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        } else {
          setStatus("error")
          setMessage("Failed to confirm email")
        }
      } catch (err) {
        console.error("Auth callback error:", err)
        setStatus("error")
        setMessage("An unexpected error occurred")
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-white font-bold text-2xl mb-8">
          ANS/R<span className="text-red-500">.</span>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 text-[#2DAD71] mx-auto mb-4 animate-spin" />
              <h1 className="text-xl font-bold text-white mb-2">Confirming Email</h1>
              <p className="text-gray-400">Please wait while we verify your email address...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">Email Confirmed!</h1>
              <p className="text-gray-400 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">Confirmation Failed</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold py-3 px-6 rounded-md transition-all"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => router.push("/auth/forgot-password")}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-md transition-all"
                >
                  Resend Confirmation
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
