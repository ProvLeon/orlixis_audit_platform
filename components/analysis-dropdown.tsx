"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  Play,
  StopCircle,
  Loader2,
  Shield,
  Code,
  TrendingUp,
  Package,
  Zap,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"

interface AnalysisDropdownProps {
  projectId: string
  className?: string
}

interface CurrentScan {
  id: string
  type: string
  status: string
  progress: number
  startedAt: string
}

const scanTypes = [
  {
    id: 'SECURITY',
    name: 'Security Analysis',
    description: 'Scan for vulnerabilities and security issues',
    icon: Shield,
    color: 'text-orlixis-teal',
    bgColor: 'bg-orlixis-teal/10',
    borderColor: 'border-orlixis-teal/30'
  },
  {
    id: 'QUALITY',
    name: 'Code Quality',
    description: 'Analyze code quality and best practices',
    icon: Code,
    color: 'text-orlixis-teal',
    bgColor: 'bg-orlixis-teal/10',
    borderColor: 'border-orlixis-teal/30'
  },
  {
    id: 'PERFORMANCE',
    name: 'Performance',
    description: 'Check for performance bottlenecks',
    icon: TrendingUp,
    color: 'text-orlixis-teal',
    bgColor: 'bg-orlixis-teal/10',
    borderColor: 'border-orlixis-teal/30'
  },
  {
    id: 'DEPENDENCY',
    name: 'Dependencies',
    description: 'Analyze dependencies and licenses',
    icon: Package,
    color: 'text-orlixis-teal',
    bgColor: 'bg-orlixis-teal/10',
    borderColor: 'border-orlixis-teal/30'
  },
  {
    id: 'COMPREHENSIVE',
    name: 'Full Analysis',
    description: 'Complete security and quality analysis',
    icon: Zap,
    color: 'text-orlixis-teal',
    bgColor: 'bg-orlixis-teal/10',
    borderColor: 'border-orlixis-teal/30'
  }
]

export function AnalysisDropdown({ projectId, className }: AnalysisDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentScan, setCurrentScan] = useState<CurrentScan | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)

  const fetchCurrentScan = async () => {
    try {
      const response = await fetch(`/api/scans?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        const scans = data.scans || []
        const running = scans.find((s: any) => s.status === 'RUNNING' || s.status === 'PENDING')
        setCurrentScan(running || null)
      }
    } catch (error) {
      console.error('Error fetching current scan:', error)
    }
  }

  const startAnalysis = async (scanType: string) => {
    setIsLoading(true)
    setIsOpen(false)
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
        throw new Error(errorData.error || 'Failed to start analysis')
      }

      toast.success('Analysis started successfully')
      // Optimistically reflect running state and notify other components
      setCurrentScan({
        id: 'pending',
        type: scanType,
        status: 'PENDING',
        progress: 0,
        startedAt: new Date().toISOString()
      })
      channelRef.current?.postMessage({ projectId, type: 'scan-status', status: 'RUNNING' })
      fetchCurrentScan()
    } catch (error) {
      console.error('Error starting analysis:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const cancelAnalysis = async () => {
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
        fetchCurrentScan()
      }
    } catch (error) {
      console.error('Error cancelling analysis:', error)
      toast.error('Failed to cancel analysis')
    } finally {
      setIsLoading(false)
    }
  }

  // Setup BroadcastChannel to sync scan status across components
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return
    const ch = new BroadcastChannel('orlixis-scan-sync')
    channelRef.current = ch

    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data as { projectId: string; type: string; status?: string }
      if (!msg || msg.projectId !== projectId) return
      if (msg.type === 'scan-status') {
        // Refresh to reflect latest server state (avoids stale UI)
        fetchCurrentScan()
      }
    }

    ch.addEventListener('message', onMessage)
    return () => {
      ch.removeEventListener('message', onMessage)
      ch.close()
      channelRef.current = null
    }
  }, [projectId])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    fetchCurrentScan()
    // Always poll to catch external triggers (e.g., ScanManager)
    const interval = setInterval(fetchCurrentScan, 2000)
    return () => clearInterval(interval)
  }, [projectId])

  // If there's a running scan, show progress
  if (currentScan && (currentScan.status === 'RUNNING' || currentScan.status === 'PENDING')) {
    return (
      <div className={`flex items-center gap-3 ${className} rounded pr-2`}>
        <div className="flex items-center gap-2 px-3 py-2 bg-orlixis-teal/10 dark:bg-orlixis-teal/20 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-orlixis-teal" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-white">
              {currentScan.type} Running
            </div>
            <div className="w-24">
              <Progress value={currentScan.progress} variant="white" className="h-1" />
            </div>
          </div>
          <Badge variant="secondary" className="text-xs bg-orlixis-teal/10 border border-orlixis-teal/30 text-white">
            {currentScan.progress}%
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={cancelAnalysis}
          disabled={isLoading || !!(currentScan && (currentScan.status === 'RUNNING' || currentScan.status === 'PENDING'))}
          className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/50 cursor-pointer"
        >
          <StopCircle className="h-4 w-4 cursor-pointer text-red-900" />
        </Button>
      </div>
    )
  }

  // Normal state - show dropdown to start analysis
  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="default"
        className={`gap-2 bg-orlixis-teal hover:bg-orlixis-teal-dark text-white [&_svg]:text-white ${className}`}
        disabled={isLoading}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Activity className="h-4 w-4" />
        )}
        Run Analysis
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Select Analysis Type
              </h3>
            </div>

            <div className="p-2 max-h-96 overflow-y-auto">
              {scanTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => startAnalysis(type.id)}
                  disabled={!!(currentScan && (currentScan.status === 'RUNNING' || currentScan.status === 'PENDING')) || isLoading}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className={`p-2 rounded-md ${type.bgColor} dark:bg-slate-800 ${type.borderColor} dark:border-slate-600 border flex-shrink-0`}>
                    <type.icon className={`h-4 w-4 ${type.color} dark:text-slate-300`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      {type.name}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {type.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
