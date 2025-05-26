"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Mail, Lock, User, ArrowRight, AlertTriangle } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export default function AuthPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const recordType = searchParams.get("type") as "video" | "audio" | "text"

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      setConfigError("Database configuration missing. Please contact support.")
      return
    }

    // Validate environment variables format
    if (!supabaseUrl.startsWith("https://") || !supabaseAnonKey.startsWith("eyJ")) {
      setConfigError("Invalid database configuration. Please contact support.")
      return
    }

    try {
      const client = createClient(supabaseUrl, supabaseAnonKey)
      setSupabase(client)
    } catch (err) {
      setConfigError("Failed to initialize database connection. Please contact support.")
    }
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) {
      setError("Database connection not available")
      return
    }

    setLoading(true)
    setError("")

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        router.push(`/c/${params.campaignId}/record?type=${recordType}`)
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        })

        if (error) throw error

        if (data.user && !data.session) {
          setError("Please check your email to confirm your account")
        } else {
          router.push(`/c/${params.campaignId}/record?type=${recordType}`)
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first")
      return
    }

    if (!supabase) {
      setError("Database connection not available")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/c/${params.campaignId}/auth?type=${recordType}`,
      })

      if (error) throw error

      setError("Password reset email sent! Check your inbox.")
      setShowForgotPassword(false)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Show configuration error
  if (configError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Configuration Error</h2>
          <p className="text-gray-300 mb-6">{configError}</p>
          <button
            onClick={() => router.back()}
            className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold py-3 px-6 transition-all"
            style={{ borderRadius: "6px" }}
          >
            Go Back
          </button>
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

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? (
                "Welcome back!"
              ) : (
                <>
                  Welcome to ANS/R<span className="text-red-500">.</span>
                </>
              )}
            </h1>
            <p className="text-gray-400 text-sm">
              {isLogin ? "Sign in to continue recording:" : "Sign up to get your response:"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 border border-gray-700 focus:border-[#2DAD71] focus:outline-none"
                  style={{ borderRadius: "6px" }}
                  required={!isLogin}
                />
              </div>
            )}

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
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 border border-gray-700 focus:border-[#2DAD71] focus:outline-none"
                style={{ borderRadius: "6px" }}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 p-3" style={{ borderRadius: "12px" }}>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !supabase}
              className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 text-white font-semibold py-3 px-6 transition-all flex items-center justify-center gap-2"
              style={{ borderRadius: "6px" }}
            >
              {loading ? (
                "Please wait..."
              ) : (
                <>
                  {isLogin ? "Continue" : "Create Account to Continue"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#2DAD71] hover:text-[#2DAD71]/80 text-sm block w-full"
            >
              {isLogin ? (
                <>
                  Don't have an account? Sign up to ANS/R<span className="text-red-500">.</span>
                </>
              ) : (
                "Already have an account? Sign in"
              )}
            </button>

            {isLogin && (
              <button
                onClick={handleForgotPassword}
                disabled={loading || !supabase}
                className="text-gray-400 hover:text-gray-300 text-xs underline"
                style={{ textDecorationThickness: "2px" }}
              >
                Remind me of my password
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
