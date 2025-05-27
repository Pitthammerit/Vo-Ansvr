"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { User, LayoutDashboard } from "lucide-react"

export function TopNavButton() {
  const { user, isDemo } = useAuth()
  const router = useRouter()

  const isAuthenticated = user || isDemo

  const handleClick = () => {
    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/auth/login")
    }
  }

  return (
    <button
      onClick={handleClick}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-200 shadow-lg"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {isAuthenticated ? <LayoutDashboard className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
    </button>
  )
}
