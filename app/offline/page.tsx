import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Offline() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>You're Offline</CardTitle>
          <CardDescription>No internet connection detected</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Don't worry! This app works offline. You can still browse cached content. Check your internet connection and
            try again.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
