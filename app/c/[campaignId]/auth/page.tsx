"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function AuthPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const recordType = searchParams.get("type") as "video" | "audio" | "text"
  const { user, loading } = useAuth()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (loading || hasRedirected) return

    if (user) {
      // User is authenticated, proceed to recording
      setHasRedirected(true)
      router.push(`/c/${params.campaignId}/record?type=${recordType}`)
    } else {
      // Store redirect information in URL params
      const redirectUrl = `/c/${params.campaignId}/record`
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(redirectUrl)}&type=${recordType}&campaignId=${params.campaignId}`

      // User is not authenticated, redirect to login
      setHasRedirected(true)
      router.push(loginUrl)
    }
  }, [user, loading, router, params.campaignId, recordType, hasRedirected])

  // Show loading while checking auth
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-white font-bold text-2xl mb-4">
          ANS/R<span className="text-red-500">.</span>
        </div>
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Checking authentication...</p>
      </div>
    </div>
  )
}
