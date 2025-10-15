"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import {
  Github,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Plus,
  Loader2
} from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"

interface GitHubQuickConnectProps {
  onConnected?: () => void
  className?: string
}

export function GitHubQuickConnect({
  onConnected,
  className
}: GitHubQuickConnectProps) {
  const { data: session } = useSession()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkGitHubConnection = React.useCallback(async () => {
    if (!session?.user) return

    setIsChecking(true)
    try {
      const res = await fetch("/api/profile/accounts")
      if (res.ok) {
        const data = await res.json()
        const hasGithub = data.accounts?.some((acc: Record<string, unknown>) => acc.provider === "github")
        setIsConnected(hasGithub)
      }
    } catch (error) {
      console.error("Error checking GitHub connection:", error)
    } finally {
      setIsChecking(false)
    }
  }, [session])

  React.useEffect(() => {
    checkGitHubConnection()
  }, [checkGitHubConnection])

  const connectGitHub = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Store current URL for redirect after connection
      const currentUrl = window.location.href

      // Get GitHub OAuth URL from our custom linking endpoint
      const response = await fetch("/api/auth/link-github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          callbackUrl: currentUrl
        })
      })

      if (!response.ok) {
        throw new Error("Failed to generate GitHub auth URL")
      }

      const data = await response.json()

      // Redirect to GitHub OAuth
      window.location.href = data.authUrl
    } catch (error) {
      console.error("Error connecting GitHub:", error)
      setError("Failed to connect GitHub account")
      setIsConnecting(false)
    }
  }

  const handleTryAgain = () => {
    setError(null)
    checkGitHubConnection()
  }

  if (isChecking) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Checking GitHub connection...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isConnected) {
    return (
      <Card className={cn("border-green-200 bg-green-50 dark:bg-green-950/20", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <Github className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-green-900 dark:text-green-100">
                    GitHub Connected
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You can now access your repositories
                </p>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Ready
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-red-50 dark:bg-red-950/20", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <span className="font-medium text-red-900 dark:text-red-100">
                  Connection Failed
                </span>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTryAgain}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-dashed border-orlixis-teal/30 bg-orlixis-teal/5", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Github className="h-5 w-5 text-orlixis-teal" />
          <CardTitle className="text-base">Connect GitHub</CardTitle>
        </div>
        <CardDescription>
          Access your repositories for easy project imports
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Benefits of connecting:</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Browse your repositories</li>
                <li>• Select branches</li>
                <li>• Import private repos</li>
                <li>• Seamless integration</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" size="sm" className="text-xs">
                Quick Setup
              </Badge>
              <Badge variant="outline" size="sm" className="text-xs">
                Secure OAuth
              </Badge>
            </div>

            <Button
              onClick={connectGitHub}
              disabled={isConnecting}
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect GitHub
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <div className="flex items-center justify-center space-x-1">
              <span>Need help?</span>
              <button
                onClick={() => window.open('/profile', '_blank')}
                className="text-orlixis-teal hover:underline inline-flex items-center"
              >
                Visit Profile
                <ExternalLink className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
