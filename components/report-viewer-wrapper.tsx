"use client"

import React, { useState, useEffect } from "react"
import { ReportViewer } from "@/components/report-viewer"

interface ReportViewerWrapperProps {
  reportData: any
  reportId: string
  projectName: string
  className?: string
}

export function ReportViewerWrapper({
  reportData,
  reportId,
  projectName,
  className
}: ReportViewerWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-full w-full bg-background border rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-muted-foreground">Loading report viewer...</p>
        </div>
      </div>
    )
  }



  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/pdf`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}-security-audit-report.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download PDF:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Security Report - ${projectName}`,
          text: `Security audit report for ${projectName}`,
          url: window.location.href
        })
      } catch (error) {
        console.error('Failed to share:', error)
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  return (
    <ReportViewer
      reportData={reportData}
      reportId={reportId}
      projectName={projectName}
      onDownloadPdf={handleDownloadPdf}
      onShare={handleShare}
      className={className}
    />
  )
}
