"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Video, Mic, Type, Square, Play, Upload, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [questionText, setQuestionText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("video")
  const [uploading, setUploading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are not configured")
    }

    return createClient(supabaseUrl, supabaseAnonKey)
  }

  const startRecording = useCallback(async () => {
    try {
      const constraints = {
        video: activeTab === "video",
        audio: true,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current && activeTab === "video") {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: activeTab === "video" ? "video/webm" : "audio/webm",
        })
        setRecordedBlob(blob)
        setRecordedUrl(URL.createObjectURL(blob))

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access camera/microphone. Please check permissions.")
    }
  }, [activeTab])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const uploadToCloudflare = async (blob: Blob): Promise<string> => {
    try {
      const response = await fetch("/api/get-upload-url")
      const { uploadURL, uid } = await response.json()

      await fetch(uploadURL, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": blob.type,
        },
      })

      return uid
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }

  const handleSubmit = async () => {
    try {
      if (!title.trim()) {
        alert("Please enter a title")
        return
      }

      if (!questionText.trim()) {
        alert("Please enter a question")
        return
      }

      setUploading(true)

      let videoUrl = null

      if (activeTab !== "text" && recordedBlob) {
        videoUrl = await uploadToCloudflare(recordedBlob)
      }

      const supabase = getSupabaseClient()

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          title,
          thumbnail: activeTab === "video" ? recordedUrl : null,
        })
        .select()
        .single()

      if (convError) throw convError

      // Create question
      const { error: questionError } = await supabase.from("questions").insert({
        conversation_id: conversation.id,
        text: questionText,
        video_url: videoUrl,
      })

      if (questionError) throw questionError

      router.push("/")
    } catch (error) {
      console.error("Error saving:", error)
      alert("Failed to save. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Conversation Title</label>
              <Input placeholder="Enter conversation title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Question</label>
              <Textarea
                placeholder="What question do you want to ask?"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Audio
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Text Only
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  {recordedUrl && !isRecording && (
                    <video src={recordedUrl} controls className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex justify-center">
                  {!isRecording ? (
                    <Button onClick={startRecording} size="lg" className="rounded-full">
                      <Play className="h-6 w-6" />
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} size="lg" variant="destructive" className="rounded-full">
                      <Square className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="audio" className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <Mic className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">{isRecording ? "Recording audio..." : "Ready to record audio"}</p>
                  {recordedUrl && <audio src={recordedUrl} controls className="mt-4 mx-auto" />}
                </div>
                <div className="flex justify-center">
                  {!isRecording ? (
                    <Button onClick={startRecording} size="lg" className="rounded-full">
                      <Mic className="h-6 w-6" />
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} size="lg" variant="destructive" className="rounded-full">
                      <Square className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700 text-sm">
                    Text-only mode: Your question will be displayed as text without any video or audio.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.back()} className="flex-1" disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={uploading}>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
