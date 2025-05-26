"use client"

import { useEffect, useState } from "react"
import { QuoteService, type Quote } from "@/lib/quote-service"

// Extend window type for preloaded quote service
declare global {
  interface Window {
    preloadedQuoteService?: QuoteService
  }
}

export default function FinalPage() {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [quoteService] = useState(() => {
    // Try to use preloaded service first, fallback to new instance
    if (typeof window !== "undefined" && window.preloadedQuoteService) {
      console.log("✅ Using preloaded quote service")
      return window.preloadedQuoteService
    }
    console.log("🔄 Creating new quote service")
    return new QuoteService()
  })

  useEffect(() => {
    const initializeQuotes = async () => {
      // If we have a preloaded service, get the current quote immediately
      if (typeof window !== "undefined" && window.preloadedQuoteService) {
        const initialQuote = quoteService.getCurrentQuote()
        if (initialQuote) {
          setCurrentQuote(initialQuote)
          return // Exit early, quotes are already loaded
        }
      }

      // Fallback: fetch quotes if not preloaded
      console.log("🔄 Fetching quotes on final page...")
      await quoteService.fetchQuotes()
      const initialQuote = quoteService.getCurrentQuote()
      if (initialQuote) {
        setCurrentQuote(initialQuote)
      }
    }

    initializeQuotes()

    return () => {
      // Clean up the global reference
      if (typeof window !== "undefined" && window.preloadedQuoteService) {
        delete window.preloadedQuoteService
      }
      quoteService.cleanup()
    }
  }, [quoteService])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="absolute top-4 left-4">
        <div className="text-white font-bold text-lg">
          ANS/R<span className="text-red-500">.</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center max-w-md mx-auto space-y-8">
        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">Thank you!</h1>
          <p className="text-xl text-gray-300">You can close the page now!</p>
        </div>

        {/* Quote Section */}
        {currentQuote && (
          <div className="bg-gray-900/50 p-6 border border-gray-700" style={{ borderRadius: "12px" }}>
            <div className="space-y-3">
              <p className="text-gray-300 text-lg italic leading-relaxed">"{currentQuote.text}"</p>
              <p className="text-gray-400 text-sm">— {currentQuote.author}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
