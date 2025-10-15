"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ReportTemplate } from "@/components/report-template"
import {
  Download,
  Printer,
  Eye,
  FileText,
  Share2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  Bookmark,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ReportViewerProps {
  reportData: any
  reportId: string
  projectName: string
  onDownloadPdf?: () => void
  onShare?: () => void
  className?: string
}

export function ReportViewer({
  reportData,
  reportId,
  projectName,
  onDownloadPdf,
  onShare,
  className
}: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState("formatted")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML
      const originalContent = document.body.innerHTML

      // Create print-specific styles
      const printStyles = `
        <style>
          @media print {
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            .page-break { page-break-before: always; }
            .no-print { display: none !important; }
            .print-full-width { width: 100% !important; max-width: none !important; }
            @page { margin: 0.5in; size: A4; }
          }
        </style>
      `

      document.head.insertAdjacentHTML('beforeend', printStyles)
      document.body.innerHTML = printContent

      window.print()

      // Restore original content
      document.body.innerHTML = originalContent

      // Remove print styles
      const addedStyles = document.querySelectorAll('style:last-of-type')
      addedStyles.forEach(style => style.remove())
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50))
  const handleResetZoom = () => setZoom(100)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-gray-50 dark:bg-gray-900",
      isFullscreen && "fixed inset-0 z-50 bg-white dark:bg-gray-900",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b shadow-sm no-print">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Security Report
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {projectName} • Report #{reportId.slice(-8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Controls */}
          <div className="flex items-center gap-1 mr-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem] text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 150}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              title="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            onClick={toggleFullscreen}
            className="gap-2"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? "Exit" : "Fullscreen"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowPrintPreview(!showPrintPreview)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>

          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>

          <Button
            onClick={onDownloadPdf || (() => {})}
            disabled={!onDownloadPdf}
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>

          <Button
            variant="outline"
            onClick={onShare || (() => {})}
            disabled={!onShare}
            className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-white dark:bg-gray-800 no-print px-4">
            <TabsTrigger value="formatted" className="gap-2">
              <FileText className="w-4 h-4" />
              Formatted Report
            </TabsTrigger>
            <TabsTrigger value="raw" className="gap-2">
              <Settings className="w-4 h-4" />
              Raw Data
            </TabsTrigger>
            {showPrintPreview && (
              <TabsTrigger value="print" className="gap-2">
                <Printer className="w-4 h-4" />
                Print Preview
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="formatted" className="flex-1 m-0 p-0 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div
                className="print-full-width transition-all duration-200 min-h-full"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
              >
                <div className="max-w-4xl mx-auto p-6 min-h-screen">
                  <div ref={printRef}>
                    <ReportTemplate
                      data={reportData}
                      reportId={reportId}
                      generatedAt={new Date()}
                      className="bg-white shadow-lg rounded-lg print:shadow-none print:rounded-none"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="raw" className="flex-1 m-0 p-0 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="p-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Raw Report Data
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      JSON representation of the report data structure
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto">
                      <pre className="text-xs leading-relaxed text-gray-800 dark:text-gray-200">
                        {JSON.stringify(reportData, null, 2)}
                      </pre>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(reportData, null, 2))
                        }}
                      >
                        Copy JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `report-${reportId}.json`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download JSON
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {showPrintPreview && (
            <TabsContent value="print" className="flex-1 m-0 p-0 overflow-hidden">
              <ScrollArea className="h-full w-full">
                <div className="p-6 bg-gray-100 dark:bg-gray-800">
                  <div className="max-w-[8.5in] mx-auto bg-white shadow-xl">
                    <div className="aspect-[8.5/11] overflow-hidden">
                      <ReportTemplate
                        data={reportData}
                        reportId={reportId}
                        generatedAt={new Date()}
                        className="scale-75 origin-top-left"
                      />
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Print preview - This is how your report will look when printed
                    </p>
                    <Button
                      onClick={handlePrint}
                      className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Printer className="w-4 h-4" />
                      Print Report
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t text-xs text-gray-600 dark:text-gray-400 no-print">
        <div className="flex items-center gap-4">
          <span>Report ID: {reportId}</span>
          <span>•</span>
          <span>Generated: {new Date().toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-4">
          <span>Zoom: {zoom}%</span>
          <span>•</span>
          <span>View: {activeTab}</span>
          {isFullscreen && (
            <>
              <span>•</span>
              <span>Fullscreen Mode</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
