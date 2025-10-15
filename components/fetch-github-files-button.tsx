"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { GitBranch, Loader2, Download } from "lucide-react"
import { toast } from "sonner"

interface FetchGitHubFilesButtonProps {
  projectId: string
  repositoryUrl?: string | null
  hasFiles?: boolean
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  onSuccess?: () => void
}

export function FetchGitHubFilesButton({
  projectId,
  repositoryUrl,
  hasFiles = false,
  variant = "outline",
  size = "sm",
  className,
  onSuccess
}: FetchGitHubFilesButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Only show button for GitHub repositories
  const isGitHubRepo = repositoryUrl && repositoryUrl.includes('github.com')

  if (!isGitHubRepo) {
    return null
  }

  const handleFetchFiles = async () => {
    if (hasFiles) {
      const confirmed = confirm(
        "This will replace all existing files with the latest from the GitHub repository. Continue?"
      )
      if (!confirmed) return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/fetch-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch repository files')
      }

      toast.success(
        `Successfully imported ${data.filesImported} files from the repository!`
      )

      onSuccess?.()

      // Refresh the page to show the new data
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Error fetching GitHub files:', error)

      if (error instanceof Error && error.message.includes('access token')) {
        toast.error('GitHub authentication required. Please sign out and sign back in with GitHub.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch repository files')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleFetchFiles}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <GitBranch className="h-4 w-4 mr-2" />
      )}
      {isLoading ? 'Fetching Files...' : hasFiles ? 'Refresh Files' : 'Fetch Files'}
    </Button>
  )
}
