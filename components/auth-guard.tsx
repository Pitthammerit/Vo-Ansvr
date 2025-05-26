"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/auth/login" }: AuthGuardProps) {
  const { user, loading, isDemo } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // In demo mode, always allow access
    if (isDemo) return

    // If auth is required but user is not authenticated
    if (requireAuth && !user) {
      router.push(redirectTo)
      return
    }

    // If auth is not required but user is authenticated (e.g., login page)
    if (!requireAuth && user) {
      router.push("/dashboard")
      return
    }
  }, [user, loading, requireAuth, redirectTo, router, isDemo])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-white font-bold text-2xl mb-4">
            ANS/R<span className="text-red-500">.</span>
          </div>
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // In demo mode or if auth check passes, render children
  if (isDemo || (requireAuth && user) || (!requireAuth && !user)) {
    return <>{children}</>
  }

  // Don't render anything while redirecting
  return null
}
