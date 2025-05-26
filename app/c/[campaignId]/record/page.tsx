"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Square, Camera, MicIcon, AlertTriangle, ThumbsUp, Wifi, WifiOff, ArrowRight } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { QuoteService, type Quote as QuoteType } from "@/lib/quote-service"

interface Quote {
  id: string
  text: string
  author: string
}

export default function RecordPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const recordType = searchParams.get("type") as "video" | "audio" | "text"
  const existingContent = searchParams.get("content") // Get existing content from URL

  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [textResponse, setTextResponse] = useState(existingContent ? decodeURIComponent(existingContent) : "") // Initialize with existing content
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [hasAttemptedRecording, setHasAttemptedRecording] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [readyToRecord, setReadyToRecord] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showThumbsUp, setShowThumbsUp] = useState(false)
  const [showRecordingText, setShowRecordingText] = useState(false)
  const [recordingSize, setRecordingSize] = useState(0)
  const [connectionQuality, setConnectionQuality] = useState<"good" | "poor" | "unknown">("unknown")
  const [chunks, setChunks] = useState<Blob[]>([])
  const [showPreviewGeneration, setShowPreviewGeneration] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<QuoteType | null>(null)
  const [quoteService] = useState(() => new QuoteService())
  const [uploadMethod, setUploadMethod] = useState<"cloudflare" | "blob">("blob")
  const [showError, setShowError] = useState(false)
  const [showDiscardWarning, setShowDiscardWarning] = useState(false)
  const [sending, setSending] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const sizeEstimateRef = useRef<NodeJS.Timeout | null>(null)

  const MAX_RECORDING_TIME = 120 // 2 minutes in seconds
  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB limit
  const CHUNK_SIZE_THRESHOLD = 1024 * 1024 // 1MB chunks

  // Get Supabase client
  const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are not configured")
    }

    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // Video configuration for optimal quality/performance
  const getMediaConstraints = () => {
    const baseConstraints = {
      video:
        recordType === "video"
          ? {
              width: { ideal: 1280, max: 1280 },
              height: { ideal: 720, max: 720 },
              frameRate: connectionQuality === "poor" ? 15 : 30,
              facingMode: "user",
            }
          : false,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: recordType === "audio" ? 44100 : 48000,
      },
    }

    return baseConstraints
  }

  // MediaRecorder options based on type and connection
  const getRecorderOptions = () => {
    if (recordType === "video") {
      const videoBitrate = connectionQuality === "poor" ? 1000000 : 2000000 // 1-2 Mbps
      return {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm",
        videoBitsPerSecond: videoBitrate,
        audioBitsPerSecond: 128000,
      }
    } else {
      return {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm",
        audioBitsPerSecond: 128000,
      }
    }
  }

  // Estimate connection quality
  const checkConnectionQuality = useCallback(async () => {
    try {
      // @ts-ignore - navigator.connection is experimental
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (connection) {
        const effectiveType = connection.effectiveType
        setConnectionQuality(effectiveType === "4g" ? "good" : "poor")
      } else {
        // Fallback: measure download speed
        const startTime = Date.now()
        await fetch("/api/get-upload-url", { method: "HEAD" })
        const endTime = Date.now()
        const responseTime = endTime - startTime
        setConnectionQuality(responseTime < 500 ? "good" : "poor")
      }
    } catch (error) {
      setConnectionQuality("unknown")
    }
  }, [])

  // Clean up old recordings and check storage
  const cleanupStorage = useCallback(() => {
    try {
      // Clear any existing session data
      const keys = Object.keys(sessionStorage)
      keys.forEach((key) => {
        if (key.startsWith("recorded") || key.includes("blob") || key.includes("video") || key.includes("audio")) {
          sessionStorage.removeItem(key)
        }
      })

      // Check available storage
      if ("storage" in navigator && "estimate" in navigator.storage) {
        navigator.storage.estimate().then((estimate) => {
          const available = estimate.quota! - estimate.usage!
          if (available < 50 * 1024 * 1024) {
            // Less than 50MB available
            setStorageError(true)
          }
        })
      }
    } catch (error) {
      console.warn("Could not clean storage:", error)
    }
  }, [])

  const setupCamera = useCallback(async () => {
    try {
      setPermissionDenied(false)
      setStorageError(false)
      cleanupStorage()
      await checkConnectionQuality()

      const constraints = getMediaConstraints()
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current && recordType === "video") {
        videoRef.current.srcObject = stream
      }

      setReadyToRecord(true)
    } catch (error) {
      console.error("Error setting up camera:", error)

      if (
        error instanceof DOMException &&
        (error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError" ||
          error.message.includes("permission") ||
          error.message.includes("denied"))
      ) {
        setPermissionDenied(true)
        return
      }

      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        setStorageError(true)
        return
      }

      setPermissionDenied(true)
    }
  }, [recordType, cleanupStorage, checkConnectionQuality])

  const startCountdown = useCallback(() => {
    // First show "Getting ready for recording" for 1.5 seconds
    setCountdown(-1) // Use -1 to indicate "getting ready" phase

    setTimeout(() => {
      setCountdown(3)

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            setShowThumbsUp(true)
            setTimeout(() => {
              setShowThumbsUp(false)
              startActualRecording()
            }, 500)
            return 0
          }
          // Play metronome sound for each countdown tick
          playWoodStickSound()
          return prev - 1
        })
      }, 1000)

      // Play initial sound
      playWoodStickSound()
      countdownRef.current = countdownInterval
    }, 1500) // Show "getting ready" for 1.5 seconds
  }, [])

  const startActualRecording = useCallback(async () => {
    try {
      if (!streamRef.current) return

      const options = getRecorderOptions()
      const mediaRecorder = new MediaRecorder(streamRef.current, options)
      mediaRecorderRef.current = mediaRecorder

      const recordedChunks: Blob[] = []
      let currentSize = 0

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data)
          currentSize += event.data.size
          setRecordingSize(currentSize)

          // Stop if we hit size limit
          if (currentSize > MAX_FILE_SIZE) {
            console.warn("Recording stopped: Size limit reached")
            mediaRecorder.stop()
          }
        }
      }

      mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(recordedChunks, {
            type: recordType === "video" ? "video/webm" : "audio/webm",
          })

          setRecordedBlob(blob)
          setRecordedUrl(URL.createObjectURL(blob))
          setChunks(recordedChunks)

          // Stop the stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
          }

          // Simulate preview generation time
          setTimeout(() => {
            setShowPreviewGeneration(false)
            router.push(`/c/${params.campaignId}/review?type=${recordType}`)
          }, 2000) // 2 second delay for preview generation
        } catch (error) {
          console.error("Error processing recording:", error)
          setStorageError(true)
          setShowPreviewGeneration(false)
        }
      }

      // Start recording with time slicing for chunked capture
      mediaRecorder.start(5000) // 5-second chunks
      setIsRecording(true)
      setRecordingTime(0)
      setShowRecordingText(true)
      setRecordingSize(0)

      // Hide recording text after 2 seconds
      setTimeout(() => {
        setShowRecordingText(false)
      }, 2000)

      // Timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Size estimation timer
      sizeEstimateRef.current = setInterval(() => {
        const estimatedRate = recordType === "video" ? 250000 : 16000 // bytes per second
        setRecordingSize((prev) => prev + estimatedRate)
      }, 1000)

      // Auto-stop at max time
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop()
        }
      }, MAX_RECORDING_TIME * 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      setStorageError(true)
    }
  }, [recordType, params.campaignId, router])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setShowPreviewGeneration(true)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (sizeEstimateRef.current) {
        clearInterval(sizeEstimateRef.current)
      }
    }
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getRemainingTime = () => {
    return MAX_RECORDING_TIME - recordingTime
  }

  const getEstimatedRate = () => {
    if (recordingTime === 0) return ""
    const rate = recordingSize / recordingTime
    const perMinute = rate * 60
    return `~${formatSize(perMinute)}/min`
  }

  const handleNext = () => {
    if (recordType === "text" && textResponse.trim()) {
      router.push(`/c/${params.campaignId}/review?type=text&content=${encodeURIComponent(textResponse)}`)
    }
  }

  const handleSendMessage = async () => {
    if (!textResponse.trim()) {
      setShowError(true)
      return
    }
    setShowError(false)
    setSending(true)

    try {
      // Store the text message (you can add actual storage logic here if needed)
      console.log("Sending text message:", textResponse)

      // Simulate a brief sending delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Navigate directly to thanks page, skipping review and upload
      router.push(`/c/${params.campaignId}/thanks?mediaId=${encodeURIComponent(textResponse)}&type=text`)
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const handleBackClick = () => {
    // For text type, check if there's content and show warning
    if (recordType === "text" && textResponse.trim()) {
      setShowDiscardWarning(true)
    } else {
      router.back()
    }
  }

  const handleDiscardConfirm = () => {
    setShowDiscardWarning(false)
    router.back()
  }

  const handleDiscardCancel = () => {
    setShowDiscardWarning(false)
  }

  const handleAllowAgain = () => {
    setPermissionDenied(false)
    setupCamera()
  }

  const handleStorageRetry = () => {
    setStorageError(false)
    cleanupStorage()
    setupCamera()
  }

  // Setup camera on mount for video/audio
  useEffect(() => {
    if (recordType !== "text" && !hasAttemptedRecording) {
      setHasAttemptedRecording(true)
      setupCamera()
    }
  }, [recordType, setupCamera, hasAttemptedRecording])

  useEffect(() => {
    const initializeQuotes = async () => {
      await quoteService.fetchQuotes()
      const initialQuote = quoteService.getCurrentQuote()
      if (initialQuote) {
        setCurrentQuote(initialQuote)
      }
    }

    initializeQuotes()

    return () => {
      quoteService.cleanup()
    }
  }, [quoteService])

  // Store recording data in component state instead of sessionStorage
  useEffect(() => {
    if (recordedBlob) {
      // Store in global state or pass via URL params instead of sessionStorage
      const blobUrl = URL.createObjectURL(recordedBlob)
      // We'll pass the blob reference through the router state
      window.recordingData = { blob: recordedBlob, url: blobUrl, type: recordType }
    }
  }, [recordedBlob, recordType])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
      if (sizeEstimateRef.current) {
        clearInterval(sizeEstimateRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [recordedUrl])

  const playWoodStickSound = () => {
    // Create a more natural wood stick sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Create multiple oscillators for a more complex, natural sound
    const oscillator1 = audioContext.createOscillator()
    const oscillator2 = audioContext.createOscillator()
    const oscillator3 = audioContext.createOscillator()

    const gainNode = audioContext.createGain()
    const filter = audioContext.createBiquadFilter()

    // Connect the audio graph
    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    oscillator3.connect(gainNode)
    gainNode.connect(filter)
    filter.connect(audioContext.destination)

    // Set frequencies for a more wooden, percussive sound
    oscillator1.frequency.setValueAtTime(1200, audioContext.currentTime) // Main click
    oscillator2.frequency.setValueAtTime(800, audioContext.currentTime) // Body resonance
    oscillator3.frequency.setValueAtTime(2400, audioContext.currentTime) // High crack

    // Use sawtooth for more natural harmonics
    oscillator1.type = "sawtooth"
    oscillator2.type = "triangle"
    oscillator3.type = "square"

    // High-pass filter to simulate wood resonance
    filter.type = "highpass"
    filter.frequency.setValueAtTime(400, audioContext.currentTime)
    filter.Q.setValueAtTime(1, audioContext.currentTime)

    // Sharp attack, quick decay for percussive sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.001) // Very fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08) // Quick decay

    // Start and stop the oscillators
    const startTime = audioContext.currentTime
    const stopTime = startTime + 0.1

    oscillator1.start(startTime)
    oscillator2.start(startTime)
    oscillator3.start(startTime)

    oscillator1.stop(stopTime)
    oscillator2.stop(stopTime)
    oscillator3.stop(stopTime)
  }

  if (recordType === "text") {
    return (
      <div className="flex flex-col h-screen bg-black text-white">
        {/* Discard Warning Overlay */}
        {showDiscardWarning && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center max-w-sm mx-4">
              <h2 className="text-2xl font-bold text-white mb-6">Are you sure you want to discard the message?</h2>

              <div className="flex justify-center gap-6">
                {/* No Button - Green (Keep message) */}
                <button
                  onClick={handleDiscardCancel}
                  className="w-16 h-16 bg-[#2DAD71] hover:bg-[#2DAD71]/90 rounded-full flex items-center justify-center transition-all"
                >
                  <span className="text-white font-bold text-lg">No</span>
                </button>

                {/* Yes Button - Red (Discard message) */}
                <button
                  onClick={handleDiscardConfirm}
                  className="w-16 h-16 bg-[#DC2626] hover:bg-[#DC2626]/90 rounded-full flex items-center justify-center transition-all"
                >
                  <span className="text-white font-bold text-lg">Yes</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-4">
          <button onClick={handleBackClick} className="hover:text-gray-400 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow px-4 pt-8 space-y-6 max-w-md mx-auto w-full">
          {/* Text Input */}
          <textarea
            value={textResponse}
            onChange={(e) => {
              setTextResponse(e.target.value)
              if (showError) setShowError(false)
            }}
            placeholder="What's on your mind? No need to be formal, just tell me straight up..."
            className="w-full h-48 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none font-light text-lg leading-relaxed"
            style={{ borderRadius: "6px" }}
          />

          {/* Send Message Button */}
          <button
            onClick={handleSendMessage}
            disabled={sending}
            className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 text-white font-semibold py-4 transition-all flex items-center justify-center gap-2"
            style={{ borderRadius: "6px" }}
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                Send Message
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {showError && (
            <p className="text-red-500 text-sm text-center">
              You didn't write anything yet. Go ahead - don't hold back!
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-white font-bold text-lg">
          ANS/R<span className="text-red-500">.</span>
        </div>
        <div className="flex items-center gap-2">
          {connectionQuality === "good" ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : connectionQuality === "poor" ? (
            <WifiOff className="w-4 h-4 text-yellow-400" />
          ) : null}
        </div>
      </div>

      {/* Storage Error Overlay */}
      {storageError && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-30">
          <div
            className="bg-gray-900 p-8 max-w-sm mx-4 text-center border border-gray-700"
            style={{ borderRadius: "12px" }}
          >
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Storage Issue</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Your device is low on storage space. We'll use a more efficient recording method.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleStorageRetry}
                className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold py-3 px-6 transition-all"
                style={{ borderRadius: "6px" }}
              >
                Continue Recording
              </button>
              <button
                onClick={() => router.back()}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 transition-all"
                style={{ borderRadius: "6px" }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied Overlay */}
      {permissionDenied && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-30">
          <div
            className="bg-gray-900 p-8 max-w-sm mx-4 text-center border border-gray-700"
            style={{ borderRadius: "12px" }}
          >
            <div className="mb-6">
              {recordType === "video" ? (
                <Camera className="w-16 h-16 text-red-400 mx-auto mb-4" />
              ) : (
                <MicIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
              )}
              <h3 className="text-xl font-bold text-white mb-2">Camera & Microphone Access</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                To record your {recordType} response, we need access to your{" "}
                {recordType === "video" ? "camera and microphone" : "microphone"}.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleAllowAgain}
                className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                style={{ borderRadius: "6px" }}
              >
                Try Again
              </button>
              <button
                onClick={() => router.back()}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                style={{ borderRadius: "6px" }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Countdown Overlay */}
      {countdown !== 0 && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-25">
          <div className="text-center">
            {countdown === -1 ? (
              // "Getting ready for recording" phase
              <div className="animate-pulse">
                <p className="text-white text-2xl font-light mb-4">Getting ready for recording</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            ) : (
              // Countdown numbers phase
              <div>
                <div
                  className="text-8xl font-bold text-white mb-4 transition-all duration-300 animate-pulse"
                  style={{
                    textShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
                    transform: countdown === 1 ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {countdown}
                </div>
                <p className="text-white text-xl font-light">Get ready...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thumbs Up Overlay */}
      {showThumbsUp && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-25">
          <div className="text-center">
            <ThumbsUp className="w-24 h-24 text-[#2DAD71] mx-auto animate-bounce" fill="currentColor" />
            <p className="text-white text-xl mt-4">Recording!</p>
          </div>
        </div>
      )}

      {/* Preview Generation Overlay */}
      {showPreviewGeneration && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-30">
          <div className="text-center max-w-sm mx-4">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Generating preview...</h2>
            <p className="text-gray-400 text-sm">This will just take a moment</p>
          </div>
        </div>
      )}

      {/* Recording Text - Shows for first 2 seconds */}
      {showRecordingText && isRecording && (
        <div className="absolute top-1/3 inset-x-4 z-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">Recording...</h2>
        </div>
      )}

      {/* Remaining Time Display - Above record button during recording */}
      {isRecording && (
        <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 z-20">
          <span
            className={`text-white text-sm font-mono ${getRemainingTime() <= 10 ? "animate-pulse text-red-400" : ""}`}
          >
            {formatTime(getRemainingTime())}
          </span>
        </div>
      )}

      {/* Video Preview or Audio Visualization */}
      <div className="relative w-full h-screen">
        {recordType === "video" ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="text-center w-full px-8">
              {/* Audio Wave Visualization */}
              <div className="flex items-center justify-center space-x-1 mb-8">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`bg-red-500 rounded-full transition-all duration-300 ${
                      isRecording ? "animate-pulse" : ""
                    }`}
                    style={{
                      width: "4px",
                      height: isRecording ? `${Math.random() * 40 + 20}px` : "20px",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        {!permissionDenied && !storageError && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex flex-col items-center">
              {isRecording ? (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {/* Progress Ring */}
                    <svg className="w-20 h-20 absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${(recordingTime / MAX_RECORDING_TIME) * 226.2} 226.2`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    {/* Record Button with enhanced pulsing */}
                    <button
                      onClick={stopRecording}
                      className="w-16 h-16 bg-[#DC2626] rounded-full flex items-center justify-center relative z-10 mx-2 my-2"
                      style={{
                        animation: "recording-pulse 1.5s ease-in-out infinite",
                        boxShadow: "0 0 20px rgba(220, 38, 38, 0.6)",
                      }}
                    >
                      <Square className="w-6 h-6 text-white" fill="white" />
                    </button>
                  </div>
                  <p className="text-white text-xs mt-2" style={{ fontSize: "10px" }}>
                    Finish
                  </p>
                </div>
              ) : readyToRecord ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* Ready to record button with enhanced pulsing when countdown is active */}
                    <button
                      onClick={startCountdown}
                      className={`w-16 h-16 bg-[#DC2626] rounded-full flex items-center justify-center transition-all ${
                        countdown !== 0 ? "animate-pulse scale-110" : "hover:scale-105"
                      }`}
                      style={{
                        boxShadow:
                          countdown !== 0 ? "0 0 25px rgba(220, 38, 38, 0.8)" : "0 0 15px rgba(220, 38, 38, 0.4)",
                      }}
                    >
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                  {/* Add same spacing as recording state */}
                  <p className="text-white text-xs mt-2 opacity-0" style={{ fontSize: "10px" }}>
                    Ready
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
