"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User, Video, MessageSquare, Settings, Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

interface UserResponse {
  id: string
  type: "video" | "audio" | "text"
  content: string
  created_at: string
  campaign_name?: string
}

export default function DashboardPage() {
  const { user, signOut, isDemo } = useAuth()
  const [responses, setResponses] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      // Mock data for demo mode
      setResponses([
        {
          id: "1",
          type: "video",
          content: "demo-video-1",
          created_at: new Date().toISOString(),
          campaign_name: "Demo Campaign",
        },
        {
          id: "2",
          type: "text",
          content: "This is a demo text response",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          campaign_name: "Demo Campaign",
        },
      ])
      setLoading(false)
      return
    }

    // Load user responses from Supabase
    loadUserResponses()
  }, [isDemo])

  const loadUserResponses = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) return

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      // This would need to be implemented based on your database schema
      // For now, we'll use mock data
      setResponses([])
    } catch (error) {
      console.error("Error loading responses:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getResponseIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />
      case "audio":
        return <Video className="w-4 h-4" />
      case "text":
        return <MessageSquare className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="text-white font-bold text-xl">
                ANS/R<span className="text-red-500">.</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user?.user_metadata?.name || user?.email}</span>
                  {isDemo && <span className="text-xs text-blue-400">(Demo)</span>}
                </div>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Manage your responses and account settings</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{responses.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Video Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {responses.filter((r) => r.type === "video").length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Text Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{responses.filter((r) => r.type === "text").length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/c/demo">
                <Card className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Plus className="w-6 h-6 text-[#2DAD71]" />
                      <div>
                        <h3 className="font-semibold text-white">New Response</h3>
                        <p className="text-sm text-gray-400">Record a new video response</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/profile">
                <Card className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Settings className="w-6 h-6 text-[#2DAD71]" />
                      <div>
                        <h3 className="font-semibold text-white">Profile Settings</h3>
                        <p className="text-sm text-gray-400">Update your account information</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Responses */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recent Responses</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading responses...</p>
              </div>
            ) : responses.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No responses yet</h3>
                  <p className="text-gray-400 mb-4">Start by recording your first response</p>
                  <Link href="/c/demo">
                    <Button className="bg-[#2DAD71] hover:bg-[#2DAD71]/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Response
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <Card key={response.id} className="bg-gray-900 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getResponseIcon(response.type)}
                          <div>
                            <h3 className="font-semibold text-white capitalize">{response.type} Response</h3>
                            <p className="text-sm text-gray-400">{response.campaign_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">{formatDate(response.created_at)}</p>
                        </div>
                      </div>
                      {response.type === "text" && (
                        <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                          <p className="text-gray-300 text-sm">{response.content}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
