"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User, Video, MessageSquare, Settings, Plus, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AudioResponsePreview } from "@/components/AudioResponsePreview"

interface UserResponse {
  id: string
  type: "video" | "audio" | "text"
  content: string
  created_at: string
  campaign_name?: string
  campaign_id?: string
  user_id?: string
}

interface DashboardStats {
  totalMessages: number
  videoMessages: number
  audioMessages: number
  textMessages: number
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [responses, setResponses] = useState<UserResponse[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    videoMessages: 0,
    audioMessages: 0,
    textMessages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const personalizedGreeting = useMemo(() => {
    const firstName = user?.user_metadata?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there"

    // Check if user is new (created within last hour)
    const userCreated = user?.created_at ? new Date(user.created_at) : new Date()
    const now = new Date()
    const hoursSinceCreation = (now.getTime() - userCreated.getTime()) / (1000 * 60 * 60)

    if (hoursSinceCreation < 1) {
      return `Welcome ${firstName}`
    } else {
      return `Hello, ${firstName}`
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Always require real authentication - no demo mode
      if (!user) {
        setResponses([])
        setStats({
          totalMessages: 0,
          videoMessages: 0,
          audioMessages: 0,
          textMessages: 0,
        })
        setLoading(false)
        return
      }

      // TODO: Fetch real user responses from Supabase
      // For now, show empty state until database tables are set up
      setResponses([])
      setStats({
        totalMessages: 0,
        videoMessages: 0,
        audioMessages: 0,
        textMessages: 0,
      })
      setLoading(false)
    } catch (error) {
      console.error("Error loading user data:", error)
      setError("Failed to load your responses. Please try again.")
      setLoading(false)
    }
  }

  const calculateStats = (responsesList: UserResponse[]) => {
    const totalMessages = responsesList.length
    const videoMessages = responsesList.filter((r) => r.type === "video").length
    const audioMessages = responsesList.filter((r) => r.type === "audio").length
    const textMessages = responsesList.filter((r) => r.type === "text").length

    setStats({
      totalMessages,
      videoMessages,
      audioMessages,
      textMessages,
    })
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
        return <MessageSquare className="w-4 h-4" />
      case "text":
        return <MessageSquare className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const refreshData = async () => {
    await loadUserData()
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
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {user?.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm">{user?.user_metadata?.name || user?.email}</span>
                </Link>
                <button onClick={signOut} className="text-gray-400 hover:text-white transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                  <span className="text-2xl font-medium text-[#2DAD71]">{personalizedGreeting}</span>
                </div>
                <p className="text-gray-400">Manage account and see your messages</p>
              </div>
              <button
                onClick={refreshData}
                disabled={loading}
                className="border-[#2DAD71]/30 text-white bg-[#2DAD71]/20 hover:bg-[#2DAD71]/30 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
                <Button
                  onClick={refreshData}
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalMessages}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Video Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.videoMessages}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Audio Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.audioMessages}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Text Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.textMessages}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/c/demo">
                <Card className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Plus className="w-6 h-6 text-[#2DAD71]" />
                      <div>
                        <h3 className="font-semibold text-white">Try Demo</h3>
                        <p className="text-sm text-gray-400">Experience the platform</p>
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
                  <p className="text-gray-400 mb-4">Get your first response by sending a message</p>
                  <Link href="/c/demo">
                    <Button className="bg-[#2DAD71] hover:bg-[#2DAD71]/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Send Your First Message
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
                          {response.campaign_id && (
                            <Link
                              href={`/c/${response.campaign_id}/review`}
                              className="text-xs text-[#2DAD71] hover:text-[#2DAD71]/80"
                            >
                              View Details
                            </Link>
                          )}
                        </div>
                      </div>

                      {response.type === "text" && (
                        <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                          <p className="text-gray-300 text-sm line-clamp-3">{response.content}</p>
                        </div>
                      )}

                      {response.type === "audio" && (
                        <div className="mt-3">
                          <AudioResponsePreview
                            audioUrl={`https://customer-${process.env.NEXT_PUBLIC_CF_ACCOUNT_ID || "demo"}.cloudflarestream.com/${response.content}/manifest/audio-only.m3u8`}
                          />
                        </div>
                      )}

                      {response.type === "video" && (
                        <div className="mt-3 aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-gray-400 text-sm">Video preview available in full version</p>
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
