"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Play, Video, Mic, Type } from "lucide-react"

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
  const videoRef = useRef<HTMLVideoElement>(null)

  // Welcome video ID from Cloudflare
  const welcomeVideoId = "80c576b4fdece39a6c8abddc1aa2f7bc"
  const videoUrl = `https://customer-55uc1p5i8i1uuc09.cloudflarestream.com/${welcomeVideoId}/manifest/video.m3u8`
  const posterUrl = `https://customer-55uc1p5i8i1uuc09.cloudflarestream.com/${welcomeVideoId}/thumbnails/thumbnail.jpg?time=0s`

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
    router.push(`/c/${params.campaignId}/auth?type=${type}`)
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
            src={`https://customer-55uc1p5i8i1uuc09.cloudflarestream.com/${welcomeVideoId}/manifest/video.mpd`}
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
        <div className="absolute bottom-28 inset-x-4 z-20 text-center">
          <p className="text-white text-lg font-medium">How would you like to respond?</p>
        </div>

        {/* Response Buttons */}
        <div className="absolute bottom-8 inset-x-4 z-20">
          <div className="flex justify-center items-center gap-4 max-w-md mx-auto">
            {/* Audio Button */}
            <button
              onClick={() => handleResponseType("audio")}
              className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-medium rounded-md flex flex-col items-center justify-center gap-1 transition-all"
              style={{ width: "64px", height: "64px", borderRadius: "6px" }}
              aria-label="Respond with audio"
            >
              <Mic className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">AUDIO</span>
            </button>

            {/* Video Button - Bigger */}
            <button
              onClick={() => handleResponseType("video")}
              className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-medium rounded-md flex flex-col items-center justify-center gap-1 transition-all shadow-lg ring-2 ring-white/20"
              style={{ width: "76px", height: "76px", borderRadius: "6px" }}
              aria-label="Respond with video"
            >
              <Video className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">VIDEO</span>
            </button>

            {/* Text Button */}
            <button
              onClick={() => handleResponseType("text")}
              className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-medium rounded-md flex flex-col items-center justify-center gap-1 transition-all"
              style={{ width: "64px", height: "64px", borderRadius: "6px" }}
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
