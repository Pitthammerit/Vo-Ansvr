"use client"

import { useEffect, useState } from "react"
import { QuoteService, type Quote } from "@/lib/quote-service"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import Link from "next/link"

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

  // Add auth hook
  const { user, signOut, isDemo } = useAuth()

  useEffect(() => {
    const initializeQuotes = async () => {
      try {
        // If we have a preloaded service, get the current quote immediately
        if (typeof window !== "undefined" && window.preloadedQuoteService) {
          console.log("✅ Using preloaded quote service")
          const initialQuote = quoteService.getCurrentQuote()
          if (initialQuote) {
            setCurrentQuote(initialQuote)
            return // Exit early, quotes are already loaded
          }
        }

        // Fallback: fetch quotes if not preloaded
        console.log("🔄 Fetching quotes on final page...")
        try {
          await quoteService.fetchQuotes()
          const initialQuote = quoteService.getCurrentQuote()
          if (initialQuote) {
            setCurrentQuote(initialQuote)
          } else {
            console.log("ℹ️ No quotes available, continuing without quotes")
          }
        } catch (quoteError) {
          console.warn("⚠️ Failed to fetch quotes, continuing without quotes:", quoteError)
          // Don't throw error, just continue without quotes
        }
      } catch (error) {
        console.error("❌ Error initializing quotes:", error)
        // Don't throw error, just continue without quotes
      }
    }

    initializeQuotes()

    return () => {
      try {
        // Clean up the global reference
        if (typeof window !== "undefined" && window.preloadedQuoteService) {
          delete window.preloadedQuoteService
        }
        quoteService.cleanup()
      } catch (cleanupError) {
        console.warn("⚠️ Error during cleanup:", cleanupError)
      }
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

        {/* User Actions - Only show if user is authenticated */}
        {(user || isDemo) && (
          <div className="space-y-4">
            <Link href="/dashboard">
              <Button
                className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold py-3 px-6 transition-all flex items-center justify-center gap-2"
                style={{ borderRadius: "6px" }}
              >
                <User className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </Link>

            <Button
              onClick={signOut}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 font-semibold py-3 px-6 transition-all flex items-center justify-center gap-2"
              style={{ borderRadius: "6px" }}
            >
              <LogOut className="w-4 h-4" />
              {isDemo ? "Exit Demo" : "Sign Out"}
            </Button>
          </div>
        )}

        {/* Quote Section */}
        {currentQuote ? (
          <div className="bg-gray-900/50 p-6 border border-gray-700" style={{ borderRadius: "12px" }}>
            <div className="space-y-3">
              <p className="text-gray-300 text-lg italic leading-relaxed">"{currentQuote.text}"</p>
              <p className="text-gray-400 text-sm">— {currentQuote.author}</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 p-6 border border-gray-700" style={{ borderRadius: "12px" }}>
            <div className="space-y-3">
              <p className="text-gray-300 text-lg italic leading-relaxed">
                "Success is not final, failure is not fatal: it is the courage to continue that counts."
              </p>
              <p className="text-gray-400 text-sm">— Winston Churchill</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
