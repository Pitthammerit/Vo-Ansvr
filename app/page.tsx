"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    // Check if app is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      setConfigError("Application not configured. Please contact support.")
      return
    }

    // Validate environment variables format
    if (!supabaseUrl.startsWith("https://") || !supabaseAnonKey.startsWith("eyJ")) {
      setConfigError("Invalid configuration. Please contact support.")
      return
    }

    // If configured properly, redirect to demo campaign
    const timer = setTimeout(() => {
      router.push("/c/demo")
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  if (configError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Configuration Required</h2>
          <p className="text-gray-300 mb-6">{configError}</p>
          <p className="text-gray-400 text-sm">
            This application requires proper database and video service configuration to function.
          </p>
        </div>
      </div>
    )
  }

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
