"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bug, Settings, Key, User, RefreshCw, LogIn, Activity, Database, Info } from "lucide-react"

// Import all existing debug components
import EnvDebugPage from "./env/page"
import SessionDebugPage from "./session/page"
import ProfileDebugPage from "./profile/page"
import SessionAnalyzerPage from "./session-analyzer/page"
import TestLoginPage from "./test-login/page"
import UserStateDebugPage from "./user-state/page"
import SimpleTestPage from "./simple-test/page"
import AuthDiagnosticPage from "./auth/page" // Keeping this for its content, will be deleted later

type DebugTool =
  | "overview"
  | "env"
  | "session"
  | "profile"
  | "session-analyzer"
  | "test-login"
  | "user-state"
  | "simple-test"
  | "auth-diagnostics"

export default function DebugDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTool, setSelectedTool] = useState<DebugTool>("overview")

  useEffect(() => {
    const tool = searchParams.get("tool") as DebugTool
    if (tool) {
      setSelectedTool(tool)
    } else {
      setSelectedTool("overview")
    }
  }, [searchParams])

  const navigateToTool = (tool: DebugTool) => {
    router.push(`/debug?tool=${tool}`)
  }

  const renderToolComponent = () => {
    switch (selectedTool) {
      case "env":
        return <EnvDebugPage />
      case "session":
        return <SessionDebugPage />
      case "profile":
        return <ProfileDebugPage />
      case "session-analyzer":
        return <SessionAnalyzerPage />
      case "test-login":
        return <TestLoginPage />
      case "user-state":
        return <UserStateDebugPage />
      case "simple-test":
        return <SimpleTestPage />
      case "auth-diagnostics":
        return <AuthDiagnosticPage />
      case "overview":
      default:
        return (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5" />
                Welcome to the Debug Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>
                Select a diagnostic tool from the navigation above or the quick links below to begin troubleshooting.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  onClick={() => navigateToTool("session-analyzer")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Bug className="w-4 h-4 mr-2" /> Session Analyzer
                </Button>
                <Button
                  onClick={() => navigateToTool("session")}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Key className="w-4 h-4 mr-2" /> Session Debug
                </Button>
                <Button
                  onClick={() => navigateToTool("test-login")}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <LogIn className="w-4 h-4 mr-2" /> Test Login
                </Button>
                <Button
                  onClick={() => navigateToTool("profile")}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <User className="w-4 h-4 mr-2" /> Profile Debug
                </Button>
                <Button
                  onClick={() => navigateToTool("user-state")}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Activity className="w-4 h-4 mr-2" /> User State
                </Button>
                <Button
                  onClick={() => navigateToTool("env")}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Settings className="w-4 h-4 mr-2" /> Environment Check
                </Button>
                <Button
                  onClick={() => navigateToTool("simple-test")}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Database className="w-4 h-4 mr-2" /> Simple Supabase Test
                </Button>
                <Button
                  onClick={() => navigateToTool("auth-diagnostics")}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Auth Diagnostics (Legacy)
                </Button>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Bug className="w-8 h-8 text-red-500" />
              <div>
                <div className="text-white font-bold text-xl">
                  ANS/R<span className="text-red-500">.</span> Debug Dashboard
                </div>
                <p className="text-gray-400 text-sm">Centralized tools for application diagnostics</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4 border-b border-gray-800">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedTool === "overview" ? "default" : "outline"}
            onClick={() => navigateToTool("overview")}
            className={
              selectedTool === "overview" ? "bg-[#2DAD71] hover:bg-[#2DAD71]/90" : "border-gray-600 text-gray-300"
            }
          >
            Overview
          </Button>
          <Button
            variant={selectedTool === "session-analyzer" ? "default" : "outline"}
            onClick={() => navigateToTool("session-analyzer")}
            className={
              selectedTool === "session-analyzer"
                ? "bg-[#2DAD71] hover:bg-[#2DAD71]/90"
                : "border-gray-600 text-gray-300"
            }
          >
            Session Analyzer
          </Button>
          <Button
            variant={selectedTool === "session" ? "default" : "outline"}
            onClick={() => navigateToTool("session")}
            className={
              selectedTool === "session" ? "bg-[#2DAD71] hover:bg-[#2DAD71]/90" : "border-gray-600 text-gray-300"
            }
          >
            Session Debug
          </Button>
          <Button
            variant={selectedTool === "test-login" ? "default" : "outline"}
            onClick={() => navigateToTool("test-login")}
            className={
              selectedTool === "test-login" ? "bg-[#2DAD71] hover:bg-[#2DAD71]/90" : "border-gray-600 text-gray-300"
            }
          >
            Test Login
          </Button>
          <Button
            variant={selectedTool === "profile" ? "default" : "outline"}
            onClick={() => navigateToTool("profile")}
            className={
              selectedTool === "profile" ? "bg-[#2DAD71] hover:bg-[#2DAD71]/90" : "border-gray-600 text-gray-300"
            }
          >
            Profile Debug
          </Button>
          <Button
            variant={selectedTool === "user-state" ? "default" : "outline"}
            onClick={() => navigateToTool("user-state")}
            className={
              selectedTool === "user-state" ? "bg-[#2DAD71] hover:bg-[#2DAD71]/90" : "border-gray-600 text-gray-300"
            }
          >
            User State
          </Button>
          <Button
            variant={selectedTool === "env" ? "default" : "outline"}
            onClick={() => navigateToTool("env")}
            className={selectedTool === "env" ? "bg-[#2DAD71] hover:bg-[#2DAD71]/90" : "border-gray-600 text-gray-300"}
          >
            Environment
          </Button>
          <Button
            variant={selectedTool === "simple-test" ? "default" : "outline"}
            onClick={() => navigateToTool("simple-test")}
            className={
              selectedTool === "simple-test" ? "bg-[#2DAD71] hover:bg-[#2DAD71]/90" : "border-gray-600 text-gray-300"
            }
          >
            Simple Test
          </Button>
          <Button
            variant={selectedTool === "auth-diagnostics" ? "default" : "outline"}
            onClick={() => navigateToTool("auth-diagnostics")}
            className={
              selectedTool === "auth-diagnostics"
                ? "bg-[#2DAD71] hover:bg-[#2DAD71]/90"
                : "border-gray-600 text-gray-300"
            }
          >
            Auth Diagnostics (Legacy)
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">{renderToolComponent()}</div>
    </div>
  )
}
