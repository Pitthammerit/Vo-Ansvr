"use client"

import { useRef, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { QuoteService } from "@/lib/quote-service"

export default function ThanksPage() {
  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [quoteService] = useState(() => new QuoteService())

  // Thank you video ID from Cloudflare
  const thankYouVideoId = "163ef2bcb5927b2d316918134a267108"
  const videoUrl = `https://customer-55uc1p5i8i1uuc09.cloudflarestream.com/${thankYouVideoId}/manifest/video.m3u8`

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Auto-play the thank you video once with audio
    video.play().catch(console.error)
  }, [])

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
        <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay preload="auto">
          <source src={videoUrl} type="application/x-mpegURL" />
          <source
            src={`https://customer-55uc1p5i8i1uuc09.cloudflarestream.com/${thankYouVideoId}/manifest/video.mpd`}
            type="application/dash+xml"
          />
        </video>

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
