"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Play, Pause, AlertCircle, Check, X } from "lucide-react"
import { QuoteService, type Quote } from "@/lib/quote-service"

// Extend window type for recording data
declare global {
  interface Window {
    recordingData?: {
      blob: Blob
      url: string
      type: string
    }
  }
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const recordType = searchParams.get("type") as "video" | "audio" | "text"
  const textContent = searchParams.get("content")

  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [canPlay, setCanPlay] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [quoteTransitioning, setQuoteTransitioning] = useState(false)
  const [quoteService] = useState(() => new QuoteService())
  const [quoteChangeCount, setQuoteChangeCount] = useState(0)
  const [uploadMethod, setUploadMethod] = useState<"cloudflare" | "blob">("blob")
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null)

  // Initialize quotes on component mount
  useEffect(() => {
    const initializeQuotes = async () => {
      console.log("🔄 Initializing quote service...")
      await quoteService.fetchQuotes()
      const initialQuote = quoteService.getCurrentQuote()
      console.log("📝 Initial quote loaded:", initialQuote?.text?.substring(0, 50) + "...")
      if (initialQuote) {
        setCurrentQuote(initialQuote)
      }
    }

    initializeQuotes()

    // Cleanup on unmount
    return () => {
      quoteService.cleanup()
    }
  }, [quoteService])

  useEffect(() => {
    if (recordType !== "text") {
      // Get recording data from global state instead of sessionStorage
      const recordingData = window.recordingData
      if (recordingData && recordingData.type === recordType) {
        setRecordedBlob(recordingData.blob)
        setRecordedUrl(recordingData.url)
      } else {
        setMediaError("No recording found")
      }
    }
  }, [recordType])

  useEffect(() => {
    const mediaElement = recordType === "video" ? videoRef.current : audioRef.current
    if (!mediaElement || !recordedUrl) return

    const handleCanPlay = () => {
      setCanPlay(true)
      setMediaError(null)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    const handleError = (e: Event) => {
      console.error("Media playback error:", e)
      setMediaError("Playback error")
      setCanPlay(false)
    }

    mediaElement.addEventListener("canplay", handleCanPlay)
    mediaElement.addEventListener("play", handlePlay)
    mediaElement.addEventListener("pause", handlePause)
    mediaElement.addEventListener("ended", handleEnded)
    mediaElement.addEventListener("error", handleError)

    return () => {
      mediaElement.removeEventListener("canplay", handleCanPlay)
      mediaElement.removeEventListener("play", handlePlay)
      mediaElement.removeEventListener("pause", handlePause)
      mediaElement.removeEventListener("ended", handleEnded)
      mediaElement.removeEventListener("error", handleError)
    }
  }, [recordedUrl, recordType])

  useEffect(() => {
    return () => {
      if (recordedUrl && recordedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [recordedUrl])

  // Handle quote rotation during upload
  useEffect(() => {
    if (uploading) {
      console.log("🔄 Starting quote rotation for upload...")
      // Start quote rotation
      quoteService.startUploadQuoteRotation((newQuote) => {
        console.log("📝 Quote changed to:", newQuote.text.substring(0, 50) + "...")
        setQuoteChangeCount((prev) => prev + 1)
        setQuoteTransitioning(true)
        setTimeout(() => {
          setCurrentQuote(newQuote)
          setTimeout(() => {
            setQuoteTransitioning(false)
          }, 150) // Half of transition duration
        }, 150)
      })
    } else {
      console.log("⏹️ Stopping quote rotation")
      // Stop quote rotation
      quoteService.stopUploadQuoteRotation()
    }

    return () => {
      quoteService.stopUploadQuoteRotation()
    }
  }, [uploading, quoteService])

  const handlePlayPause = async () => {
    try {
      const mediaElement = recordType === "video" ? videoRef.current : audioRef.current
      if (!mediaElement) return

      if (isPlaying) {
        mediaElement.pause()
      } else {
        setMediaError(null)
        await mediaElement.play()
      }
    } catch (error) {
      console.error("Playback error:", error)
      setMediaError("Could not play media")
      setCanPlay(false)
    }
  }

  const handleRetake = () => {
    if (recordedUrl && recordedUrl.startsWith("blob:")) {
      URL.revokeObjectURL(recordedUrl)
    }
    // Clear global recording data
    if (window.recordingData) {
      delete window.recordingData
    }

    // For text type, navigate back with the content preserved
    if (recordType === "text" && textContent) {
      router.push(`/c/${params.campaignId}/record?type=text&content=${encodeURIComponent(textContent)}`)
    } else {
      router.back()
    }
  }

  const handleGoBack = () => {
    // For text type, navigate back with the content preserved
    if (recordType === "text" && textContent) {
      router.push(`/c/${params.campaignId}/record?type=text&content=${encodeURIComponent(textContent)}`)
    } else {
      router.back()
    }
  }

  const uploadToVercelBlob = async (blob: Blob): Promise<string> => {
    try {
      console.log("📤 Uploading to Vercel Blob...", {
        size: blob.size,
        type: blob.type,
      })

      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error("Invalid blob data")
      }

      const filename = `recording-${Date.now()}.webm`

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = Math.min(prev + Math.random() * 15, 90)
          return Math.floor(newProgress) // Remove decimals
        })
      }, 200)

      const response = await fetch(`/api/upload-blob?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        body: blob,
        headers: {
          "Content-Type": blob.type || "application/octet-stream",
        },
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(`Upload failed: ${response.statusText} - ${errorData.error || errorData.details || ""}`)
      }

      const result = await response.json()
      console.log("✅ Vercel Blob upload successful:", result.url)
      return result.url
    } catch (error) {
      console.error("❌ Vercel Blob upload failed:", error)
      throw error
    }
  }

  const uploadToCloudflare = async (blob: Blob): Promise<string> => {
    try {
      console.log("📤 Uploading to Cloudflare Stream...")

      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error("Invalid blob data")
      }

      // Get upload URL from API
      const response = await fetch("/api/get-upload-url")
      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.statusText}`)
      }

      const { uploadURL, uid } = await response.json()

      if (!uploadURL || !uid) {
        throw new Error("Invalid upload URL response")
      }

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = Math.min(prev + Math.random() * 15, 90)
          return Math.floor(newProgress) // Remove decimals
        })
      }, 200)

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": blob.type || "application/octet-stream",
        },
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!uploadResponse.ok) {
        throw new Error(`Cloudflare upload failed: ${uploadResponse.statusText}`)
      }

      console.log("✅ Cloudflare upload successful:", uid)
      return uid
    } catch (error) {
      console.error("❌ Cloudflare upload failed:", error)
      throw error
    }
  }

  const handleSend = async () => {
    try {
      setUploading(true)
      setUploadProgress(0)
      setQuoteChangeCount(0)
      setUploadStartTime(Date.now())
      console.log("🚀 Starting upload process...")

      let mediaUid = ""

      if (recordType === "text") {
        mediaUid = textContent || ""
      } else if (recordedBlob) {
        // Validate blob before upload
        if (!recordedBlob || recordedBlob.size === 0) {
          throw new Error("No valid recording data available")
        }

        console.log("📊 Blob info:", {
          size: recordedBlob.size,
          type: recordedBlob.type,
          constructor: recordedBlob.constructor.name,
        })

        // Try Vercel Blob first, fallback to Cloudflare
        try {
          if (uploadMethod === "blob") {
            mediaUid = await uploadToVercelBlob(recordedBlob)
          } else {
            mediaUid = await uploadToCloudflare(recordedBlob)
          }
        } catch (error) {
          console.warn("Primary upload method failed, trying fallback...", error)
          if (uploadMethod === "blob") {
            setUploadMethod("cloudflare")
            mediaUid = await uploadToCloudflare(recordedBlob)
          } else {
            setUploadMethod("blob")
            mediaUid = await uploadToVercelBlob(recordedBlob)
          }
        }
      } else {
        throw new Error("No recording data available")
      }

      // Ensure we stay on page for at least 5 seconds
      const elapsedTime = Date.now() - (uploadStartTime || Date.now())
      const remainingTime = Math.max(0, 5000 - elapsedTime)

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime))
      }

      // Clean up blob URL and global data
      if (recordedUrl && recordedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(recordedUrl)
      }
      if (window.recordingData) {
        delete window.recordingData
      }

      console.log("✅ Upload completed, navigating to thanks page...")
      // Navigate to thanks page instead of auth page
      router.push(`/c/${params.campaignId}/thanks?mediaId=${mediaUid}&type=${recordType}`)
    } catch (error) {
      console.error("Error sending:", error)
      alert(`Failed to send: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setUploadStartTime(null)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button onClick={handleGoBack} className="text-white" disabled={uploading}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-white font-bold text-lg">
          ANS/R<span className="text-red-500">.</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Upload Progress Overlay */}
      {uploading && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-30">
          <div className="text-center max-w-lg mx-4 px-6">
            <h2 className="text-xl font-bold text-white mb-6">Your message is uploading...</h2>

            {/* Progress Circle */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 rounded-full border-4 border-white/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-lg font-bold">{uploadProgress}%</span>
              </div>
              <svg className="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(uploadProgress / 100) * 276.5} 276.5`}
                  className="transition-all duration-300"
                />
              </svg>
            </div>

            <p className="text-white text-xs mb-8 font-medium">Please keep your App open.</p>

            {/* Quote with elegant design matching the final screen */}
            {currentQuote && (
              <div className={`transition-opacity duration-300 ${quoteTransitioning ? "opacity-0" : "opacity-100"}`}>
                <div className="bg-gray-900/50 p-8 border border-gray-700" style={{ borderRadius: "12px" }}>
                  <div className="space-y-4">
                    <p className="text-white text-xl italic leading-relaxed font-light">"{currentQuote.text}"</p>
                    <p className="text-gray-400 text-base font-medium">— {currentQuote.author}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative w-full h-screen flex flex-col">
        {/* Preview Area */}
        <div className="flex-1 relative">
          {recordType === "text" ? (
            <div className="h-full flex flex-col justify-start items-center px-6 py-8">
              <div className="max-w-lg w-full flex flex-col h-full">
                <h3 className="text-white text-lg font-light mb-6 text-center">Your message reads</h3>
                <div
                  className="bg-gray-900 p-6 w-full flex-1 max-h-[60vh] overflow-y-auto border border-gray-700"
                  style={{ borderRadius: "12px" }}
                >
                  <p className="text-lg font-light text-white leading-relaxed break-words hyphens-auto whitespace-pre-wrap word-wrap-break-word">
                    {textContent}
                  </p>
                </div>
                {/* Spacer to ensure buttons don't overlap */}
                <div className="h-24"></div>
              </div>
            </div>
          ) : recordType === "video" && recordedUrl ? (
            <div className="relative h-full">
              <video
                ref={videoRef}
                src={recordedUrl}
                className="w-full h-full object-cover"
                playsInline
                preload="metadata"
                muted
              />
              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                {mediaError ? (
                  <div className="text-center bg-black/70 p-6" style={{ borderRadius: "12px" }}>
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white text-lg mb-2">Preview Unavailable</p>
                    <p className="text-gray-300 text-sm">{mediaError}</p>
                  </div>
                ) : (
                  <button
                    onClick={handlePlayPause}
                    disabled={!canPlay && !mediaError}
                    className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" fill="white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : recordType === "audio" && recordedUrl ? (
            <div className="relative h-full">
              {/* Simple dark background for audio */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black"></div>

              {/* Play/Pause Overlay - Same as Video */}
              <div className="absolute inset-0 flex items-center justify-center">
                {mediaError ? (
                  <div className="text-center bg-black/70 p-6" style={{ borderRadius: "12px" }}>
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white text-lg mb-2">Preview Unavailable</p>
                    <p className="text-gray-300 text-sm">{mediaError}</p>
                  </div>
                ) : (
                  <button
                    onClick={handlePlayPause}
                    disabled={!canPlay && !mediaError}
                    className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" fill="white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    )}
                  </button>
                )}
              </div>

              <audio ref={audioRef} src={recordedUrl} preload="metadata" className="hidden" />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-white text-lg">Loading preview...</p>
              </div>
            </div>
          )}
        </div>

        {/* Ready to Send Message - Fixed positioning with better spacing */}
        <div className="absolute bottom-32 inset-x-4 z-20 text-center">
          <h2 className="text-xl font-bold text-white mb-2 bg-black/50 backdrop-blur-sm rounded-lg py-2 px-4 inline-block">
            Ready to send?
          </h2>
        </div>

        {/* Smaller Circular Action Buttons */}
        <div className="absolute bottom-8 inset-x-4 z-20">
          <div className="flex gap-6 justify-center max-w-sm mx-auto">
            {/* Yes Button - Smaller Circle */}
            <button
              onClick={handleSend}
              disabled={uploading}
              className="w-16 h-16 bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 rounded-full flex items-center justify-center transition-all shadow-lg"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              )}
            </button>

            {/* No Button - Smaller Circle */}
            <button
              onClick={handleRetake}
              disabled={uploading}
              className="w-16 h-16 bg-white hover:bg-gray-200 disabled:bg-gray-600 rounded-full flex items-center justify-center transition-all shadow-lg"
            >
              <X className="w-6 h-6 text-black" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
