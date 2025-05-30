"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Video, User, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

// Mock data for demo
const mockConversations = [
  {
    id: "1",
    title: "Welcome to ANSWR Lite",
    thumbnail: "/placeholder.svg?height=96&width=128",
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "1",
        text: "What's your favorite feature?",
        video_url: "demo-video-1",
        responses: [],
      },
    ],
  },
  {
    id: "2",
    title: "Product Feedback",
    thumbnail: "/placeholder.svg?height=96&width=128",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    questions: [
      {
        id: "2",
        text: "How can we improve?",
        video_url: "demo-video-2",
        responses: [
          {
            id: "1",
            type: "text" as const,
            content: "Great app! Love the interface.",
            created_at: new Date().toISOString(),
          },
        ],
      },
    ],
  },
]

export default function DemoPage() {
  const [conversations] = useState(mockConversations)
  const [mounted, setMounted] = useState(false)
  const { user, isDemo } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top-right navigation button */}
      <div className="fixed top-4 right-4 z-40">
        {user || isDemo ? (
          <Link href="/dashboard">
            <Button
              size="sm"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-200 p-0"
              variant="ghost"
            >
              <LayoutDashboard className="h-4 w-4 text-gray-700" />
            </Button>
          </Link>
        ) : (
          <Link href="/auth/login">
            <Button
              size="sm"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-200 p-0"
              variant="ghost"
            >
              <User className="h-4 w-4 text-gray-700" />
            </Button>
          </Link>
        )}
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ANSWR Lite - Demo</h1>
          <p className="text-gray-600">Demo mode - Create and manage video conversations</p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              🚀 This is demo mode. To use with real data, configure your Supabase environment variables.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {conversations.map((conversation) => (
            <Card key={conversation.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="relative w-32 h-24 bg-gray-200 rounded-l-lg overflow-hidden">
                    <Image
                      src={conversation.thumbnail || "/placeholder.svg"}
                      alt={conversation.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <h3 className="font-semibold text-lg mb-1">{conversation.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center text-sm text-gray-600">
                      <Video className="h-4 w-4 mr-1" />
                      {conversation.questions?.length || 0} questions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Link href="/record">
          <Button size="lg" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
