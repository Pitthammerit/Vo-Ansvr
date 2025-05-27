"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class AuthErrorBoundary extends React.Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth Error Boundary caught an error:", error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })

    // Log to external service if needed
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("auth-error", {
          detail: { error: error.message, stack: error.stack, errorInfo },
        }),
      )
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    // Try to recover the auth state
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />
      }

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Something went wrong with the authentication system. This is usually a temporary issue.
              </p>

              {this.state.error && (
                <div className="bg-red-900/20 border border-red-700 p-3 rounded text-sm">
                  <p className="text-red-400 font-medium">Error Details:</p>
                  <p className="text-red-300 mt-1">{this.state.error.message}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="bg-[#2DAD71] hover:bg-[#2DAD71]/90 flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = "/")}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>If this problem persists:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache</li>
                  <li>Try in incognito/private mode</li>
                  <li>Check your internet connection</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
