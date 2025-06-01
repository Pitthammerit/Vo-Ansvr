"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Video, Settings, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function Sidebar() {
  const pathname = usePathname()
  const { signOut, isDemo } = useAuth()

  const isActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Record", path: "/c/demo", icon: Video },
    { name: "Profile", path: "/profile", icon: Settings },
  ]

  return (
    <div className="fixed left-0 top-0 bottom-0 w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4">
      <div className="mb-8 text-white font-bold text-xl">
        A<span className="text-red-500">.</span>
      </div>

      <nav className="flex-1 flex flex-col items-center gap-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
              isActive(item.path)
                ? "bg-[#2DAD71]/20 text-[#2DAD71]"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
            title={item.name}
          >
            <item.icon className="w-5 h-5" />
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        {isDemo && (
          <div className="mb-4 px-2 py-1 bg-blue-900/30 rounded-md">
            <span className="text-xs text-blue-400">Demo</span>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-10 h-10 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
