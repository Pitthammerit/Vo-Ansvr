"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  requireAdmin?: boolean
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/auth/login",
  requireAdmin = false,
}: AuthGuardProps) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Add a timeout for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Auth loading timeout - forcing completion")
        setLoadingTimeout(true)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    if ((loading && !loadingTimeout) || hasRedirected) return

    const isAuthenticated = !!user

    // Check if admin access is required
    if (requireAdmin && (!isAuthenticated || !isAdmin)) {
      setHasRedirected(true)
      router.push("/dashboard") // Redirect non-admins to dashboard
      return
    }

    if (requireAuth && !isAuthenticated) {
      setHasRedirected(true)
      router.push(redirectTo)
    } else if (!requireAuth && isAuthenticated) {
      // User is already logged in and trying to access auth pages
      setHasRedirected(true)
      router.push("/dashboard")
    }
  }, [user, loading, loadingTimeout, isAdmin, requireAuth, requireAdmin, redirectTo, router, hasRedirected])

  if (loading && !loadingTimeout) {
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

  const isAuthenticated = !!user

  // Check admin requirement
  if (requireAdmin && (!isAuthenticated || !isAdmin)) {
    return null // Will redirect in the useEffect
  }

  // Show content if auth requirements are met
  if ((requireAuth && isAuthenticated) || (!requireAuth && !isAuthenticated)) {
    return <>{children}</>
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-white font-bold text-2xl mb-4">
          ANS/R<span className="text-red-500">.</span>
        </div>
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  )
}
