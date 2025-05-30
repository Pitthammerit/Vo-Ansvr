"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Camera, Mic, Type, ArrowLeft, X, Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { useCampaignQuestions } from "@/lib/campaign-questions-context"
import AudioWaveform from "@/components/AudioWaveform"
import { createLogger } from "@/lib/debug"

const logger = createLogger("RecordPage")

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

export default function RecordPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { currentQuestion, nextQuestion, isLastQuestion } = useCampaignQuestions(params.campaignId as string)

  const [recordType, setRecordType] = useState<"video" | "audio" | "text">("video")
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameIdRef = useRef<number | null>(null)

  const campaignId = params.campaignId as string

  useEffect(() => {
    // Cleanup function to stop media stream tracks when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        logger.debug("Media stream tracks stopped on unmount.")
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch((e) => logger.error("Error closing AudioContext:", e))
      }
    }
  }, [stream])

  const startRecording = useCallback(async (type: "video" | "audio") => {
    setMediaError(null)
    setRecordedChunks([])
    setTextContent("") // Clear text content if switching to media recording

    try {
      const constraints: MediaStreamConstraints =
        type === "video" ? { video: { facingMode: "user" }, audio: true } : { video: false, audio: true }

      logger.info(`Attempting to get media stream with constraints: ${JSON.stringify(constraints)}`)
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current && type === "video") {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play().catch((e) => logger.error("Error playing video stream:", e))
      }

      const options = { mimeType: type === "video" ? "video/webm; codecs=vp8" : "audio/webm; codecs=opus" }
      const recorder = new MediaRecorder(mediaStream, options)
      logger.info(`MediaRecorder created with mimeType: ${options.mimeType}`)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data])
          logger.debug(`Data available: ${event.data.size} bytes`)
        }
      }

      recorder.onstop = () => {
        logger.info("MediaRecorder stopped.")
        // Stream tracks are stopped in handleStopRecording
      }

      recorder.onerror = (event) => {
        const error = event.error
        logger.error("MediaRecorder error:", error)
        setMediaError(`Recording error: ${error.name} - ${error.message}`)
        setIsRecording(false)
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }
      }

      recorder.start()
      setIsRecording(true)
      setMediaRecorder(recorder)
      logger.info("MediaRecorder started.")

      // Setup AudioContext for audio visualization if it's an audio recording
      if (type === "audio") {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        const audioContext = audioContextRef.current
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const source = audioContext.createMediaStreamSource(mediaStream)
        source.connect(analyser)
        // analyser.connect(audioContext.destination); // Connect to speakers if you want to hear it

        analyserRef.current = analyser
        dataArrayRef.current = dataArray
      }
    } catch (err) {
      logger.error("Error accessing media devices:", err)
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setMediaError("Permission denied. Please allow camera/microphone access.")
        } else if (err.name === "NotFoundError") {
          setMediaError("No camera or microphone found.")
        } else if (err.name === "NotReadableError") {
          setMediaError("Camera/microphone is in use by another application.")
        } else {
          setMediaError(`Media access error: ${err.message}`)
        }
      } else {
        setMediaError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`)
      }
      setIsRecording(false)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      logger.info("Stopping media recorder.")
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      logger.debug("Media stream tracks stopped.")
      setStream(null)
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current)
      animationFrameIdRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch((e) => logger.error("Error closing AudioContext:", e))
      audioContextRef.current = null
    }
  }, [mediaRecorder, isRecording, stream])

  const handleStopRecording = useCallback(() => {
    stopRecording()
    if (recordType === "text") {
      if (textContent.trim()) {
        router.push(
          `/c/${campaignId}/review?type=text&content=${encodeURIComponent(textContent)}&questionId=${currentQuestion?.id}`,
        )
      } else {
        setMediaError("Text content cannot be empty.")
      }
    } else if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: mediaRecorder?.mimeType })
      const url = URL.createObjectURL(blob)
      logger.info(`Recorded blob created: ${blob.size} bytes, URL: ${url}`)

      // Store recording data globally for the review page
      window.recordingData = { blob, url, type: recordType }

      router.push(`/c/${campaignId}/review?type=${recordType}&questionId=${currentQuestion?.id}`)
    } else {
      setMediaError("No media recorded.")
    }
  }, [recordedChunks, mediaRecorder, recordType, textContent, stopRecording, router, campaignId, currentQuestion?.id])

  const handleRetake = useCallback(() => {
    stopRecording()
    setRecordedChunks([])
    setTextContent("")
    setMediaError(null)
    setIsRecording(false)
    setMediaRecorder(null)
    setStream(null)
    logger.info("Retake initiated. State reset.")
  }, [stopRecording])

  const handleTypeChange = useCallback(
    (type: "video" | "audio" | "text") => {
      if (isRecording) {
        stopRecording()
      }
      setRecordType(type)
      setMediaError(null) // Clear any previous media errors
      setRecordedChunks([]) // Clear recorded chunks
      setTextContent("") // Clear text content
      logger.info(`Record type changed to: ${type}`)
    },
    [isRecording, stopRecording],
  )

  // Effect to automatically start recording when type is video or audio
  useEffect(() => {
    if (recordType !== "text" && !isRecording && !mediaError) {
      startRecording(recordType)
    }
  }, [recordType, isRecording, mediaError, startRecording])

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to record a response.</p>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading question...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-white" disabled={isRecording}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-white font-bold text-lg">
          ANS/R<span className="text-red-500">.</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Main Content Area */}
      <div className="relative w-full h-screen flex flex-col">
        {/* Question Display */}
        <div className="absolute top-1/4 left-0 right-0 z-10 text-center px-6">
          <h2 className="text-white text-2xl font-bold mb-4 leading-tight">{currentQuestion.text}</h2>
        </div>

        {/* Media/Text Input Area */}
        <div className="flex-1 relative flex items-center justify-center">
          {mediaError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
              <div className="text-center bg-gray-900 p-6 rounded-lg shadow-lg">
                <p className="text-red-400 text-lg mb-4">{mediaError}</p>
                <Button onClick={() => setMediaError(null)}>Dismiss</Button>
              </div>
            </div>
          )}

          {recordType === "video" && (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted controls={false} />
          )}

          {recordType === "audio" && (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <div className="text-center w-full px-8">
                <AudioWaveform
                  analyser={analyserRef.current}
                  dataArray={dataArrayRef.current}
                  animationFrameIdRef={animationFrameIdRef}
                  state={isRecording ? "recording" : "idle"}
                />
              </div>
            </div>
          )}

          {recordType === "text" && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type your response here..."
                className="w-full max-w-lg h-full max-h-[60vh] bg-gray-900 text-white border border-gray-700 rounded-lg p-4 text-lg resize-none focus:ring-2 focus:ring-[#2DAD71] focus:border-transparent"
              />
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 right-4 flex items-center bg-red-600 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              REC
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant="ghost"
              className={`flex-1 max-w-[120px] h-12 rounded-full text-white ${recordType === "video" ? "bg-white/20" : ""}`}
              onClick={() => handleTypeChange("video")}
              disabled={isRecording}
            >
              <Camera className="w-5 h-5 mr-2" /> Video
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 max-w-[120px] h-12 rounded-full text-white ${recordType === "audio" ? "bg-white/20" : ""}`}
              onClick={() => handleTypeChange("audio")}
              disabled={isRecording}
            >
              <Mic className="w-5 h-5 mr-2" /> Audio
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 max-w-[120px] h-12 rounded-full text-white ${recordType === "text" ? "bg-white/20" : ""}`}
              onClick={() => handleTypeChange("text")}
              disabled={isRecording}
            >
              <Type className="w-5 h-5 mr-2" /> Text
            </Button>
          </div>

          <div className="flex justify-center gap-6">
            {/* Retake Button */}
            <button
              onClick={handleRetake}
              disabled={isRecording}
              className="glass-button-circular glass-button-white disabled:bg-gray-600/50"
            >
              <RotateCcw className="w-6 h-6 text-black" strokeWidth={3} />
            </button>

            {/* Record/Stop/Send Button */}
            <button
              onClick={isRecording ? handleStopRecording : () => startRecording(recordType)}
              disabled={recordType === "text" && !textContent.trim() && !isRecording}
              className={`glass-button-circular ${isRecording ? "glass-button-red" : "glass-button-green"} disabled:bg-gray-600/50`}
            >
              {isRecording ? (
                <X className="w-6 h-6 text-white" strokeWidth={3} />
              ) : (
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
