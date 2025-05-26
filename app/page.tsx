"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          // No Supabase config, redirect to setup
          router.push("/setup")
          return
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Check if campaigns table exists
        const { error: campaignsError } = await supabase.from("campaigns").select("count").limit(1)

        // Check if quotes table exists
        const { error: quotesError } = await supabase.from("quotes").select("count").limit(1)

        if (
          (campaignsError && campaignsError.message.includes("relation")) ||
          (quotesError && quotesError.message.includes("relation"))
        ) {
          // Tables don't exist, redirect to setup
          router.push("/setup")
          return
        }

        // Tables exist, redirect to demo campaign
        router.push("/c/demo")
      } catch (error) {
        console.error("Database check failed:", error)
        // On error, redirect to setup
        router.push("/setup")
      } finally {
        setChecking(false)
      }
    }

    checkDatabase()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-white font-bold text-2xl mb-4">
            ANS/R<span className="text-red-500">.</span>
          </div>
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Checking database...</p>
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
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  )
}
