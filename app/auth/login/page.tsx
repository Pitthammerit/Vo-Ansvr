"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, loading: authLoading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Get redirect params
  const redirectTo = searchParams.get("redirect")
  const recordType = searchParams.get("type")
  const campaignId = searchParams.get("campaignId")

  // Check for verification success
  const emailVerified = searchParams.get("emailVerified") === "true"

  useEffect(() => {
    // Clear any errors when inputs change
    if (error) setError("")
  }, [email, password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await signIn(email, password)

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError("Please verify your email before logging in. Check your inbox for a verification link.")
        } else {
          setError(error.message)
        }
      } else {
        // Successful login - redirect based on params
        if (redirectTo && recordType) {
          router.push(`${redirectTo}?type=${recordType}`)
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button onClick={() => router.back()} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-white font-bold text-lg">
            ANS/R<span className="text-red-500">.</span>
          </div>
          <div className="w-6" />
        </div>

        {/* Email Verification Success */}
        {emailVerified && (
          <div className="mx-4 mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-300 text-sm text-center">✅ Email verified successfully! You can now log in.</p>
          </div>
        )}

        {/* Show what they're trying to access */}
        {redirectTo && recordType && (
          <div className="mx-4 mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-300 text-sm text-center">Sign in to continue with your {recordType} response</p>
          </div>
        )}

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Welcome back!</h1>
              <p className="text-gray-400 text-sm">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 border border-gray-700 focus:border-[#2DAD71] focus:outline-none"
                  style={{ borderRadius: "6px" }}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900 text-white pl-12 pr-12 py-3 border border-gray-700 focus:border-[#2DAD71] focus:outline-none"
                  style={{ borderRadius: "6px" }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || authLoading}
                className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 text-white font-semibold py-3 px-6 transition-all flex items-center justify-center gap-2"
                style={{ borderRadius: "6px" }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <Link
                href={`/auth/signup${redirectTo && recordType ? `?redirect=${encodeURIComponent(redirectTo)}&type=${recordType}&campaignId=${campaignId}` : ""}`}
                className="text-[#2DAD71] hover:text-[#2DAD71]/80 text-sm block w-full"
              >
                Don't have an account? Sign up to ANS/R<span className="text-red-500">.</span>
              </Link>

              <Link
                href="/auth/forgot-password"
                className="text-gray-400 hover:text-gray-300 text-xs underline"
                style={{ textDecorationThickness: "2px" }}
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
