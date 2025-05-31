"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { sessionMonitor } from "@/lib/session-monitor"
import { CheckCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react"

export function AuthStatusIndicator() {
  const { user, loading, error } = useAuth()
  const [monitorStatus, setMonitorStatus] = useState(sessionMonitor.getHealthStatus())
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const updateMonitorStatus = () => {
      setMonitorStatus(sessionMonitor.getHealthStatus())
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Update monitor status every 5 seconds
    const interval = setInterval(updateMonitorStatus, 5000)

    // Listen for online/offline events
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const getStatusColor = () => {
    if (!isOnline) return "text-red-400"
    if (loading) return "text-yellow-400"
    if (error) return "text-red-400"
    if (user) return "text-green-400"
    return "text-gray-400"
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />
    if (loading) return <RefreshCw className="w-4 h-4 animate-spin" />
    if (error) return <AlertCircle className="w-4 h-4" />
    if (user) return <CheckCircle className="w-4 h-4" />
    return <Wifi className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (!isOnline) return "Offline"
    if (loading) return "Connecting..."
    if (error) return "Auth Error"
    if (user) return "Authenticated"
    return "Not Signed In"
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>

      {monitorStatus.consecutiveFailures > 0 && (
        <div className="text-yellow-400 text-xs">({monitorStatus.consecutiveFailures} failures)</div>
      )}
    </div>
  )
}
