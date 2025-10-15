"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Bug, Play, RotateCcw, Loader2, CheckCircle2, XCircle, StopCircle, Activity } from "lucide-react"
import { toast } from "sonner"

interface DebugScanButtonProps {
  projectId: string
  className?: string
}

interface ScanInfo {
  scan: {
    id: string
    type: string
    status: string
    progress: number
    startedAt: string
    completedAt?: string
    error?: string
    estimatedCompletion?: string
    project: {
      id: string
      name: string
      status: string
    }
  }
  vulnerabilities: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    info: number
    open: number
    resolved: number
  }
}

export function DebugScanButton({ projectId, className }: DebugScanButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [scanInfo, setScanInfo] = useState<ScanInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchScans = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First get all scans for this project
      const scansResponse = await fetch(`/api/scans?projectId=${projectId}`)
      if (!scansResponse.ok) {
        throw new Error('Failed to fetch scans')
      }

      const scansData = await scansResponse.json()
      console.log('Scans data:', scansData)

      if (scansData.scans && scansData.scans.length > 0) {
        // Get details for the latest scan
        const latestScan = scansData.scans[0]
        const scanResponse = await fetch(`/api/scans/${latestScan.id}`)

        if (scanResponse.ok) {
          const scanData = await scanResponse.json()
          setScanInfo(scanData)
          console.log('Latest scan info:', scanData)
        }
      } else {
        setScanInfo(null)
        toast.info('No scans found for this project')
      }

    } catch (err) {
      console.error('Error fetching scan info:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch scan information')
      toast.error('Failed to fetch scan information')
    } finally {
      setIsLoading(false)
    }
  }

  const startNewScan = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          type: 'COMPREHENSIVE'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start scan')
      }

      const data = await response.json()
      console.log('New scan created:', data)
      toast.success('New scan started successfully')

      // Fetch updated scan info
      setTimeout(() => {
        fetchScans()
      }, 1000)

    } catch (err) {
      console.error('Error starting scan:', err)
      setError(err instanceof Error ? err.message : 'Failed to start scan')
      toast.error('Failed to start scan')
    } finally {
      setIsLoading(false)
    }
  }

  const cancelScan = async () => {
    if (!scanInfo || scanInfo.scan.status !== 'RUNNING') return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/scans/${scanInfo.scan.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to cancel scan')
      }

      toast.success('Scan cancelled successfully')

      // Fetch updated scan info
      setTimeout(() => {
        fetchScans()
      }, 1000)

    } catch (err) {
      console.error('Error cancelling scan:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel scan')
      toast.error('Failed to cancel scan')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
        return <RotateCcw className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success' as const
      case 'failed':
        return 'destructive' as const
      case 'running':
        return 'warning' as const
      case 'pending':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <Activity className="h-4 w-4 mr-2" />
        Analysis Status
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Activity className="h-5 w-5 text-blue-600" />
                Analysis Status
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Monitor scan progress and manage analysis
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchScans}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Check Status
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={startNewScan}
              disabled={isLoading || (scanInfo?.scan.status === 'RUNNING')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Analysis
            </Button>

            {scanInfo?.scan.status === 'RUNNING' && (
              <Button
                variant="outline"
                size="sm"
                onClick={cancelScan}
                disabled={isLoading}
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/50 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {scanInfo && (
            <div className="space-y-6 p-5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Latest Scan</h4>
                <Badge variant={getStatusVariant(scanInfo.scan.status)} className="px-3 py-1">
                  {getStatusIcon(scanInfo.scan.status)}
                  <span className="ml-2 capitalize">{scanInfo.scan.status}</span>
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Scan ID</p>
                    <p className="font-mono text-sm text-slate-700 dark:text-slate-300 break-all">{scanInfo.scan.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Type</p>
                    <p className="text-sm text-slate-900 dark:text-slate-100">{scanInfo.scan.type}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Started</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{new Date(scanInfo.scan.startedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Project Status</p>
                    <p className="text-sm text-slate-900 dark:text-slate-100 capitalize">{scanInfo.scan.project.status}</p>
                  </div>
                </div>
              </div>

              {scanInfo.scan.status === 'RUNNING' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{scanInfo.scan.progress}%</p>
                  </div>
                  <Progress value={scanInfo.scan.progress} className="h-3 bg-slate-200 dark:bg-slate-700" />
                  {scanInfo.scan.estimatedCompletion && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Estimated completion: {new Date(scanInfo.scan.estimatedCompletion).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {scanInfo.scan.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950/50 dark:border-red-800">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Error Details</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{scanInfo.scan.error}</p>
                </div>
              )}

              {scanInfo.vulnerabilities.total > 0 && (
                <div className="space-y-3">
                  <h5 className="font-medium text-sm text-slate-900 dark:text-slate-100">Security Issues Found</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded border">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Critical</span>
                      <Badge variant="destructive" className="text-xs font-semibold">
                        {scanInfo.vulnerabilities.critical}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded border">
                      <span className="text-xs text-slate-600 dark:text-slate-400">High</span>
                      <Badge variant="destructive" className="text-xs font-semibold">
                        {scanInfo.vulnerabilities.high}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded border">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Medium</span>
                      <Badge variant="warning" className="text-xs font-semibold">
                        {scanInfo.vulnerabilities.medium}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded border">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Low</span>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {scanInfo.vulnerabilities.low}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded border">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Info</span>
                      <Badge variant="outline" className="text-xs font-semibold">
                        {scanInfo.vulnerabilities.info}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-800">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total</span>
                      <Badge variant="outline" className="text-xs font-semibold text-blue-700 border-blue-300">
                        {scanInfo.vulnerabilities.total}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchScans}
                  disabled={isLoading}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </div>
          )}

          {!scanInfo && !error && !isLoading && (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Click "Check Status" to view scan information</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
