"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Activity,
  Play,
  StopCircle,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  Code,
  TrendingUp,
  Package
} from "lucide-react"
import { toast } from "sonner"

interface ScanManagerProps {
  projectId: string
  className?: string
  showHistory?: boolean
}

interface ScanInfo {
  id: string
  type: string
  status: string
  progress: number
  startedAt: string
  completedAt?: string
  error?: string
  vulnerabilityCount?: number
}

const scanTypes = [
  {
    id: 'SECURITY',
    name: 'Security Analysis',
    description: 'Scan for security vulnerabilities and threats',
    icon: Shield,
    color: 'text-orlixis-teal',
    bgColor: 'bg-orlixis-teal/10 dark:bg-orlixis-teal/20',
    borderColor: 'border-orlixis-teal/30 dark:border-orlixis-teal/30'
  },
  {
    id: 'QUALITY',
    name: 'Code Quality',
    description: 'Analyze code quality and best practices',
    icon: Code,
    color: 'text-orlixis-teal',
    bgColor: 'bg-orlixis-teal/10 dark:bg-orlixis-teal/20',
    borderColor: 'border-orlixis-teal/30 dark:border-orlixis-teal/30'
  },
  {
    id: 'PERFORMANCE',
    name: 'Performance',
    description: 'Check for performance bottlenecks',
    icon: TrendingUp,
    color: 'text-orlixis-teal',
    bgColor: 'bg-orlixis-teal/10 dark:bg-orlixis-teal/20',
    borderColor: 'border-orlixis-teal/30 dark:border-orlixis-teal/30'
  },
  {
    id: 'DEPENDENCY',
    name: 'Dependencies',
    description: 'Analyze dependencies and licenses',
    icon: Package,
    color: 'text-orlixis-teal',
    bgColor: 'bg-orlixis-teal/10 dark:bg-orlixis-teal/20',
    borderColor: 'border-orlixis-teal/30 dark:border-orlixis-teal/30'
  },
  {
    id: 'COMPREHENSIVE',
    name: 'Full Analysis',
    description: 'Complete security and quality analysis',
    icon: Zap,
    color: 'text-orlixis-teal',
    bgColor: 'bg-orlixis-teal/10 dark:bg-orlixis-teal/20',
    borderColor: 'border-orlixis-teal/30 dark:border-orlixis-teal/30'
  }
]

export function ScanManager({ projectId, className, showHistory = true }: ScanManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentScan, setCurrentScan] = useState<ScanInfo | null>(null)
  const [recentScans, setRecentScans] = useState<ScanInfo[]>([])
  const [selectedScanType, setSelectedScanType] = useState('COMPREHENSIVE')
  const channelRef = useRef<BroadcastChannel | null>(null)

  const fetchScans = async () => {
    try {
      const response = await fetch(`/api/scans?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        const scans = data.scans || []

        // Find current running scan
        const running = scans.find((s: any) => s.status === 'RUNNING' || s.status === 'PENDING')
        setCurrentScan(running || null)

        // Set recent scans (excluding current running)
        setRecentScans(scans.filter((s: any) => s.status !== 'RUNNING' && s.status !== 'PENDING').slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching scans:', error)
    }
  }

  const startScan = async (scanType: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          type: scanType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start scan')
      }

      toast.success('Analysis started successfully')
      setCurrentScan({
        id: 'pending',
        type: scanType,
        status: 'PENDING',
        progress: 0,
        startedAt: new Date().toISOString()
      })
      channelRef.current?.postMessage({ projectId, type: 'scan-status', status: 'RUNNING' })
      fetchScans()
    } catch (error) {
      console.error('Error starting scan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const cancelScan = async () => {
    if (!currentScan) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/scans/${currentScan.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Analysis cancelled')
        setCurrentScan(null)
        channelRef.current?.postMessage({ projectId, type: 'scan-status', status: 'IDLE' })
        fetchScans()
      }
    } catch (error) {
      console.error('Error cancelling scan:', error)
      toast.error('Failed to cancel analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-orlixis-teal" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-orlixis-teal animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success' as const
      case 'failed':
        return 'destructive' as const
      case 'running':
        return 'warning' as const
      default:
        return 'secondary' as const
    }
  }

  useEffect(() => {
    fetchScans()

    // Setup BroadcastChannel to sync scan status across components
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const ch = new BroadcastChannel('orlixis-scan-sync')
      channelRef.current = ch

      const onMessage = (ev: MessageEvent) => {
        const msg = ev.data as { projectId: string; type: string; status?: string }
        if (msg && msg.projectId === projectId && msg.type === 'scan-status') {
          fetchScans()
        }
      }

      ch.addEventListener('message', onMessage)

      // Cleanup listener/channel on unmount
      var cleanup = () => {
        ch.removeEventListener('message', onMessage)
        ch.close()
        channelRef.current = null
      }
    }

    // Always poll to catch external triggers (AnalysisDropdown, other tabs)
    const interval = setInterval(fetchScans, 2000)

    return () => {
      clearInterval(interval)
      if (typeof cleanup === 'function') cleanup()
    }
  }, [projectId])

  const selectedType = scanTypes.find(t => t.id === selectedScanType)
  const isScanning = currentScan?.status === 'RUNNING' || currentScan?.status === 'PENDING'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orlixis-teal" />
          Analysis Manager
        </CardTitle>
        <CardDescription>
          Run security and quality analysis on your project
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Scan Status */}
        {currentScan && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(currentScan.status)}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {currentScan.type} Analysis
                  </span>
                </div>
                <Badge variant={getStatusBadgeVariant(currentScan.status)}>
                  {currentScan.status}
                </Badge>
              </div>

              {isScanning && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelScan}
                  disabled={isLoading}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/50"
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>

            {currentScan.status === 'RUNNING' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Progress</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {currentScan.progress}%
                  </span>
                </div>
                <Progress
                  value={currentScan.progress}
                  className="h-2"
                  variant="orlixis"
                />
              </div>
            )}

            {currentScan.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950/50 dark:border-red-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-300">{currentScan.error}</span>
                </div>
              </div>
            )}

            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Started {new Date(currentScan.startedAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Scan Type Selection */}
        {!isScanning && (
          <div className="space-y-4">
            {showHistory ? (
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  Select Analysis Type
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {scanTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedScanType === type.id
                        ? `${type.bgColor} ${type.borderColor}`
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        } ${isScanning ? 'opacity-60 pointer-events-none' : ''}`}
                      onClick={() => !isScanning && setSelectedScanType(type.id)}
                    >
                      <div className="flex items-start gap-3">
                        <type.icon className={`h-5 w-5 ${type.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                              {type.name}
                            </h5>
                            {selectedScanType === type.id && (
                              <CheckCircle2 className="h-4 w-4 text-orlixis-teal" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <select
                  value={selectedScanType}
                  onChange={(e) => setSelectedScanType(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {scanTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              onClick={() => startScan(selectedScanType)}
              disabled={isLoading || isScanning}
              className="w-full bg-orlixis-teal hover:bg-orlixis-teal-dark disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start {selectedType?.name}
            </Button>
          </div>
        )}

        {/* Recent Scans */}
        {showHistory && recentScans.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Recent Analysis
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchScans}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-2">
                {recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStatusIcon(scan.status)}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {scan.type} Analysis
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(scan.startedAt).toLocaleDateString()} •
                          {scan.vulnerabilityCount ? ` ${scan.vulnerabilityCount} issues` : ' No issues'}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={getStatusBadgeVariant(scan.status)}
                      className="text-xs"
                    >
                      {scan.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
