"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Video } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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

  return (
    <div className="min-h-screen bg-gray-50">
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
