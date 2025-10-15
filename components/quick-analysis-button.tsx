"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface QuickAnalysisButtonProps {
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
    description: 'Scan for vulnerabilities',
    icon: Shield,
    color: 'text-red-600'
  },
  {
    id: 'QUALITY',
    name: 'Code Quality',
    description: 'Analyze code quality',
    icon: Code,
    color: 'text-blue-600'
  },
  {
    id: 'PERFORMANCE',
    name: 'Performance',
    description: 'Check performance',
    icon: TrendingUp,
    color: 'text-green-600'
  },
  {
    id: 'DEPENDENCY',
    name: 'Dependencies',
    description: 'Analyze dependencies',
    icon: Package,
    color: 'text-purple-600'
  },
  {
    id: 'COMPREHENSIVE',
    name: 'Full Analysis',
    description: 'Complete analysis',
    icon: Zap,
    color: 'text-orange-600'
  }
]

export function QuickAnalysisButton({ projectId, className }: QuickAnalysisButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentScan, setCurrentScan] = useState<CurrentScan | null>(null)

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
        fetchCurrentScan()
      }
    } catch (error) {
      console.error('Error cancelling analysis:', error)
      toast.error('Failed to cancel analysis')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentScan()

    // Auto-refresh when there's a running scan
    const interval = currentScan ? setInterval(fetchCurrentScan, 3000) : null

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [projectId, currentScan?.id])

  // If there's a running scan, show progress
  if (currentScan && (currentScan.status === 'RUNNING' || currentScan.status === 'PENDING')) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {currentScan.type} Running
            </div>
            <div className="w-24">
              <Progress value={currentScan.progress} className="h-1" />
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {currentScan.progress}%
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={cancelAnalysis}
          disabled={isLoading}
          className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/50"
        >
          <StopCircle className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Normal state - show dropdown to start analysis
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          className={`gap-2 bg-blue-600 hover:bg-blue-700 ${className}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          Run Analysis
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-none"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          Select Analysis Type
        </DropdownMenuLabel>
        <div className="p-1"></div>

        {scanTypes.map((type) => (
          <DropdownMenuItem
            key={type.id}
            onClick={() => startAnalysis(type.id)}
            className="flex items-start gap-3 p-3 m-1 rounded-md cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <type.icon className={`h-4 w-4 ${type.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{type.name}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">{type.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
