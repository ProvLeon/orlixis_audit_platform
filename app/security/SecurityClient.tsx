"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Download,
  FolderOpen,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn, formatRelativeTime } from "@/lib/utils"
import { computeScoreAndRisk } from "@/lib/reportTheme"

type ProjectOption = { id: string; name: string }

type ScanListItem = {
  id: string
  type: string
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED"
  progress?: number | null
  startedAt?: string | Date | null
  completedAt?: string | Date | null
  error?: string | null
  project: { id: string; name: string; status: string }
  vulnerabilityCount?: number
}

type ScanSummary = {
  scan: {
    id: string
    type: string
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED"
    progress: number
    startedAt: string | Date | null
    completedAt: string | Date | null
    error: string | null
    estimatedCompletion: string | Date | null
    project: { id: string; name: string; status: string }
  }
  // Summary counts only (no detailed list in current API)
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
  config: Record<string, unknown>
}

type Severity = "ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"
type VStatus = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "FALSE_POSITIVE" | "WONT_FIX"

export interface SecurityClientProps {
  projects: ProjectOption[]
  initialProjectId?: string
  className?: string
}

/**
 * SecurityClient
 * - Project selector
 * - Start/cancel scan actions
 * - Fetches scans list for selected project
 * - Fetches selected scan summary
 * - Filters, search, and export for summary
 */
export default function SecurityClient({
  projects,
  initialProjectId,
  className,
}: SecurityClientProps) {

  const [projectId, setProjectId] = useState<string>(() => initialProjectId || projects[0]?.id || "")
  const [scans, setScans] = useState<ScanListItem[]>([])
  const [scansLoading, setScansLoading] = useState(false)
  const [scansError, setScansError] = useState<string | null>(null)

  const [selectedScanId, setSelectedScanId] = useState<string | null>(null)
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const [severityFilter, setSeverityFilter] = useState<Severity>("ALL")
  const [statusFilter, setStatusFilter] = useState<VStatus>("ALL")
  const [search, setSearch] = useState("")
  const [startingScan, setStartingScan] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Derived
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) || null,
    [projectId, projects]
  )

  const scanIsActive = (status?: string) => status === "RUNNING" || status === "PENDING"

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => stopPolling, [])

  const startPolling = useCallback((scanId: string) => {
    stopPolling()
    pollRef.current = setInterval(() => {
      fetch(`/api/scans/${encodeURIComponent(scanId)}`)
        .then(res => res.json())
        .then((data: ScanSummary) => {
          setScanSummary(data)
          if (data?.scan?.status !== "RUNNING" && data?.scan?.status !== "PENDING") {
            stopPolling()
          }
        })
        .catch(console.error)
    }, 4000)
  }, [])

  // Initial + when project changes
  useEffect(() => {

    if (!projectId) return

    setScansLoading(true)
    setScansError(null)
    setScanSummary(null)
    setSelectedScanId(null)
    stopPolling()

    fetch(`/api/scans?projectId=${encodeURIComponent(projectId)}`)
      .then(res => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then(data => {
            throw new Error((data as { error?: string })?.error || "Failed to fetch scans")
          })
        }
        return res.json()
      })
      .then((data: { scans: ScanListItem[] }) => {
        setScans(data.scans || [])
        // Auto-select most recent scan if none selected and scans exist
        if ((data.scans || []).length > 0) {
          setSelectedScanId(data.scans[0].id)
        }
        setScansLoading(false)
      })
      .catch((err: unknown) => {
        setScansError(err instanceof Error ? err.message : String(err))
        setScansLoading(false)
      })
  }, [projectId])

  // When selected scan changes, fetch summary
  useEffect(() => {

    if (!selectedScanId) {
      setScanSummary(null)
      stopPolling()
      return
    }

    setSummaryLoading(true)
    fetch(`/api/scans/${encodeURIComponent(selectedScanId)}`)
      .then(res => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then(data => {
            throw new Error((data as { error?: string })?.error || "Failed to fetch scan details")
          })
        }
        return res.json()
      })
      .then((data: ScanSummary) => {
        setScanSummary(data)
        // If scan still running, keep polling
        if (data?.scan?.status === "RUNNING" || data?.scan?.status === "PENDING") {
          startPolling(selectedScanId)
        } else {
          stopPolling()
        }
        setSummaryLoading(false)
      })
      .catch(err => {
        console.error(err)
        setSummaryLoading(false)
      })
  }, [selectedScanId, startPolling])

  async function handleStartScan() {
    if (!projectId) return
    setStartingScan(true)
    try {
      const res = await fetch(`/api/scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type: "COMPREHENSIVE" }),
      })
      const data = (await res.json()) as { error?: string; scan?: ScanListItem }
      if (!res.ok) {
        throw new Error(data?.error || "Failed to start scan")
      }

      const scan = data.scan as ScanListItem
      // refresh scans, select new one, start polling
      try {
        const res = await fetch(`/api/scans?projectId=${encodeURIComponent(projectId)}`)
        if (res.ok) {
          const scanData = (await res.json()) as { scans: ScanListItem[] }
          setScans(scanData.scans || [])
        }
      } catch (err) {
        console.error("Failed to refresh scans:", err)
      }
      setSelectedScanId(scan.id)
      startPolling(scan.id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("Start scan error:", message)
      alert(message || "Failed to start scan")
    } finally {
      setStartingScan(false)
    }
  }

  async function handleCancelScan(id: string) {
    try {
      const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string })?.error || "Failed to cancel scan")
      }
      stopPolling()
      try {
        const res = await fetch(`/api/scans?projectId=${encodeURIComponent(projectId)}`)
        if (res.ok) {
          const scanData = (await res.json()) as { scans: ScanListItem[] }
          const newScans = scanData.scans || []
          setScans(newScans)
          // If we canceled the currently selected scan, reselect the most recent
          if (selectedScanId === id) {
            const next = newScans.filter((s) => s.id !== id)[0]
            setSelectedScanId(next?.id || null)
          }
        }
      } catch (err) {
        console.error("Failed to refresh scans:", err)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("Cancel scan error:", message)
      alert(message || "Failed to cancel scan")
    }
  }

  const scoreAndRisk = useMemo(() => {
    const v = scanSummary?.vulnerabilities
    if (!v) return { score: 100, risk: "LOW" as const }
    const list = [
      ...Array(v.critical).fill({ severity: "CRITICAL" }),
      ...Array(v.high).fill({ severity: "HIGH" }),
      ...Array(v.medium).fill({ severity: "MEDIUM" }),
      ...Array(v.low).fill({ severity: "LOW" }),
      ...Array(v.info).fill({ severity: "INFO" }),
    ] as Array<{ severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" }>
    return computeScoreAndRisk(list)
  }, [scanSummary])

  // Filtered summary preview text
  const filteredCount = useMemo(() => {
    const v = scanSummary?.vulnerabilities
    if (!v) return 0

    let count = v.total
    if (severityFilter !== "ALL") {
      const key = severityFilter.toLowerCase() as "critical" | "high" | "medium" | "low" | "info"
      count = v[key] || 0
    }
    // statusFilter only affects open/resolved preview in this summary-only UI
    if (statusFilter !== "ALL") {
      if (statusFilter === "RESOLVED") count = v.resolved
      else if (statusFilter === "OPEN") count = v.open
      // IN_PROGRESS, FALSE_POSITIVE, WONT_FIX would need detailed list; unavailable in current API
    }
    if (search.trim()) {
      // Without a detailed list, search can only filter by scan id text match
      const matchId = scanSummary?.scan?.id?.toLowerCase().includes(search.toLowerCase())
      count = matchId ? count : 0
    }
    return count
  }, [scanSummary, severityFilter, statusFilter, search])

  function exportSummaryCSV() {
    const v = scanSummary?.vulnerabilities
    if (!v) return
    const headers = [
      "scan_id",
      "project_id",
      "project_name",
      "status",
      "critical",
      "high",
      "medium",
      "low",
      "info",
      "open",
      "resolved",
      "total",
      "score",
      "risk",
    ]
    const row = [
      scanSummary?.scan?.id,
      scanSummary?.scan?.project?.id,
      scanSummary?.scan?.project?.name,
      scanSummary?.scan?.status,
      v.critical,
      v.high,
      v.medium,
      v.low,
      v.info,
      v.open,
      v.resolved,
      v.total,
      scoreAndRisk.score,
      scoreAndRisk.risk,
    ]
    const csv = `${headers.join(",")}\n${row.join(",")}\n`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `security-summary-${scanSummary?.scan?.id}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const isRunning = scanIsActive(scanSummary?.scan?.status)

  // Show empty state if no projects
  if (projects.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-teal-100 flex items-center justify-center">
                  <Shield className="h-12 w-12 text-teal-600" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  No projects found
                </h3>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  To run security scans, you&apos;ll need to upload a project first.
                  Get started by creating your first project.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <Link href="/projects/upload">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Project
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/projects">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    View Projects
                  </Link>
                </Button>
              </div>

              <div className="pt-6 border-t">
                <div className="text-left space-y-4 max-w-2xl mx-auto">
                  <h4 className="font-medium text-slate-900 dark:text-white">Getting started:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-xs">1</div>
                      <div>
                        <div className="font-medium">Upload your code</div>
                        <div>Upload files or connect a Git repository</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-xs">2</div>
                      <div>
                        <div className="font-medium">Start a security scan</div>
                        <div>Run comprehensive security analysis</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-xs">3</div>
                      <div>
                        <div className="font-medium">Review findings</div>
                        <div>Identify and prioritize vulnerabilities</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-xs">4</div>
                      <div>
                        <div className="font-medium">Generate reports</div>
                        <div>Export professional security reports</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="w-full md:w-64">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger aria-label="Select project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select >
          </div >

          <div className="flex items-center gap-2">
            <Select
              value={severityFilter}
              onValueChange={(v) => setSeverityFilter(v as Severity)}
            >
              <SelectTrigger className="w-36" aria-label="Filter by severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as VStatus)}>
              <SelectTrigger className="w-44" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="FALSE_POSITIVE">False positive</SelectItem>
                <SelectItem value="WONT_FIX">Won&apos;t fix</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scan id..."
              className="pl-8"
            />
          </div>
        </div >

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (!projectId) return

              setScansLoading(true)
              setScansError(null)

              fetch(`/api/scans?projectId=${encodeURIComponent(projectId)}`)
                .then(res => {
                  if (!res.ok) {
                    return res.json().catch(() => ({})).then(data => {
                      throw new Error((data as { error?: string })?.error || "Failed to fetch scans")
                    })
                  }
                  return res.json()
                })
                .then((data: { scans: ScanListItem[] }) => {
                  setScans(data.scans || [])
                  setScansLoading(false)
                })
                .catch(err => {
                  console.error("Failed to refresh scans:", err)
                  setScansError(err instanceof Error ? err.message : String(err))
                  setScansLoading(false)
                })
            }}
            disabled={scansLoading}
            aria-label="Refresh scans"
          >
            <RefreshCw className={cn("h-4 w-4", scansLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            className="gap-2 bg-orlixis-teal hover:bg-orlixis-teal-light"
            onClick={handleStartScan}
            disabled={!projectId || startingScan}
            aria-label="Start a new scan"
          >
            {startingScan ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start scan
              </>
            )}
          </Button>
        </div>
      </div >

      {/* Metrics */}
      < div className="grid grid-cols-1 gap-4 md:grid-cols-4" >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Score</p>
                {summaryLoading ? (
                  <div className="mt-1 animate-pulse">
                    <div className="h-9 w-16 bg-muted rounded"></div>
                    <div className="h-3 w-20 bg-muted rounded mt-1"></div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-3xl font-semibold">
                      {scanSummary ? scoreAndRisk.score : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {scanSummary ? `${scoreAndRisk.risk} risk` : "Run a scan to compute score"}
                    </p>
                  </>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orlixis-teal/10">
                <Shield className="h-6 w-6 text-orlixis-teal" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Issues</p>
                {summaryLoading ? (
                  <div className="mt-1 animate-pulse">
                    <div className="h-9 w-12 bg-muted rounded"></div>
                    <div className="h-3 w-24 bg-muted rounded mt-1"></div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-3xl font-semibold">
                      {scanSummary?.vulnerabilities.total ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Across all severities</p>
                  </>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-900/40">
                <AlertTriangle className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                {summaryLoading ? (
                  <div className="mt-1 animate-pulse">
                    <div className="h-9 w-8 bg-muted rounded"></div>
                    <div className="h-3 w-28 bg-muted rounded mt-1"></div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-3xl font-semibold text-red-600">
                      {scanSummary?.vulnerabilities.critical ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Immediate attention</p>
                  </>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-900/40">
                <AlertCircle className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                {summaryLoading ? (
                  <div className="mt-1 animate-pulse">
                    <div className="h-9 w-8 bg-muted rounded"></div>
                    <div className="h-3 w-28 bg-muted rounded mt-1"></div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-3xl font-semibold text-green-600">
                      {scanSummary?.vulnerabilities.resolved ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Remediated issues</p>
                  </>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orlixis-teal-light/30">
                <CheckCircle className="h-6 w-6 text-orlixis-teal" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div >

      {/* Main grid */}
      < div className="grid grid-cols-1 gap-6 lg:grid-cols-3" >
        {/* Left: Selected scan details */}
        < div className="space-y-6 lg:col-span-2" >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Selected Scan</CardTitle>
                  <CardDescription>
                    {scanSummary?.scan?.id ? (
                      <>
                        {scanSummary.scan.type.toLowerCase()} •{" "}
                        {formatRelativeTime(
                          String(scanSummary.scan.startedAt) || new Date().toISOString()
                        )}
                      </>
                    ) : (
                      "Choose a scan to see details"
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={exportSummaryCSV}
                    disabled={!scanSummary}
                    aria-label="Export summary as CSV"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  {scanSummary?.scan?.id && isRunning && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleCancelScan(scanSummary.scan.id)}
                      aria-label="Cancel scan"
                    >
                      <Pause className="h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!scanSummary && summaryLoading && (
                <div className="space-y-5 animate-pulse">
                  {/* Progress skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-20 bg-muted rounded"></div>
                      <div className="h-4 w-16 bg-muted rounded"></div>
                    </div>
                    <div className="h-4 w-24 bg-muted rounded"></div>
                  </div>
                  <div className="h-2 w-full bg-muted rounded"></div>

                  {/* Severity distribution skeleton */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="text-center">
                        <div className="h-4 w-12 bg-muted rounded mb-1 mx-auto"></div>
                        <div className="h-6 w-8 bg-muted rounded mx-auto"></div>
                      </div>
                    ))}
                  </div>

                  {/* Filtered preview skeleton */}
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 w-20 bg-muted rounded"></div>
                      <div className="h-8 w-12 bg-muted rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-muted rounded"></div>
                      <div className="h-3 w-3/4 bg-muted rounded"></div>
                    </div>
                    <div className="mt-3">
                      <div className="h-9 w-32 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              )}

              {!scanSummary && !summaryLoading && (
                <div className="text-sm text-muted-foreground">
                  No scan selected. Start a scan or choose one from the list.
                </div>
              )}

              {scanSummary && (
                <div className="space-y-5">
                  {/* Progress */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {scanSummary.scan.status.toLowerCase()}
                      </Badge>
                      {isRunning && (
                        <span className="text-xs text-muted-foreground">
                          {scanSummary.scan.progress || 0}% complete
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {scanSummary.scan.estimatedCompletion
                        ? `ETA: ${formatRelativeTime(
                          String(scanSummary.scan.estimatedCompletion) || new Date().toISOString()
                        )}`
                        : null}
                    </div>
                  </div>
                  <Progress
                    value={scanSummary.scan.progress || 0}
                    className="h-2"
                  />

                  {/* Severity distribution (inline) */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    <SeverityStat label="Critical" value={scanSummary.vulnerabilities.critical} color="text-red-600" />
                    <SeverityStat label="High" value={scanSummary.vulnerabilities.high} color="text-orange-600" />
                    <SeverityStat label="Medium" value={scanSummary.vulnerabilities.medium} color="text-yellow-600" />
                    <SeverityStat label="Low" value={scanSummary.vulnerabilities.low} color="text-blue-600" />
                    <SeverityStat label="Info" value={scanSummary.vulnerabilities.info} color="text-slate-600" />
                  </div>

                  {/* Filtered preview */}
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Filtered issues
                      </div>
                      <div className="text-2xl font-semibold">{filteredCount}</div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      This preview is based on summary counts. For full findings with locations and recommendations,
                      open the project analysis.
                    </div>
                    <div className="mt-3">
                      <Button asChild variant="outline" className="gap-2">
                        <Link href={`/projects/${scanSummary.scan.project.id}/analysis`}>
                          <BarChart3 className="h-4 w-4" />
                          View analysis
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div >

        {/* Right: Scans list */}
        < div className="space-y-3 w-auto md:w-full lg:w-[380px] 2xl:w-[480px]" >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Scans</CardTitle>
                  <CardDescription>
                    {selectedProject ? `Project: ${selectedProject.name}` : "Select a project"}
                  </CardDescription>
                </div>
                {scansLoading && (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {scansError && (
                <div className="mb-3 text-sm text-red-600">{scansError}</div>
              )}
              {scans.length === 0 && !scansLoading ? (
                <div className="text-sm text-muted-foreground">No scans yet.</div>
              ) : (
                <div className="space-y-2">
                  {scansLoading && scans.length === 0 && (
                    <>
                      {/* Skeleton loading states */}
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-full rounded-lg border p-3 animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-6 w-20 bg-muted rounded"></div>
                                <div className="h-4 w-16 bg-muted rounded"></div>
                              </div>
                              <div className="h-4 w-32 bg-muted rounded mb-1"></div>
                              <div className="h-3 w-24 bg-muted rounded"></div>
                            </div>
                            <div className="h-4 w-4 bg-muted rounded"></div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {scans
                    .filter((s) =>
                      search.trim()
                        ? s.id.toLowerCase().includes(search.toLowerCase())
                        : true
                    )
                    .map((scan) => {
                      const active = scanIsActive(scan.status)
                      return (
                        <button
                          key={scan.id}
                          onClick={() => setSelectedScanId(scan.id)}
                          className={cn(
                            "w-full text-left rounded-lg border p-3 hover:bg-accent/50 transition-colors",
                            selectedScanId === scan.id && "ring-2 ring-orlixis-teal"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {scan.status.toLowerCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground truncate">
                                  {formatRelativeTime(
                                    String(scan.startedAt) || new Date().toISOString()
                                  )}
                                </span>
                              </div>
                              <div className="mt-1 text-sm font-medium truncate">
                                {scan.type.toLowerCase()} • {scan.project.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Vulnerabilities: {scan.vulnerabilityCount ?? "—"}
                              </div>
                            </div>
                            {active ? (
                              <RefreshCw className="h-4 w-4 text-teal-600 animate-spin" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          {active ? (
                            <div className="mt-2">
                              <Progress
                                value={scan.progress || 0}
                                className="h-1.5"
                              />
                            </div>
                          ) : null}
                        </button>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div >
      </div >
    </div >
  )
}

function SeverityStat({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-semibold", color)}>{value}</div>
    </div>
  )
}
