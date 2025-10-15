"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "./button"
import { GitHubLogoIcon } from "@radix-ui/react-icons"

interface GitHubLinkHandlerProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  callbackUrl?: string
  children?: React.ReactNode
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function GitHubLinkHandler({
  onSuccess,
  onError,
  callbackUrl = "/profile",
  children,
  variant = "default",
  size = "default",
  className
}: GitHubLinkHandlerProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleGitHubLink = async () => {
    setIsConnecting(true)

    try {
      // Use NextAuth's signIn function which properly handles state cookies
      const result = await signIn('github', {
        callbackUrl: `${callbackUrl}?github_linked=true`,
        redirect: false // Don't redirect immediately, handle the result
      })

      if (result?.error) {
        console.error('GitHub linking error:', result.error)
        onError?.(result.error)
        setIsConnecting(false)
        return
      }

      if (result?.url) {
        // NextAuth returned a URL to redirect to
        window.location.href = result.url
      } else {
        // Sign-in was successful
        onSuccess?.()
        setIsConnecting(false)
      }
    } catch (error) {
      console.error('Error during GitHub linking:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to link GitHub account')
      setIsConnecting(false)
    }
  }

  if (children) {
    // If children are provided, render them as a clickable element
    return (
      <div onClick={handleGitHubLink} className={className}>
        {children}
      </div>
    )
  }

  // Default button rendering
  return (
    <Button
      onClick={handleGitHubLink}
      disabled={isConnecting}
      variant={variant}
      size={size}
      className={className}
    >
      <GitHubLogoIcon className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting..." : "Connect GitHub"}
    </Button>
  )
}

// Hook for handling GitHub linking programmatically
export function useGitHubLinking() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const linkGitHub = async (callbackUrl: string = "/profile") => {
    setIsConnecting(true)
    setError(null)

    try {
      const result = await signIn('github', {
        callbackUrl: `${callbackUrl}?github_linked=true`,
        redirect: false
      })

      if (result?.error) {
        setError(result.error)
        setIsConnecting(false)
        return { success: false, error: result.error }
      }

      if (result?.url) {
        window.location.href = result.url
        return { success: true, redirectUrl: result.url }
      }

      setIsConnecting(false)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link GitHub account'
      setError(errorMessage)
      setIsConnecting(false)
      return { success: false, error: errorMessage }
    }
  }

  return {
    linkGitHub,
    isConnecting,
    error,
    clearError: () => setError(null)
  }
}
