"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EnvDebugPage() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "***SET***" : "Not set",
    NEXT_PUBLIC_CF_ACCOUNT_ID: process.env.NEXT_PUBLIC_CF_ACCOUNT_ID || "Not set",
    NODE_ENV: process.env.NODE_ENV || "Not set",
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>

      <Card>
        <CardHeader>
          <CardTitle>Public Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-mono text-sm">{key}</span>
                <span className="text-sm text-gray-600">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
