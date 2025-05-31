"use client"

import { useRef, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { QuoteService } from "@/lib/quote-service"
import { supabase } from "@/lib/supabase"

interface CampaignThankYouData {
  id: string
  external_title: string
  thank_you_type: "video" | "text" | "none"
  thank_you_video_id?: string
  thank_you_message?: string
}

export default function ThanksPage() {
  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [quoteService] = useState(() => new QuoteService())
  const [campaignData, setCampaignData] = useState<CampaignThankYouData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const campaignId = params.campaignId as string

  // Fetch campaign thank you data from Supabase
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: supabaseError } = await supabase
          .from("campaigns")
          .select("id, external_title, thank_you_type, thank_you_video_id, thank_you_message")
          .eq("id", campaignId)
          .eq("status", "active")
          .single()

        if (supabaseError) {
          console.error("Error fetching campaign:", supabaseError)
          setError("Campaign not found or not active")
          return
        }

        setCampaignData(data)
      } catch (err) {
        console.error("Error loading campaign:", err)
        setError("Failed to load campaign data")
      } finally {
        setLoading(false)
      }
    }

    if (campaignId) {
      fetchCampaignData()
    }
  }, [campaignId])

  // Dynamic video URL based on fetched campaign data
  const videoUrl =
    campaignData?.thank_you_type === "video" && campaignData?.thank_you_video_id
      ? `https://customer-55uc1p5i8i1uuc09.cloudflarestream.com/${campaignData.thank_you_video_id}/manifest/video.m3u8`
      : null

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    // Auto-play the thank you video once with audio
    video.play().catch(console.error)
  }, [videoUrl])

  // Preload quotes in the background while video plays
  useEffect(() => {
    const preloadQuotes = async () => {
      console.log("🔄 Preloading quotes on thanks page...")
      await quoteService.fetchQuotes()
      console.log("✅ Quotes preloaded successfully")
    }

    preloadQuotes()

    return () => {
      // Don't cleanup here - let the final page use the same service
    }
  }, [quoteService])

  const handleSendAnother = () => {
    router.push(`/c/${params.campaignId}`)
  }

  const handleDone = () => {
    // Store the preloaded quote service globally so final page can access it instantly
    if (typeof window !== "undefined") {
      window.preloadedQuoteService = quoteService
    }
    router.push(`/c/${params.campaignId}/final`)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !campaignData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <p className="text-gray-400 mb-4">{error || "This campaign does not exist or is not active."}</p>
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
        {/* Conditional rendering based on thank_you_type */}
        {campaignData.thank_you_type === "video" && videoUrl && (
          <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay preload="auto">
            <source src={videoUrl} type="application/x-mpegURL" />
            <source
              src={`https://customer-55uc1p5i8i1uuc09.cloudflarestream.com/${campaignData.thank_you_video_id}/manifest/video.mpd`}
              type="application/dash+xml"
            />
          </video>
        )}

        {campaignData.thank_you_type === "text" && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center max-w-2xl px-8">
              <h1 className="text-4xl font-bold mb-6 text-white">Thank You!</h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                {campaignData.thank_you_message || "Thank you for your response!"}
              </p>
            </div>
          </div>
        )}

        {campaignData.thank_you_type === "none" && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center max-w-2xl px-8">
              <h1 className="text-4xl font-bold mb-6 text-white">Response Submitted</h1>
              <p className="text-xl text-gray-300 leading-relaxed">Your response has been successfully submitted.</p>
            </div>
          </div>
        )}

        {/* Send Another Message Text - Using master design system */}
        <div className="master-text-container">
          <h2 className="master-text-above-buttons">Send another message?</h2>
        </div>

        {/* Action Buttons - Using master design system */}
        <div className="master-button-container">
          <div className="flex justify-center gap-8 max-w-sm mx-auto">
            <button onClick={handleSendAnother} className="glass-button-circular glass-button-green">
              <span className="text-white font-bold text-lg">Yes</span>
            </button>
            <button onClick={handleDone} className="glass-button-circular glass-button-white">
              <span className="text-black font-bold text-lg">No</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
