"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const router = useRouter()
  const { user, loading, isDemo } = useAuth()

  useEffect(() => {
    if (loading) return

    const timer = setTimeout(() => {
      if (user || isDemo) {
        // User is authenticated, go to dashboard
        router.push("/dashboard")
      } else {
        // User is not authenticated, go to demo campaign
        router.push("/c/demo")
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [router, user, loading, isDemo])

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
