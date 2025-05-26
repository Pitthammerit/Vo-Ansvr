"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User, Video, MessageSquare, Settings, Plus } from "lucide-react"
import Link from "next/link"

interface UserConversation {
  id: string
  title: string
  created_at: string
  campaign_id: string
  message_count: number
}

export default function DashboardPage() {
  const { user, signOut, supabase } = useAuth()
  const [conversations, setConversations] = useState<UserConversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (supabase && user) {
      fetchUserConversations()
    } else {
      // Demo mode - show mock data
      setConversations([
        {
          id: "demo-1",
          title: "Demo Campaign Response",
          created_at: new Date().toISOString(),
          campaign_id: "demo",
          message_count: 1,
        },
      ])
      setLoading(false)
    }
  }, [supabase, user])

  const fetchUserConversations = async () => {
    if (!supabase || !user) return

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          created_at,
          campaigns!inner(id, name),
          messages(count)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching conversations:", error)
      } else {
        const formattedConversations = data?.map((conv: any) => ({
          id: conv.id,
          title: conv.campaigns.name,
          created_at: conv.created_at,
          campaign_id: conv.campaigns.id,
          message_count: conv.messages?.length || 0,
        }))
        setConversations(formattedConversations || [])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="text-white font-bold text-xl">
                ANS/R<span className="text-red-500">.</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  <span>{user?.user_metadata?.name || user?.email}</span>
                </div>

                <Button
                  onClick={handleSignOut}
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
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.user_metadata?.name?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-gray-400">Manage your video conversations and responses.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Total Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{conversations.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Total Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {conversations.reduce((sum, conv) => sum + conv.message_count, 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#2DAD71]">Active</div>
              </CardContent>
            </Card>
          </div>

          {/* Conversations List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Your Conversations</h2>
              <Link href="/c/demo">
                <Button className="bg-[#2DAD71] hover:bg-[#2DAD71]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  New Response
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No conversations yet</h3>
                  <p className="text-gray-400 mb-4">Start by responding to a campaign.</p>
                  <Link href="/c/demo">
                    <Button className="bg-[#2DAD71] hover:bg-[#2DAD71]/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">{conversation.title}</h3>
                          <p className="text-sm text-gray-400">
                            {new Date(conversation.created_at).toLocaleDateString()} • {conversation.message_count}{" "}
                            message{conversation.message_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
