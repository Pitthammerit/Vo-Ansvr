"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Settings, User, LogOut, LogIn } from "lucide-react"

export function DevAuthPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signIn, signOut, isDemo } = useAuth()

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  const handleDevLogin = async () => {
    await signIn("owewill22@gmail.com", process.env.NEXT_PUBLIC_DEV_PASSWORD || "dev123456")
  }

  const handleDevLogout = async () => {
    await signOut()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all"
        title="Development Auth Panel"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-gray-900 border border-gray-700 rounded-lg p-4 min-w-[280px] shadow-xl">
          <div className="text-white text-sm font-semibold mb-3 border-b border-gray-700 pb-2">🔧 Dev Auth Panel</div>

          <div className="space-y-3 text-sm">
            {/* Current Status */}
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-gray-400 text-xs mb-1">Status:</div>
              <div className="text-white flex items-center gap-2">
                <User className="w-4 h-4" />
                {user ? (
                  <span className="text-green-400">
                    {user.email} {user.email === "owewill22@gmail.com" && "(DEV)"}
                  </span>
                ) : (
                  <span className="text-red-400">Not logged in</span>
                )}
              </div>
              {isDemo && <div className="text-blue-400 text-xs mt-1">🎭 Demo Mode Active</div>}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {!user ? (
                <button
                  onClick={handleDevLogin}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center gap-2 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login as Dev User
                </button>
              ) : (
                <button
                  onClick={handleDevLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              )}
            </div>

            {/* Info */}
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              <div>Email: owewill22@gmail.com</div>
              <div>Auto-login: {localStorage.getItem("ansvr_dev_persistent_login") ? "✅" : "❌"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
