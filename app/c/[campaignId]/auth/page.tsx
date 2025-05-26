"use client"

import { useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function AuthPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const recordType = searchParams.get("type") as "video" | "audio" | "text"
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (isAuthenticated) {
      // User is already authenticated, redirect to recording
      router.push(`/c/${params.campaignId}/record?type=${recordType}`)
    } else {
      // User needs to authenticate, redirect to login with return path
      const returnPath = `/c/${params.campaignId}/record?type=${recordType}`
      router.push(`/auth/login?redirect=${encodeURIComponent(returnPath)}`)
    }
  }, [isAuthenticated, loading, router, params.campaignId, recordType])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  )
}
