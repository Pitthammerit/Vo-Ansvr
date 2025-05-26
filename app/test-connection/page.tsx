"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export default function TestConnectionPage() {
  const [supabaseStatus, setSupabaseStatus] = useState<"loading" | "success" | "error">("loading")
  const [cloudflareStatus, setCloudflareStatus] = useState<"loading" | "success" | "error">("loading")
  const [supabaseError, setSupabaseError] = useState<string>("")
  const [cloudflareError, setCloudflareError] = useState<string>("")

  useEffect(() => {
    testConnections()
  }, [])

  const testConnections = async () => {
    // Test Supabase connection
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { data, error } = await supabase.from("conversations").select("count").limit(1)

      if (error) {
        setSupabaseError(error.message)
        setSupabaseStatus("error")
      } else {
        setSupabaseStatus("success")
      }
    } catch (error) {
      setSupabaseError(error instanceof Error ? error.message : "Unknown error")
      setSupabaseStatus("error")
    }

    // Test Cloudflare connection
    try {
      const response = await fetch("/api/get-upload-url")
      const data = await response.json()

      if (response.ok && data.uploadURL) {
        setCloudflareStatus("success")
      } else {
        setCloudflareError(data.error || "Failed to get upload URL")
        setCloudflareStatus("error")
      }
    } catch (error) {
      setCloudflareError(error instanceof Error ? error.message : "Unknown error")
      setCloudflareStatus("error")
    }
  }

  const createSampleData = async () => {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      // Create a sample conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          title: "Welcome to ANSWR Lite",
          thumbnail: "/placeholder.svg?height=96&width=128",
        })
        .select()
        .single()

      if (convError) throw convError

      // Create a sample question
      const { error: questionError } = await supabase.from("questions").insert({
        conversation_id: conversation.id,
        text: "What do you think about this app?",
        video_url: null,
      })

      if (questionError) throw questionError

      alert("Sample data created successfully!")
      window.location.href = "/"
    } catch (error) {
      alert("Error creating sample data: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const StatusIcon = ({ status }: { status: "loading" | "success" | "error" }) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Supabase Database</h3>
                  <p className="text-sm text-gray-600">Testing database connection...</p>
                  {supabaseStatus === "error" && <p className="text-sm text-red-600 mt-1">{supabaseError}</p>}
                </div>
                <StatusIcon status={supabaseStatus} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Cloudflare Stream</h3>
                  <p className="text-sm text-gray-600">Testing video upload service...</p>
                  {cloudflareStatus === "error" && <p className="text-sm text-red-600 mt-1">{cloudflareError}</p>}
                </div>
                <StatusIcon status={cloudflareStatus} />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={testConnections} variant="outline" className="flex-1">
                Test Again
              </Button>
              {supabaseStatus === "success" && (
                <Button onClick={createSampleData} className="flex-1">
                  Create Sample Data
                </Button>
              )}
            </div>

            {supabaseStatus === "success" && cloudflareStatus === "success" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">🎉 All connections successful!</p>
                <p className="text-green-600 text-sm mt-1">Your ANSWR Lite app is ready to use.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
