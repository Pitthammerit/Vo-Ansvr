"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Play, Video, Mic, Type } from "lucide-react"
import { TopNavButton } from "@/components/TopNavButton"
import { getSupabaseClient } from "@/lib/supabase"

interface CampaignData {
  id: string
  external_title: string
  description?: string
  welcome_video_id: string
}

export default function CampaignPage() {
  const params = useParams()
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasPlayedPreview, setHasPlayedPreview] = useState(false)
  const [userInitiatedPlay, setUserInitiatedPlay] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const campaignId = params.campaignId as string

  // Default fallback video ID (used if database fetch fails)
  const fallbackWelcomeVideoId = "80c576b4fdece39a6c8abddc1aa2f7bc"

  // Fetch campaign data from Supabase
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching campaign data for ID:", campaignId)

        try {
          const supabase = getSupabaseClient()

          // Log Supabase client status
          console.log("Supabase client initialized:", !!supabase)

          const { data, error: supabaseError } = await supabase
            .from("campaigns")
            .select("id, external_title, description, welcome_video_id")
            .eq("id", campaignId)
            .single()

          if (supabaseError) {
            console.error("Supabase error:", supabaseError)
            throw new Error(`Supabase error: ${supabaseError.message}`)
          }

          if (!data) {
            console.warn("No campaign data returned")
            throw new Error("Campaign not found")
          }

          if (!data.welcome_video_id) {
            console.warn("Campaign has no welcome video ID")
            throw new Error("No welcome video configured for this campaign")
          }

          console.log("Campaign data fetched successfully:", data)
          setCampaignData(data)
        } catch (supabaseErr) {
          console.error("Failed to fetch from Supabase:", supabaseErr)

          // Use fallback for demo/testing purposes
          if (campaignId === "65b2d919-c99b-4306-86d6-601b72ae0c34" || campaignId === "demo") {
            console.log("Using fallback data for demo campaign")
            setCampaignData({
              id: campaignId,
              external_title: "Demo Campaign",
              welcome_video_id: fallbackWelcomeVideoId,
            })
          } else {
            throw supabaseErr
          }
        }
      } catch (err) {
        console.error("Error in fetchCampaignData:", err)
        setError(`Failed to load campaign data: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    if (campaignId) {
      fetchCampaignData()
    }
  }, [campaignId, fallbackWelcomeVideoId])

  // Get video ID - either from database or fallback
  const videoId = campaignData?.welcome_video_id || fallbackWelcomeVideoId

  // Dynamic video URLs based on video ID
  const videoUrl = `https://customer-55uc1p5i8i1uuc09.cloudflarestream.com/${videoId}/manifest/video.m3u8`
  const posterUrl = `https://customer-55uc1p5i8i1uuc09.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=0s`

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)

    const handleLoadedData = () => {
      console.log("Video loaded")
      setVideoLoaded(true)

      // Auto-play muted preview only once when video loads
      if (!hasPlayedPreview && !userInitiatedPlay) {
        console.log("Starting muted preview")
        video.muted = true
        video.currentTime = 0
        video.play().catch((error) => {
          console.log("Auto-preview failed:", error)
          setShowThumbnail(true)
          setHasPlayedPreview(true)
        })
      }
    }

    const handleEnded = () => {
      if (!userInitiatedPlay && !hasPlayedPreview) {
        // Muted preview ended
        console.log("Muted preview ended - showing thumbnail")
        setHasPlayedPreview(true)
        setShowThumbnail(true)
        setIsPlaying(false)
        video.pause()
        video.currentTime = 0
      } else if (userInitiatedPlay) {
        // User-initiated full video ended
        console.log("Full video ended - returning to thumbnail")
        setIsPlaying(false)
        setUserInitiatedPlay(false)
        setShowThumbnail(true)
        video.pause()
        video.currentTime = 0
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      if (!userInitiatedPlay) {
        setIsPlaying(false)
      }
    }

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", updateDuration)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", updateDuration)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [hasPlayedPreview, userInitiatedPlay])

  const handlePlayClick = () => {
    const video = videoRef.current
    if (!video) return

    console.log("User clicked play - starting full video with audio")

    // Mark that user has initiated play
    setUserInitiatedPlay(true)
    setShowThumbnail(false)

    // Reset video to beginning and enable audio
    video.currentTime = 0
    video.muted = false

    // Play the full video with audio
    video.play()
    setIsPlaying(true)
  }

  const handleResponseType = (type: "video" | "audio" | "text") => {
    // Always require authentication for all campaigns (including demo)
    console.log("🔐 Requiring authentication for campaign:", campaignId)
    router.push(`/c/${campaignId}/auth?type=${type}`)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading campaign...</p>
        </div>
      </div>
    )
  }

  // Show error state - only if we have an error AND no fallback data
  if (error && !campaignData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white px-6 py-2 rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Show play button when:
  // 1. Video is not loaded yet
  // 2. Showing thumbnail (after preview or after full video)
  // 3. Video is muted (during preview)
  const showPlayButton = !videoLoaded || showThumbnail || (videoLoaded && !userInitiatedPlay)

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Logo */}
      <div className="absolute top-4 left-4 z-20">
        <div className="text-white font-bold text-lg">
          ANS/R<span className="text-red-500">.</span>
        </div>
      </div>

      {/* Top Right Navigation Button */}
      <TopNavButton />

      {/* Video Container */}
      <div className="relative w-full h-screen">
        {/* Thumbnail overlay - show when video hasn't loaded or when explicitly showing thumbnail */}
        {(!videoLoaded || showThumbnail) && (
          <div
            className="absolute inset-0 z-5 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${posterUrl})` }}
          />
        )}

        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!videoLoaded || showThumbnail ? "opacity-0" : "opacity-100"}`}
          playsInline
          preload="auto"
          poster={posterUrl}
        >
          <source src={videoUrl} type="application/x-mpegURL" />
          <source
            src={`https://customer-55uc1p5i8i1uuc09.cloudflarestream.com/${videoId}/manifest/video.mpd`}
            type="application/dash+xml"
          />
        </video>

        {/* Play Button Overlay */}
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button
              onClick={handlePlayClick}
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
              aria-label="Play video"
            >
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </button>
          </div>
        )}

        {/* Response Text */}
        <div className="absolute bottom-[164px] inset-x-4 z-20 text-center">
          <p className="master-text-above-buttons">How would you like to respond?</p>
        </div>

        {/* Response Buttons */}
        <div className="master-button-container">
          <div className="flex justify-center items-center gap-4 max-w-md mx-auto">
            {/* Audio Button */}
            <button
              onClick={() => handleResponseType("audio")}
              className="glass-button-response-small"
              aria-label="Respond with audio"
            >
              <Mic className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">AUDIO</span>
            </button>

            {/* Video Button - Bigger */}
            <button
              onClick={() => handleResponseType("video")}
              className="glass-button-response-large"
              aria-label="Respond with video"
            >
              <Video className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">VIDEO</span>
            </button>

            {/* Text Button */}
            <button
              onClick={() => handleResponseType("text")}
              className="glass-button-response-small"
              aria-label="Respond with text"
            >
              <Type className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">TEXT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
