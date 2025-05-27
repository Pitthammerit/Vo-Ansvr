"use client"

import { useEffect, useState } from "react"

export default function EnvDebugPage() {
  const [envVars, setEnvVars] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    setEnvVars({
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      DEV_PASSWORD: process.env.NEXT_PUBLIC_DEV_PASSWORD,
      NODE_ENV: process.env.NODE_ENV,
    })
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>

        <div className="space-y-4">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="p-4 bg-gray-800 rounded">
              <div className="font-mono text-sm">
                <span className="text-blue-400">{key}:</span>
                <span className="ml-2">
                  {value ? (
                    <span className="text-green-400">
                      {key.includes("KEY") ? `${value.substring(0, 20)}...` : value}
                    </span>
                  ) : (
                    <span className="text-red-400">❌ Not set</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-900/30 rounded">
          <h2 className="font-bold mb-2">Expected .env.local format:</h2>
          <pre className="text-sm text-gray-300">
            {`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_DEV_PASSWORD=dev123456`}
          </pre>
        </div>

        <div className="mt-4">
          <button
            onClick={() => (window.location.href = "/c/demo")}
            className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white px-4 py-2 rounded"
          >
            Test /c/demo Again
          </button>
        </div>
      </div>
    </div>
  )
}
