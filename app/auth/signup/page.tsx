"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp, loading: authLoading } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)

  // Get redirect params
  const redirectTo = searchParams.get("redirect")
  const recordType = searchParams.get("type")
  const campaignId = searchParams.get("campaignId")

  useEffect(() => {
    // Clear any errors when inputs change
    if (error) setError("")
  }, [name, email, password, confirmPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      const { error, needsEmailVerification } = await signUp(email, password, name)

      if (error) {
        setError(error.message)
      } else if (needsEmailVerification) {
        // Show email verification message
        setEmailVerificationSent(true)
        setSuccess("Please check your email to verify your account before logging in.")
      } else {
        // Successful signup without email verification
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

        {/* Show what they're trying to access */}
        {redirectTo && recordType && (
          <div className="mx-4 mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-300 text-sm text-center">
              Create account to continue with your {recordType} response
            </p>
          </div>
        )}

        {/* Sign Up Form */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Welcome to ANS/R<span className="text-red-500">.</span>
              </h1>
              <p className="text-gray-400 text-sm">Create your account to get started</p>
            </div>

            {emailVerificationSent ? (
              <div className="bg-green-900/20 border border-green-700 p-6 rounded-lg text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Verification Email Sent</h2>
                <p className="text-gray-300 mb-4">
                  We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link
                  to verify your account.
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  If you don't see the email, check your spam folder or try again.
                </p>
                <Link href="/auth/login">
                  <button className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold py-3 px-6 rounded-md w-full">
                    Go to Login
                  </button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 border border-gray-700 focus:border-[#2DAD71] focus:outline-none"
                    style={{ borderRadius: "6px" }}
                    required
                  />
                </div>

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

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-900 text-white pl-12 pr-12 py-3 border border-gray-700 focus:border-[#2DAD71] focus:outline-none"
                    style={{ borderRadius: "6px" }}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-900/20 border border-green-700 p-3 rounded-lg flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <p className="text-green-400 text-sm">{success}</p>
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="mt-6 text-center">
                  <Link
                    href={`/auth/login${redirectTo && recordType ? `?redirect=${encodeURIComponent(redirectTo)}&type=${recordType}&campaignId=${campaignId}` : ""}`}
                    className="text-[#2DAD71] hover:text-[#2DAD71]/80 text-sm"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
