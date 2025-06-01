"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || loading || redirecting) return

    setRedirecting(true)

    // Redirect authenticated users to dashboard, others to login
    if (user) {
      router.replace("/dashboard")
    } else {
      router.replace("/auth/login")
    }
  }, [user, loading, mounted, redirecting, router])

  if (!mounted || loading || redirecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white font-bold text-2xl mb-4">
            ANS/R<span className="text-red-500">.</span>
          </div>
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
