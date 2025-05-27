"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

export default function SimpleTestPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runSimpleTests()
  }, [])

  const runSimpleTests = async () => {
    const testResults = []

    // Test 1: Environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    testResults.push({
      test: "Environment Variables",
      url: url ? "✅ Present" : "❌ Missing",
      key: key ? "✅ Present" : "❌ Missing",
      urlValue: url,
      keyValue: key ? key.substring(0, 20) + "..." : "Missing",
    })

    if (url && key) {
      // Test 2: Direct Supabase client creation
      try {
        const supabase = createClient(url, key)
        testResults.push({
          test: "Supabase Client Creation",
          status: "✅ Success",
          client: "Created successfully",
        })

        // Test 3: Basic connection test
        try {
          const { data, error } = await supabase.auth.getSession()
          testResults.push({
            test: "Get Session Call",
            status: error ? "❌ Error" : "✅ Success",
            error: error?.message || "None",
            hasSession: !!data?.session,
            data: data,
          })
        } catch (e) {
          testResults.push({
            test: "Get Session Call",
            status: "❌ Exception",
            error: e instanceof Error ? e.message : "Unknown error",
            exception: e,
          })
        }

        // Test 4: Direct API call
        try {
          const response = await fetch(`${url}/rest/v1/`, {
            headers: {
              apikey: key,
              "Content-Type": "application/json",
            },
          })

          testResults.push({
            test: "Direct API Call",
            status: response.ok ? "✅ Success" : "❌ Failed",
            httpStatus: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          })
        } catch (e) {
          testResults.push({
            test: "Direct API Call",
            status: "❌ Exception",
            error: e instanceof Error ? e.message : "Unknown error",
          })
        }

        // Test 5: Auth endpoint specifically
        try {
          const response = await fetch(`${url}/auth/v1/user`, {
            headers: {
              apikey: key,
              "Content-Type": "application/json",
            },
          })

          const text = await response.text()

          testResults.push({
            test: "Auth Endpoint",
            status: response.status === 401 ? "✅ Expected 401" : response.ok ? "✅ Success" : "❌ Failed",
            httpStatus: response.status,
            statusText: response.statusText,
            responseText: text,
          })
        } catch (e) {
          testResults.push({
            test: "Auth Endpoint",
            status: "❌ Exception",
            error: e instanceof Error ? e.message : "Unknown error",
          })
        }
      } catch (e) {
        testResults.push({
          test: "Supabase Client Creation",
          status: "❌ Failed",
          error: e instanceof Error ? e.message : "Unknown error",
        })
      }
    }

    setResults(testResults)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Running simple tests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Simple Auth Test Results</h1>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-gray-900 border border-gray-700 rounded p-4">
              <h3 className="text-lg font-semibold mb-2">{result.test}</h3>
              <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <button onClick={runSimpleTests} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Run Tests Again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
