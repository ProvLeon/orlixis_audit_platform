"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Rocket, Sparkles, Loader2, CheckCircle2, AlertCircle, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RunAnalysisButtonProps {
  projectId: string
  variant?: "default" | "outline" | "ghost" | "destructive" | "success"
  size?: "default" | "sm" | "lg"
  className?: string
  children?: React.ReactNode
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function RunAnalysisButton({
  projectId,
  variant = "default",
  size = "default",
  className,
  children,
  onSuccess,
  onError
}: RunAnalysisButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleRunAnalysis = async () => {
    if (isLoading || isAnalyzing) return

    setIsLoading(true)
    setError(null)
    setIsSuccess(false)
    setProgress(0)
    setCurrentPhase("")

    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          type: "COMPREHENSIVE",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to start analysis (${response.status})`)
      }

      const data = await response.json()
      setScanId(data.scan.id)
      setIsLoading(false)
      setIsAnalyzing(true)
      setCurrentPhase("Starting analysis...")

      // Start polling for progress
      pollScanProgress(data.scan.id)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start analysis"
      setError(errorMessage)
      onError?.(errorMessage)
      setIsLoading(false)
    }
  }

  const pollScanProgress = async (scanId: string) => {
    try {
      const response = await fetch(`/api/scans/${scanId}`)
      if (!response.ok) return

      const data = await response.json()
      const scan = data.scan

      setProgress(scan.progress || 0)

      // Update phase based on progress
      if (scan.progress <= 10) {
        setCurrentPhase("Initializing...")
      } else if (scan.progress <= 40) {
        setCurrentPhase("Security analysis...")
      } else if (scan.progress <= 60) {
        setCurrentPhase("Quality check...")
      } else if (scan.progress <= 80) {
        setCurrentPhase("Performance analysis...")
      } else if (scan.progress <= 90) {
        setCurrentPhase("Dependency scan...")
      } else if (scan.progress < 100) {
        setCurrentPhase("Generating report...")
      }

      if (scan.status === "COMPLETED") {
        setIsAnalyzing(false)
        setIsSuccess(true)
        setCurrentPhase("Analysis completed!")
        onSuccess?.()

        // Refresh the page to show results
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else if (scan.status === "FAILED") {
        setIsAnalyzing(false)
        setError(scan.error || "Analysis failed")
        onError?.(scan.error || "Analysis failed")
      } else if (scan.status === "RUNNING" || scan.status === "PENDING") {
        // Continue polling
        setTimeout(() => pollScanProgress(scanId), 2000)
      }
    } catch (err) {
      console.error("Failed to poll scan progress:", err)
      // Continue polling even if one request fails
      setTimeout(() => pollScanProgress(scanId), 3000)
    }
  }

  const getIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />
    if (isAnalyzing) return <Activity className="h-4 w-4 animate-pulse" />
    if (isSuccess) return <CheckCircle2 className="h-4 w-4" />
    if (error) return <AlertCircle className="h-4 w-4" />
    return <Sparkles className="h-4 w-4" />
  }

  const getText = () => {
    if (isLoading) return "Starting Analysis..."
    if (isAnalyzing) return `${progress}% - ${currentPhase}`
    if (isSuccess) return "Analysis Complete!"
    if (error) return "Analysis Failed"
    return children || "Run Analysis"
  }

  return (
    <Button
      variant={error ? "destructive" : isSuccess ? "success" : variant}
      size={size}
      className={cn(className)}
      onClick={handleRunAnalysis}
      disabled={isLoading || isAnalyzing}
    >
      {getIcon()}
      {getText()}
    </Button>
  )
}

// Convenience component for the main action button
export function RunAnalysisMainButton({ projectId, className }: { projectId: string; className?: string }) {
  return (
    <RunAnalysisButton
      projectId={projectId}
      className={cn("gap-2 shadow-orlixis", className)}
    >
      <Rocket className="h-4 w-4" />
      Run analysis
    </RunAnalysisButton>
  )
}

// Convenience component for sidebar quick actions
export function RunAnalysisQuickButton({ projectId, className }: { projectId: string; className?: string }) {
  return (
    <RunAnalysisButton
      projectId={projectId}
      variant="default"
      className={cn("w-full justify-start gap-2", className)}
    >
      <Sparkles className="h-4 w-4" />
      Run comprehensive analysis
    </RunAnalysisButton>
  )
}
