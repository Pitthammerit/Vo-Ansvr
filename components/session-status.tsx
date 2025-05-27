"use client"

import { useAuth } from "@/lib/auth-context"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"

export function SessionStatus() {
  const { user, session, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-900/20 border border-yellow-700 text-yellow-300 px-3 py-2 rounded-md text-sm flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
        Loading auth...
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed top-4 right-4 bg-red-900/20 border border-red-700 text-red-300 px-3 py-2 rounded-md text-sm flex items-center gap-2 max-w-sm">
        <XCircle className="w-4 h-4 shrink-0" />
        <span className="truncate">{error}</span>
      </div>
    )
  }

  if (!user || !session) {
    return (
      <div className="fixed top-4 right-4 bg-orange-900/20 border border-orange-700 text-orange-300 px-3 py-2 rounded-md text-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        No session
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 bg-green-900/20 border border-green-700 text-green-300 px-3 py-2 rounded-md text-sm flex items-center gap-2">
      <CheckCircle className="w-4 h-4" />
      {user.email}
    </div>
  )
}
