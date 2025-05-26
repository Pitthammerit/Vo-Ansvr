"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Database, CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import { QuoteService, type Quote } from "@/lib/quote-service"
import { createClient } from "@supabase/supabase-js"

export default function TestQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [quoteService] = useState(() => new QuoteService())
  const [rotationActive, setRotationActive] = useState(false)
  const [rotationCount, setRotationCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "failed">("checking")
  const [envVars, setEnvVars] = useState({ url: "", key: "" })

  // Check environment variables
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    setEnvVars({ url, key })
  }, [])

  // Test direct Supabase connection
  const testDirectConnection = async () => {
    setConnectionStatus("checking")
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Environment variables missing")
      }

      console.log("🔍 Testing direct Supabase connection...")
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      // Test with a simple query
      const { data, error } = await supabase.from("quotes").select("count").limit(1)

      if (error) {
        console.error("❌ Direct connection failed:", error)
        throw error
      }

      console.log("✅ Direct connection successful")
      setConnectionStatus("connected")
      return true
    } catch (error) {
      console.error("💥 Connection test failed:", error)
      setConnectionStatus("failed")
      setError(error instanceof Error ? error.message : "Connection failed")
      return false
    }
  }

  const fetchQuotes = async () => {
    setLoading(true)
    setError("")
    try {
      console.log("🔄 Starting quote fetch...")
      const fetchedQuotes = await quoteService.fetchQuotes()
      setQuotes(fetchedQuotes)
      const current = quoteService.getCurrentQuote()
      setCurrentQuote(current)
      const debug = quoteService.getDebugInfo()
      setDebugInfo(debug)
      console.log("✅ Quote fetch completed")
    } catch (err) {
      console.error("❌ Quote fetch failed:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch quotes")
    } finally {
      setLoading(false)
    }
  }

  const getNextQuote = () => {
    const next = quoteService.getNextQuote()
    setCurrentQuote(next)
    setDebugInfo(quoteService.getDebugInfo())
  }

  const startRotation = () => {
    setRotationActive(true)
    setRotationCount(0)

    quoteService.startUploadQuoteRotation((newQuote) => {
      setCurrentQuote(newQuote)
      setRotationCount((prev) => prev + 1)
    })
  }

  const stopRotation = () => {
    setRotationActive(false)
    quoteService.stopUploadQuoteRotation()
  }

  useEffect(() => {
    // Test connection first, then fetch quotes
    testDirectConnection().then((connected) => {
      if (connected) {
        fetchQuotes()
      } else {
        // Still try to fetch quotes (will use fallback)
        fetchQuotes()
      }
    })

    return () => {
      quoteService.cleanup()
    }
  }, [quoteService])

  const ConnectionIcon = () => {
    switch (connectionStatus) {
      case "checking":
        return <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      case "connected":
        return <Wifi className="h-5 w-5 text-green-500" />
      case "failed":
        return <WifiOff className="h-5 w-5 text-red-500" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-gray-900 border-gray-700" style={{ borderRadius: "12px" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="h-6 w-6" />
              Quote System Debug
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Environment Variables Check */}
            <div className="p-4 bg-gray-800" style={{ borderRadius: "12px" }}>
              <h3 className="font-medium text-white mb-3">Environment Variables</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {envVars.url ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-gray-300">
                    NEXT_PUBLIC_SUPABASE_URL: {envVars.url ? "✅ Set" : "❌ Missing"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {envVars.key ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-gray-300">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: {envVars.key ? "✅ Set" : "❌ Missing"}
                  </span>
                </div>
                {envVars.url && (
                  <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                    <span className="text-gray-400">URL: </span>
                    <span className="text-gray-300">{envVars.url}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div className="p-4 bg-gray-800" style={{ borderRadius: "12px" }}>
              <h3 className="font-medium text-white mb-2">Database Connection</h3>
              <div className="flex items-center gap-2">
                <ConnectionIcon />
                <span
                  className={`${
                    connectionStatus === "connected"
                      ? "text-green-400"
                      : connectionStatus === "failed"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {connectionStatus === "checking" && "Testing connection..."}
                  {connectionStatus === "connected" && `Connected - ${quotes.length} quotes loaded`}
                  {connectionStatus === "failed" && `Failed: ${error}`}
                </span>
              </div>
              {connectionStatus === "failed" && (
                <Button onClick={testDirectConnection} size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
                  Retry Connection
                </Button>
              )}
            </div>

            {/* Debug Information */}
            <div className="p-4 bg-gray-800" style={{ borderRadius: "12px" }}>
              <h3 className="font-medium text-white mb-3">Debug Information</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• Initialized: {debugInfo.initialized ? "✅ Yes" : "❌ No"}</p>
                <p>• Using fallback: {debugInfo.usingFallback ? "⚠️ Yes" : "✅ No"}</p>
                <p>• Total quotes: {debugInfo.quotesCount || 0}</p>
                <p>• Current index: {debugInfo.currentIndex || 0}</p>
                <p>• Has Supabase client: {debugInfo.hasSupabaseClient ? "✅ Yes" : "❌ No"}</p>
                <p>• Upload rotation: {debugInfo.uploadInProgress ? "🔄 Active" : "⏹️ Stopped"}</p>
              </div>
            </div>

            {/* Current Quote Display */}
            {currentQuote && (
              <div
                className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700"
                style={{ borderRadius: "12px" }}
              >
                <h3 className="font-medium text-white mb-4">Current Quote</h3>
                <blockquote className="text-lg text-blue-200 italic mb-3 leading-relaxed">
                  "{currentQuote.text}"
                </blockquote>
                <cite className="text-blue-300 text-sm">— {currentQuote.author}</cite>
                {currentQuote.category && (
                  <div className="mt-2">
                    <span className="inline-block bg-blue-800/50 text-blue-200 text-xs px-2 py-1 rounded">
                      {currentQuote.category}
                    </span>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">ID: {currentQuote.id}</div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-4">
              <Button
                onClick={fetchQuotes}
                disabled={loading}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                style={{ borderRadius: "6px" }}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Reload Quotes
              </Button>

              <Button
                onClick={getNextQuote}
                disabled={loading || quotes.length === 0}
                className="bg-[#2DAD71] hover:bg-[#2DAD71]/90"
              >
                Next Quote
              </Button>
            </div>

            {/* Rotation Test */}
            <div className="p-4 bg-gray-800" style={{ borderRadius: "12px" }}>
              <h3 className="font-medium text-white mb-3">Upload Rotation Test</h3>
              <p className="text-gray-300 text-sm mb-4">
                This simulates the quote rotation during upload (changes every 15 seconds)
              </p>

              <div className="flex items-center gap-4 mb-4">
                {!rotationActive ? (
                  <Button
                    onClick={startRotation}
                    disabled={quotes.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Start Rotation
                  </Button>
                ) : (
                  <Button onClick={stopRotation} className="bg-red-600 hover:bg-red-700">
                    Stop Rotation
                  </Button>
                )}

                {rotationActive && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-sm">Rotating... ({rotationCount} changes)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Console Logs Notice */}
            <div className="p-4 bg-yellow-900/20 border border-yellow-700" style={{ borderRadius: "12px" }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <h3 className="font-medium text-yellow-300">Debug Console</h3>
              </div>
              <p className="text-yellow-200 text-sm">
                Open your browser's developer console (F12) to see detailed debug logs from the quote service.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
