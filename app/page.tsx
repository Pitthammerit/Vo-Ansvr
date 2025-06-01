"use client"

import { createLogger } from "@/lib/debug"

const logger = createLogger("Page")

export default function Page() {
  logger.debug("Page component rendered")

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-white font-bold text-2xl mb-4">
          ANS/R<span className="text-red-500">.</span>
        </div>

        <h1 className="text-3xl font-bold mb-4">Welcome to ANS/R!</h1>

        <p className="text-gray-400 mb-6 text-sm">This is the main page of the application.</p>
      </div>
    </div>
  )
}
