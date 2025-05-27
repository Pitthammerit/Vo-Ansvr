"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { AlertCircle, RefreshCw, Settings } from "lucide-react"
import Link from "next/link"

export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  const { error, loading, retryInitialization } = useAuth()

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-red-400">Authentication Service Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>

          <div className="space-y-3">
            <button
              onClick={retryInitialization}
              className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold py-3 px-6 rounded-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>

            <Link href="/debug/auth">
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-md flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                Run Diagnostics
              </button>
            </Link>
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded-lg text-left">
            <h3 className="font-bold text-white mb-2">Quick Fixes:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Verify environment variables are set</li>
              <li>• Try refreshing the page</li>
              <li>• Clear browser cache and cookies</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
