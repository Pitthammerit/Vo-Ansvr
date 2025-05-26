"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button onClick={() => router.push("/auth/login")} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-white font-bold text-lg">
            ANS/R<span className="text-red-500">.</span>
          </div>
          <div className="w-6" />
        </div>

        {/* Success Message */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-[#2DAD71] rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">Check your email!</h1>

            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              We've sent a password reset link to <strong className="text-white">{email}</strong>. Please check your
              email and follow the instructions to reset your password.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold py-3 px-6 transition-all"
                style={{ borderRadius: "6px" }}
              >
                Back to Sign In
              </button>

              <p className="text-gray-500 text-xs">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    setSuccess(false)
                    setEmail("")
                  }}
                  className="text-[#2DAD71] hover:text-[#2DAD71]/80 underline"
                >
                  try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
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

      {/* Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Forgot your password?</h1>
            <p className="text-gray-400 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
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
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 p-3" style={{ borderRadius: "12px" }}>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 text-white font-semibold py-3 px-6 transition-all flex items-center justify-center gap-2"
              style={{ borderRadius: "6px" }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-[#2DAD71] hover:text-[#2DAD71]/80 text-sm block w-full">
              Remember your password? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
