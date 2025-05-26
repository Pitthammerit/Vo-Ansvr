"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, requireAuth = true, redirectTo, fallback }: ProtectedRouteProps) {
  const { user, loading, supabase } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (loading) {
      return // Still loading, don't make decisions yet
    }

    // If Supabase is not configured, allow access (demo mode)
    if (!supabase) {
      setShouldRender(true)
      return
    }

    // If auth is required but user is not authenticated
    if (requireAuth && !user) {
      const currentPath = encodeURIComponent(pathname)
      const destination = redirectTo || `/auth/login?redirect=${currentPath}`
      router.push(destination)
      return
    }

    // If auth is not required but user is authenticated, might want to redirect
    if (!requireAuth && user && redirectTo) {
      router.push(redirectTo)
      return
    }

    // All checks passed, render the component
    setShouldRender(true)
  }, [user, loading, requireAuth, redirectTo, pathname, router, supabase])

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      )
    )
  }

  if (!shouldRender) {
    return (
      fallback || (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Redirecting...</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
