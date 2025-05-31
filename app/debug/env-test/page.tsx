"use client"

export default function EnvTestPage() {
  // Test if variables are available in the browser
  const clientVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_DEV_PASSWORD: process.env.NEXT_PUBLIC_DEV_PASSWORD,
  }

  // These should be undefined in the browser (server-only)
  const serverVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔍 Environment Variables Debug</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client-side variables */}
          <div className="bg-gray-800 p-6 rounded">
            <h2 className="text-xl font-bold mb-4 text-green-400">Client-side (NEXT_PUBLIC_)</h2>
            <p className="text-sm text-gray-300 mb-4">These should be available in the browser:</p>

            {Object.entries(clientVars).map(([key, value]) => (
              <div key={key} className="mb-3 p-3 bg-gray-700 rounded">
                <div className="font-mono text-sm text-blue-400">{key}:</div>
                <div className="mt-1">
                  {value ? (
                    <span className="text-green-400">
                      ✅ {key.includes("KEY") ? `${String(value).substring(0, 20)}...` : String(value)}
                    </span>
                  ) : (
                    <span className="text-red-400">❌ Not set or undefined</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Server-side variables */}
          <div className="bg-gray-800 p-6 rounded">
            <h2 className="text-xl font-bold mb-4 text-orange-400">Server-side (No prefix)</h2>
            <p className="text-sm text-gray-300 mb-4">These should be undefined in browser:</p>

            {Object.entries(serverVars).map(([key, value]) => (
              <div key={key} className="mb-3 p-3 bg-gray-700 rounded">
                <div className="font-mono text-sm text-blue-400">{key}:</div>
                <div className="mt-1">
                  {value ? (
                    <span className="text-orange-400">
                      ⚠️ Available (should be undefined): {String(value).substring(0, 20)}...
                    </span>
                  ) : (
                    <span className="text-green-400">✅ Undefined (correct for client-side)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-900/30 rounded">
          <h3 className="font-bold mb-2">📋 What you need for login to work:</h3>
          <ul className="text-sm space-y-1">
            <li>✅ NEXT_PUBLIC_SUPABASE_URL must be set and visible above</li>
            <li>✅ NEXT_PUBLIC_SUPABASE_ANON_KEY must be set and visible above</li>
            <li>✅ Both should match your Vercel values</li>
            <li>✅ Server-side variables should be undefined in browser</li>
          </ul>
        </div>

        <div className="mt-6 space-y-2">
          <button
            onClick={() => (window.location.href = "/auth/login")}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Test Login Page
          </button>
          <button
            onClick={() => (window.location.href = "/profile")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Test Profile Page
          </button>
        </div>
      </div>
    </div>
  )
}
