"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TestLoginPage() {
  const { signIn, signOut, user } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleTestLogin = async () => {
    setLoading(true)
    setMessage("")

    try {
      await signIn(email, password)
      setMessage("Login successful!")
    } catch (error: any) {
      setMessage(`Login failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setMessage("Signed out successfully")
    } catch (error: any) {
      setMessage(`Sign out failed: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Login</h1>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div>
              <p className="text-green-600">Logged in as: {user.email}</p>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={handleTestLogin} disabled={loading || !email || !password}>
                {loading ? "Testing..." : "Test Login"}
              </Button>
            </div>
          )}

          {message && (
            <div
              className={`p-2 rounded ${message.includes("successful") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
