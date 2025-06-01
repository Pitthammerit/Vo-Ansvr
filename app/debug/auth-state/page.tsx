"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function AuthStatePage() {
  const { user, session, profile, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    console.log("🔄 Manual sign out triggered")
    await signOut()
    console.log("✅ Sign out completed")
    router.push("/auth/login")
  }

  const clearLocalStorage = () => {
    localStorage.clear()
    sessionStorage.clear()
    console.log("🧹 Cleared all local storage")
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔍 Authentication State Debug</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current State */}
          <div className="bg-gray-800 p-6 rounded">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Current Auth State</h2>

            <div className="space-y-3">
              <div className="p-3 bg-gray-700 rounded">
                <div className="font-bold">Loading:</div>
                <div className={loading ? "text-yellow-400" : "text-green-400"}>
                  {loading ? "⏳ Loading..." : "✅ Loaded"}
                </div>
              </div>

              <div className="p-3 bg-gray-700 rounded">
                <div className="font-bold">User Object:</div>
                <div className={user ? "text-green-400" : "text-red-400"}>
                  {user ? `✅ ${user.email} (${user.id.substring(0, 8)}...)` : "❌ No user"}
                </div>
              </div>

              <div className="p-3 bg-gray-700 rounded">
                <div className="font-bold">Session Object:</div>
                <div className={session ? "text-green-400" : "text-red-400"}>
                  {session ? `✅ Active session` : "❌ No session"}
                </div>
              </div>

              <div className="p-3 bg-gray-700 rounded">
                <div className="font-bold">Profile Object:</div>
                <div className={profile ? "text-green-400" : "text-red-400"}>
                  {profile ? `✅ ${profile.full_name || "No name"}` : "❌ No profile"}
                </div>
              </div>
            </div>
          </div>

          {/* Local Storage */}
          <div className="bg-gray-800 p-6 rounded">
            <h2 className="text-xl font-bold mb-4 text-orange-400">Browser Storage</h2>

            <div className="space-y-3">
              <div className="p-3 bg-gray-700 rounded">
                <div className="font-bold">Supabase Auth Token:</div>
                <div className="text-sm">
                  {typeof window !== "undefined" && localStorage.getItem("ansvr.auth.token") ? (
                    <span className="text-green-400">✅ Token exists</span>
                  ) : (
                    <span className="text-red-400">❌ No token</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-gray-700 rounded">
                <div className="font-bold">All Local Storage Keys:</div>
                <div className="text-xs text-gray-300 max-h-20 overflow-y-auto">
                  {typeof window !== "undefined"
                    ? Object.keys(localStorage).length > 0
                      ? Object.keys(localStorage).map((key) => <div key={key}>{key}</div>)
                      : "No keys found"
                    : "Loading..."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-4">
          <div className="bg-red-900/30 p-4 rounded">
            <h3 className="font-bold mb-3">🚨 Debug Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleSignOut}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Force Sign Out
              </button>
              <button
                onClick={clearLocalStorage}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
              >
                Clear All Storage & Reload
              </button>
            </div>
          </div>

          <div className="bg-blue-900/30 p-4 rounded">
            <h3 className="font-bold mb-3">📍 Navigation</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
              >
                Go to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
