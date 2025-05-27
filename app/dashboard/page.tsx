"use client"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User, Video, MessageSquare, Settings, Plus, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <AuthGuard requireAuth={true}>
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
          <Card>
            <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-400">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              {user ? (
                <>
                  <p>Email: {user.email}</p>
                  <Button onClick={() => signOut()} variant="destructive" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <p>No user information available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-400">
                <Video className="h-4 w-4" />
                <span>Recordings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <p>View and manage your recordings.</p>
              <Link href="/recordings">
                <Button>Go to Recordings</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-400">
                <MessageSquare className="h-4 w-4" />
                <span>Responses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <p>View and manage your responses.</p>
              <Link href="/responses">
                <Button>Go to Responses</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-400">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <p>Configure your application settings.</p>
              <Link href="/settings">
                <Button>Go to Settings</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-400">
                <Plus className="h-4 w-4" />
                <span>Create</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <p>Create new recordings and responses.</p>
              <Link href="/create">
                <Button>Go to Create</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-400">
                <AlertCircle className="h-4 w-4" />
                <span>Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <p>View any alerts or notifications.</p>
              <Button disabled>No Alerts</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
