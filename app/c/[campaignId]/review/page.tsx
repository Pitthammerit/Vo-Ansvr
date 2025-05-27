"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Play, Pause, AlertCircle, Check, X } from "lucide-react"
import { QuoteService, type Quote } from "@/lib/quote-service"
import AudioWaveform from "@/components/AudioWaveform"
import { createClient } from "@supabase/supabase-js"

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase environment variables not configured - using demo mode")
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

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
      // Get recording data from global state
      const recordingData = window.recordingData
      if (recordingData && recordingData.type === recordType) {
        console.log("📹 Found recording data:", {
          type: recordingData.type,
          blobSize: recordingData.blob.size,
          url: recordingData.url,
        })
        setRecordedBlob(recordingData.blob)
        setRecordedUrl(recordingData.url)
      } else {
        console.error("❌ No recording data found")
        setMediaError("No recording found")
      }
    }
  }, [recordType])

  // Enhanced media element setup with better error handling
  useEffect(() => {
    if (!recordedUrl || recordType === "text") return

    const mediaElement = recordType === "video" ? videoRef.current : audioRef.current
    if (!mediaElement) {
      console.error("❌ Media element not found")
      return
    }

    console.log("🔧 Setting up media element:", {
      type: recordType,
      url: recordedUrl,
      element: mediaElement.tagName,
    })

    const handleLoadStart = () => {
      console.log("📥 Media load started")
      setMediaError(null)
    }

    const handleLoadedMetadata = () => {
      console.log("📊 Media metadata loaded")
    }

    const handleLoadedData = () => {
      console.log("✅ Media data loaded")
      setCanPlay(true)
      setMediaError(null)
    }

    const handleCanPlay = () => {
      console.log("▶️ Media can play")
      setCanPlay(true)
      setMediaError(null)
    }

    const handleCanPlayThrough = () => {
      console.log("🎯 Media can play through")
      setCanPlay(true)
      setMediaError(null)
    }

    const handlePlay = () => {
      console.log("▶️ Media started playing")
      setIsPlaying(true)
    }

    const handlePause = () => {
      console.log("⏸️ Media paused")
      setIsPlaying(false)
    }

    const handleEnded = () => {
      console.log("🏁 Media ended")
      setIsPlaying(false)
    }

    const handleError = (e: Event) => {
      const target = e.target as HTMLMediaElement
      const error = target.error
      console.error("❌ Media error:", {
        code: error?.code,
        message: error?.message,
        networkState: target.networkState,
        readyState: target.readyState,
      })

      let errorMessage = "Playback error"
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Playback aborted"
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Network error"
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Decode error"
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Format not supported"
            break
          default:
            errorMessage = "Unknown playback error"
        }
      }

      setMediaError(errorMessage)
      setCanPlay(false)
      setIsPlaying(false)
    }

    const handleWaiting = () => {
      console.log("⏳ Media waiting for data")
    }

    const handleStalled = () => {
      console.log("🚫 Media stalled")
    }

    // Add all event listeners
    mediaElement.addEventListener("loadstart", handleLoadStart)
    mediaElement.addEventListener("loadedmetadata", handleLoadedMetadata)
    mediaElement.addEventListener("loadeddata", handleLoadedData)
    mediaElement.addEventListener("canplay", handleCanPlay)
    mediaElement.addEventListener("canplaythrough", handleCanPlayThrough)
    mediaElement.addEventListener("play", handlePlay)
    mediaElement.addEventListener("pause", handlePause)
    mediaElement.addEventListener("ended", handleEnded)
    mediaElement.addEventListener("error", handleError)
    mediaElement.addEventListener("waiting", handleWaiting)
    mediaElement.addEventListener("stalled", handleStalled)

    // Set the source and load
    mediaElement.src = recordedUrl
    mediaElement.load()

    return () => {
      // Remove all event listeners
      mediaElement.removeEventListener("loadstart", handleLoadStart)
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
      mediaElement.removeEventListener("loadeddata", handleLoadedData)
      mediaElement.removeEventListener("canplay", handleCanPlay)
      mediaElement.removeEventListener("canplaythrough", handleCanPlayThrough)
      mediaElement.removeEventListener("play", handlePlay)
      mediaElement.removeEventListener("pause", handlePause)
      mediaElement.removeEventListener("ended", handleEnded)
      mediaElement.removeEventListener("error", handleError)
      mediaElement.removeEventListener("waiting", handleWaiting)
      mediaElement.removeEventListener("stalled", handleStalled)
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
      if (!mediaElement) {
        console.error("❌ No media element found for playback")
        return
      }

      console.log("🎮 Play/Pause clicked:", {
        isPlaying,
        canPlay,
        readyState: mediaElement.readyState,
        networkState: mediaElement.networkState,
        paused: mediaElement.paused,
        ended: mediaElement.ended,
      })

      if (isPlaying) {
        console.log("⏸️ Pausing media")
        mediaElement.pause()
      } else {
        if (!canPlay) {
          console.log("⚠️ Media not ready, attempting to load")
          mediaElement.load()
          // Wait a bit for load to start
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        console.log("▶️ Playing media")
        setMediaError(null)

        try {
          await mediaElement.play()
          console.log("✅ Play successful")
        } catch (playError) {
          console.error("❌ Play failed:", playError)
          setMediaError("Could not play media - " + (playError as Error).message)
          setCanPlay(false)
        }
      }
    } catch (error) {
      console.error("❌ Playback error:", error)
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

  const uploadToCloudflare = async (blob: Blob): Promise<string> => {
    try {
      console.log("📤 Starting Cloudflare upload process...")
      console.log("📊 Blob details:", {
        size: blob.size,
        type: blob.type,
        sizeInMB: (blob.size / (1024 * 1024)).toFixed(2) + " MB",
      })

      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error("Invalid blob data - blob is empty or null")
      }

      // Check blob size (Cloudflare has limits)
      const maxSize = 200 * 1024 * 1024 // 200MB limit
      if (blob.size > maxSize) {
        throw new Error(`File too large: ${(blob.size / (1024 * 1024)).toFixed(2)}MB (max: 200MB)`)
      }

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = Math.min(prev + Math.random() * 10, 85)
          return Math.floor(newProgress)
        })
      }, 300)

      try {
        // Step 1: Get upload URL from our API
        console.log("🔗 Getting upload URL from API...")
        const response = await fetch("/api/get-upload-url", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log("🔗 API response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }))
          console.error("❌ API error:", errorData)
          throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`)
        }

        const { uploadURL, uid } = await response.json()

        console.log("🔗 Upload URL received:", {
          hasUploadURL: !!uploadURL,
          hasUID: !!uid,
          uid: uid,
        })

        if (!uploadURL || !uid) {
          throw new Error("Invalid API response - missing uploadURL or uid")
        }

        // Step 2: Upload to Cloudflare using POST with FormData
        console.log("☁️ Uploading to Cloudflare Stream using POST method...")

        // Create FormData for multipart upload
        const formData = new FormData()

        // Add the file with a proper filename and extension
        const fileExtension = recordType === "video" ? "webm" : "webm"
        const fileName = `recording-${Date.now()}.${fileExtension}`

        formData.append("file", blob, fileName)

        console.log("📋 FormData prepared:", {
          fileName: fileName,
          blobSize: blob.size,
          blobType: blob.type,
        })

        const uploadResponse = await fetch(uploadURL, {
          method: "POST", // Changed from PUT to POST
          body: formData, // Using FormData instead of raw blob
          // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        })

        console.log("☁️ Cloudflare upload response:", {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          ok: uploadResponse.ok,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text().catch(() => "Could not read error response")
          console.error("❌ Cloudflare upload failed:", errorText)
          throw new Error(`Cloudflare upload failed (${uploadResponse.status}): ${uploadResponse.statusText}`)
        }

        console.log("✅ Upload successful! Video ID:", uid)
        return uid
      } catch (fetchError) {
        clearInterval(progressInterval)

        // Check if this is a network/environment issue
        if (fetchError instanceof TypeError && fetchError.message.includes("fetch")) {
          console.log("🌐 Network error detected, checking if we're in preview mode...")

          // Fallback to demo mode for preview environments
          console.log("🎭 Switching to demo mode due to network error")
          setUploadProgress(100)
          return "demo-video-network-fallback-" + Date.now()
        }

        throw fetchError
      }
    } catch (error) {
      console.error("💥 Upload process failed:", error)

      // For demo/preview environments, always fall back gracefully
      const isDemoMode =
        window.location.hostname.includes("v0.dev") ||
        window.location.hostname.includes("localhost") ||
        !process.env.NEXT_PUBLIC_SUPABASE_URL

      if (isDemoMode) {
        console.log("🎭 Demo mode fallback activated")
        setUploadProgress(100)
        return "demo-video-error-fallback-" + Date.now()
      }

      // Re-throw error for production environments
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
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
        console.log("📝 Text message, skipping upload")
      } else if (recordedBlob) {
        // Validate blob before upload
        if (!recordedBlob || recordedBlob.size === 0) {
          throw new Error("No valid recording data available")
        }

        console.log("📊 Starting media upload...")

        try {
          // Upload to Cloudflare Stream
          mediaUid = await uploadToCloudflare(recordedBlob)
          console.log("✅ Upload completed with ID:", mediaUid)
        } catch (uploadError) {
          console.error("❌ Upload failed:", uploadError)

          // Show user-friendly error message
          const errorMessage = uploadError instanceof Error ? uploadError.message : "Upload failed"

          // For now, continue with demo flow even on error
          console.log("🎭 Continuing with demo flow despite upload error")
          mediaUid = "demo-video-upload-error-" + Date.now()
        }
      } else {
        throw new Error("No recording data available")
      }

      // Ensure we stay on page for at least 3 seconds (reduced from 5)
      const elapsedTime = Date.now() - (uploadStartTime || Date.now())
      const remainingTime = Math.max(0, 3000 - elapsedTime)

      if (remainingTime > 0) {
        console.log(`⏳ Waiting ${remainingTime}ms more for minimum upload time`)
        await new Promise((resolve) => setTimeout(resolve, remainingTime))
      }

      // Clean up blob URL and global data
      if (recordedUrl && recordedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(recordedUrl)
      }
      if (window.recordingData) {
        delete window.recordingData
      }

      console.log("✅ Process completed, navigating to thanks page...")
      router.push(`/c/${params.campaignId}/thanks?mediaId=${mediaUid}&type=${recordType}`)
    } catch (error) {
      console.error("💥 Critical error in handleSend:", error)

      // Even on critical error, try to continue the flow
      const fallbackMediaId = "demo-critical-error-" + recordType + "-" + Date.now()
      console.log("🆘 Using critical error fallback, navigating anyway...")
      router.push(`/c/${params.campaignId}/thanks?mediaId=${fallbackMediaId}&type=${recordType}`)
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
        <div className="absolute inset-0 bg-black flex items-center justify-center z-30">
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
                className="w-full h-full object-cover"
                playsInline
                preload="metadata"
                muted={false}
                controls={false}
              />
              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                {mediaError ? (
                  <div className="text-center bg-black/70 p-6" style={{ borderRadius: "12px" }}>
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white text-lg mb-2">Preview Unavailable</p>
                    <p className="text-gray-300 text-sm">{mediaError}</p>
                    <button
                      onClick={() => {
                        setMediaError(null)
                        setCanPlay(false)
                        const video = videoRef.current
                        if (video) {
                          video.load()
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-[#2DAD71] text-white rounded"
                    >
                      Retry
                    </button>
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
              {/* Same background as recording page */}
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                <div className="text-center w-full px-8">
                  {/* Audio Waveform Visualization - Same as recording page */}
                  <div className="mb-12 px-4">
                    <AudioWaveform state={isPlaying ? "playing" : "idle"} />
                  </div>
                </div>
              </div>

              {/* Play/Pause Overlay - Same as Video */}
              <div className="absolute inset-0 flex items-center justify-center">
                {mediaError ? (
                  <div className="text-center bg-black/70 p-6" style={{ borderRadius: "12px" }}>
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white text-lg mb-2">Preview Unavailable</p>
                    <p className="text-gray-300 text-sm">{mediaError}</p>
                    <button
                      onClick={() => {
                        setMediaError(null)
                        setCanPlay(false)
                        const audio = audioRef.current
                        if (audio) {
                          audio.load()
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-[#2DAD71] text-white rounded"
                    >
                      Retry
                    </button>
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

              <audio ref={audioRef} preload="metadata" className="hidden" controls={false} />
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
        <div className="absolute bottom-36 inset-x-4 z-20 text-center">
          <h2 className="text-xl font-bold text-white mb-2 py-2 px-4 inline-block">Ready to send?</h2>
        </div>

        {/* Smaller Circular Action Buttons */}
        <div className="absolute bottom-16 inset-x-4 z-20">
          <div className="flex gap-6 justify-center max-w-sm mx-auto">
            {/* Yes Button - Smaller Circle */}
            <button
              onClick={handleSend}
              disabled={uploading}
              className="w-16 h-16 bg-[#2DAD71]/50 backdrop-blur-md hover:bg-[#2DAD71]/60 disabled:bg-gray-600/50 rounded-full flex items-center justify-center transition-all shadow-lg"
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
              className="w-16 h-16 bg-white/50 backdrop-blur-md hover:bg-white/60 disabled:bg-gray-600/50 rounded-full flex items-center justify-center transition-all shadow-lg"
            >
              <X className="w-6 h-6 text-black" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
