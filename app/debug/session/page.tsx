"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SessionDebugPage() {
  const { user, session, loading } = useAuth()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Session Debug</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Loading:</span>
                <span>{loading ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span>User:</span>
                <span>{user ? "Authenticated" : "Not authenticated"}</span>
              </div>
              <div className="flex justify-between">
                <span>Session:</span>
                <span>{session ? "Active" : "None"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {user && (
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(user, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
