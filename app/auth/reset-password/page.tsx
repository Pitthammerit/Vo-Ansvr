"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { updatePassword, loading: authLoading } = useAuth()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)

  useEffect(() => {
    // Clear any errors when inputs change
    if (error) setError("")
  }, [password, confirmPassword])

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
      const { error } = await updatePassword(password)

      if (error) {
        setError(error.message)
      } else {
        setSuccess("Password updated successfully!")
        setResetComplete(true)
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

        {/* Reset Password Form */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
              <p className="text-gray-400 text-sm">Enter your new password below</p>
            </div>

            {resetComplete ? (
              <div className="bg-green-900/20 border border-green-700 p-6 rounded-lg text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Password Reset Complete</h2>
                <p className="text-gray-300 mb-6">
                  Your password has been updated successfully. You can now log in with your new password.
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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
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
                    placeholder="Confirm New Password"
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

                {success && !resetComplete && (
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
                      Updating...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
