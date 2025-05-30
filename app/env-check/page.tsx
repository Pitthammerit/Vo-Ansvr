"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

export default function EnvCheckPage() {
  const router = useRouter()

  // These will be available in the React component
  const envVars = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DEV_PASSWORD: process.env.NEXT_PUBLIC_DEV_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
  }

  const [connectionTest, setConnectionTest] = useState<{
    status: "idle" | "testing" | "success" | "error"
    message: string
    details?: any
  }>({ status: "idle", message: "" })

  const testSupabaseConnection = async () => {
    setConnectionTest({ status: "testing", message: "Testing connection..." })

    try {
      if (!envVars.SUPABASE_URL || !envVars.SUPABASE_ANON_KEY) {
        throw new Error("Missing Supabase credentials")
      }

      // Create Supabase client
      const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_ANON_KEY)

      // Test 1: Basic connection
      const { data: healthCheck, error: healthError } = await supabase.from("conversations").select("count").limit(1)

      if (healthError) {
        throw new Error(`Database error: ${healthError.message}`)
      }

      // Test 2: Auth status
      const { data: authData } = await supabase.auth.getSession()

      setConnectionTest({
        status: "success",
        message: "✅ Supabase connection successful!",
        details: {
          database: "Connected",
          auth: authData.session ? "Logged in" : "Not logged in",
          user: authData.session?.user?.email || "No user",
        },
      })
    } catch (error) {
      setConnectionTest({
        status: "error",
        message: `❌ Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
      })
    }
  }

  const isConfigured = !!(envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY)

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔍 Environment Variables Check</h1>

        <div className="mb-6 p-4 bg-gray-800 rounded">
          <h2 className="text-lg font-bold mb-4">Status: {isConfigured ? "✅ Configured" : "❌ Missing Variables"}</h2>
        </div>

        <div className="space-y-4">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="p-4 bg-gray-800 rounded">
              <div className="flex justify-between items-center">
                <span className="font-mono text-blue-400">{key}:</span>
                <span className="ml-4">
                  {value ? (
                    <span className="text-green-400">
                      {key.includes("KEY") ? `${String(value).substring(0, 20)}...` : String(value)}
                    </span>
                  ) : (
                    <span className="text-red-400">❌ Not set</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {isConfigured && (
          <div className="mt-6">
            <button
              onClick={testSupabaseConnection}
              disabled={connectionTest.status === "testing"}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded mb-4"
            >
              {connectionTest.status === "testing" ? "🔄 Testing Connection..." : "🔌 Test Supabase Connection"}
            </button>

            {connectionTest.status !== "idle" && (
              <div
                className={`p-4 rounded ${
                  connectionTest.status === "success"
                    ? "bg-green-900/30"
                    : connectionTest.status === "error"
                      ? "bg-red-900/30"
                      : "bg-blue-900/30"
                }`}
              >
                <p className="font-bold mb-2">{connectionTest.message}</p>
                {connectionTest.details && (
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(connectionTest.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-900/30 rounded">
          <h2 className="font-bold mb-2">📝 What you need to set:</h2>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_DEV_PASSWORD=dev123456`}
          </pre>
        </div>

        {!isConfigured && (
          <div className="mt-6 p-4 bg-yellow-900/30 rounded">
            <h3 className="font-bold text-yellow-400 mb-2">🌐 Remote Development Setup:</h3>
            <p className="text-sm text-gray-300 mb-2">
              Since you're working remotely, you need to set these environment variables in your platform:
            </p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>
                • <strong>v0.dev:</strong> Use the environment variables panel
              </li>
              <li>
                • <strong>CodeSandbox:</strong> Project settings → Environment variables
              </li>
              <li>
                • <strong>Replit:</strong> Secrets tab
              </li>
              <li>
                • <strong>Other platforms:</strong> Look for environment/secrets settings
              </li>
            </ul>
          </div>
        )}

        <div className="mt-8 space-y-2">
          <button
            onClick={() => router.push("/c/demo")}
            className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white px-4 py-2 rounded"
          >
            Test /c/demo Again
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
