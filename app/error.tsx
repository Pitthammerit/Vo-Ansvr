"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />

        <div className="text-white font-bold text-2xl mb-4">
          ANS/R<span className="text-red-500">.</span>
        </div>

        <h2 className="text-xl font-bold mb-4">Application Error</h2>

        <p className="text-gray-400 mb-6 text-sm">
          An unexpected error occurred. This may be due to missing configuration or a temporary issue.
        </p>

        <div className="space-y-3">
          <Button onClick={reset} className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90" style={{ borderRadius: "6px" }}>
            Try Again
          </Button>

          <Button
            onClick={() => (window.location.href = "/setup")}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            style={{ borderRadius: "6px" }}
          >
            Check Configuration
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="text-gray-400 text-xs cursor-pointer">Error Details</summary>
            <pre className="text-xs text-red-400 mt-2 overflow-auto max-h-32">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  )
}
