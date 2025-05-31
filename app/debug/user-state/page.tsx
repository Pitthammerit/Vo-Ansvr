"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function UserStateDebugPage() {
  const authContext = useAuth()

  const refreshAuth = () => {
    window.location.reload()
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">User State Debug</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth Context State</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(authContext, null, 2)}</pre>
            <Button onClick={refreshAuth} className="mt-4">
              Refresh Auth State
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
