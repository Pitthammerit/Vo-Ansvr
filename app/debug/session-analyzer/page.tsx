"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function SessionAnalyzerPage() {
  const { user, session } = useAuth()
  const [sessionHistory, setSessionHistory] = useState<any[]>([])

  useEffect(() => {
    const history = {
      timestamp: new Date().toISOString(),
      user: user ? "Present" : "Absent",
      session: session ? "Active" : "Inactive",
      userAgent: navigator.userAgent,
    }

    setSessionHistory((prev) => [...prev, history].slice(-10)) // Keep last 10 entries
  }, [user, session])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Session Analyzer</h1>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessionHistory.map((entry, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-mono">{entry.timestamp}</div>
                <div>
                  User: {entry.user} | Session: {entry.session}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
