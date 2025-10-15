"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { PageLayout } from "@/components/layout/authenticated-layout"
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils"
import {
  Play,
  Brain,
  Shield,
  BarChart3,
  Star,
  Zap,
  Settings,
  Target,
  Sparkles,
  Bot,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  ArrowLeft,
  Download,
  Eye,
  Code,
  Database,
  Globe,
  Activity,
  TrendingUp,
  Users,
  Lock,
  Layers,
  Cpu,
  HardDrive,
  GitBranch,
  Calendar,
  BarChart,
  PieChart,
  LineChart
} from "lucide-react"

interface AnalysisClientProps {
  project: {
    id: string
    name: string
    description?: string
    status: string
    language: string[]
    framework: string[]
    repositoryUrl?: string
    branch?: string
    size?: bigint
    createdAt: Date
    updatedAt: Date
    _count: {
      files: number
      reports: number
      scans: number
      vulnerabilities: number
    }
  }
  recentScans: Array<{
    id: string
    type: string
    status: string
    progress: number
    startedAt: Date
    completedAt?: Date
    error?: string
    results?: any
  }>
  recentReports: Array<{
    id: string
    name: string
    type: string
    status: string
    createdAt: Date
    pdfUrl?: string
  }>
  projectFiles: Array<{
    id: string
    filename: string
    path: string
    language?: string
    size: number
  }>
  techStack: {
    languages: string[]
    frameworks: string[]
    totalFiles: number
    codebaseSize: number
  }
  vulnerabilityStats: Record<string, number>
  userId: string
}

interface ScanProgress {
  scanId: string
  type: string
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED"
  progress: number
  startTime: Date
  error?: string
  statusMessage?: string
}

const analysisTypes = [
  {
    id: "security",
    label: "Security Audit",
    description: "Comprehensive security vulnerability analysis",
    icon: Shield,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    duration: "15-25 minutes",
    features: ["Vulnerability Detection", "Auth Analysis", "Data Security", "OWASP Compliance"]
  },
  {
    id: "quality",
    label: "Code Quality",
    description: "Code quality, maintainability, and best practices analysis",
    icon: Star,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    duration: "10-20 minutes",
    features: ["Code Standards", "Complexity Analysis", "Test Coverage", "Documentation"]
  },
  {
    id: "performance",
    label: "Performance Analysis",
    description: "Performance bottlenecks and optimization opportunities",
    icon: BarChart3,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    duration: "12-18 minutes",
    features: ["Bundle Analysis", "Query Optimization", "Memory Usage", "Load Times"]
  },
  {
    id: "comprehensive",
    label: "Comprehensive Audit",
    description: "Complete codebase analysis covering all aspects",
    icon: FileText,
    color: "text-orlixis-teal",
    bgColor: "bg-orlixis-teal/5",
    borderColor: "border-orlixis-teal/20",
    duration: "25-40 minutes",
    features: ["Security", "Quality", "Performance", "Architecture", "Dependencies"]
  }
]

const scanDepthOptions = [
  { value: "surface", label: "Surface Level", description: "Quick scan of main files" },
  { value: "standard", label: "Standard", description: "Comprehensive analysis of codebase" },
  { value: "deep", label: "Deep Analysis", description: "Thorough examination including dependencies" }
]

const dependencyOptions = [
  { value: "none", label: "No Dependencies", description: "Skip dependency analysis" },
  { value: "critical", label: "Critical Only", description: "Analyze critical security dependencies" },
  { value: "all", label: "All Dependencies", description: "Full dependency audit" }
]

export function AnalysisClient({
  project,
  recentScans,
  recentReports,
  projectFiles,
  techStack,
  vulnerabilityStats,
  userId
}: AnalysisClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeScans, setActiveScans] = useState<ScanProgress[]>([])
  const [customPrompt, setCustomPrompt] = useState("")
  const [selectedAnalysisType, setSelectedAnalysisType] = useState("comprehensive")
  const [scanDepth, setScanDepth] = useState("standard")
  const [includeDependencies, setIncludeDependencies] = useState("critical")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Format codebase size
  const formatSize = (size: number) => {
    if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)}MB`
    if (size > 1024) return `${(size / 1024).toFixed(1)}KB`
    return `${size}B`
  }

  // Poll for scan progress
  const pollScanProgress = async (scanId: string, type: string) => {
    console.log(`🚀 Starting progress polling for scan: ${scanId}`)
    const pollInterval = setInterval(async () => {
      try {
        console.log(`🔍 [${new Date().toLocaleTimeString()}] Polling scan progress for: ${scanId}`)
        const response = await fetch(`/api/scans/${scanId}`)
        if (response.ok) {
          const result = await response.json()
          console.log(`📊 Full API response:`, result)
          const scanData = result.scan
          console.log(`📈 Extracted scan data - Progress: ${scanData.progress}%, Status: ${scanData.status}, Error: ${scanData.error}`)

          setActiveScans(prev => {
            const updated = prev.map(scan => {
              if (scan.scanId === scanId) {
                const newScan = {
                  ...scan,
                  status: scanData.status,
                  progress: scanData.progress || 0,
                  error: scanData.error,
                  statusMessage: scanData.error && scanData.status === "RUNNING" ? scanData.error : undefined
                }
                console.log(`🔄 Updating scan state:`, { old: scan, new: newScan })
                return newScan
              }
              return scan
            })
            return updated
          })

          if (scanData.status === "COMPLETED" || scanData.status === "FAILED") {
            console.log(`✅ Scan ${scanId} finished with status: ${scanData.status}`)
            clearInterval(pollInterval)
            setIsAnalyzing(false)

            if (scanData.status === "COMPLETED") {
              toast({
                title: "Analysis Complete",
                description: `${type} analysis finished successfully. Generating report...`,
              })

              // Remove from active scans after showing completion
              setTimeout(() => {
                setActiveScans(prev => prev.filter(s => s.scanId !== scanId))
                router.refresh()
              }, 3000)
            } else {
              toast({
                title: "Analysis Failed",
                description: scanData.error || "Analysis encountered an error",
                variant: "destructive"
              })

              // Remove failed scan from active list after delay
              setTimeout(() => {
                setActiveScans(prev => prev.filter(s => s.scanId !== scanId))
              }, 5000)
            }
          }
        } else {
          console.error(`❌ Failed to fetch scan data: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.error("❌ Error during polling:", error)
        clearInterval(pollInterval)
        setIsAnalyzing(false)
      }
    }, 500)

    // Clean up after 30 minutes
    setTimeout(() => {
      console.log(`⏰ Cleaning up polling for scan: ${scanId} after 30 minutes`)
      clearInterval(pollInterval)
    }, 30 * 60 * 1000)

    return pollInterval
  }

  const startAnalysis = async (type: string, isCustom = false) => {
    setIsAnalyzing(true)

    try {
      const analysisData = {
        projectId: project.id,
        type: type.toUpperCase(),
        depth: scanDepth,
        includeDependencies,
        customPrompt: isCustom ? customPrompt.trim() : undefined,
        userId
      }

      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(analysisData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to start analysis")
      }

      const result = await response.json()

      toast({
        title: "Analysis Started",
        description: `AI-powered ${type} analysis has been initiated for ${project.name}`,
      })

      // Add to active scans
      const newScan: ScanProgress = {
        scanId: result.scanId,
        type,
        status: "RUNNING",
        progress: 0,
        startTime: new Date(),
        statusMessage: "Initializing analysis..."
      }

      console.log(`🎯 Created new scan:`, newScan)
      setActiveScans(prev => {
        const updated = [...prev, newScan]
        console.log(`📝 Updated active scans:`, updated)
        return updated
      })

      // Start polling for progress
      console.log(`🔄 Starting polling for scan: ${result.scanId}`)
      pollScanProgress(result.scanId, type)

    } catch (error) {
      setIsAnalyzing(false)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive"
      })
    }
  }

  const startCustomAnalysis = () => {
    if (!customPrompt.trim()) {
      toast({
        title: "Custom Prompt Required",
        description: "Please provide a custom analysis prompt",
        variant: "destructive"
      })
      return
    }
    startAnalysis("custom", true)
  }

  const basePath = `/projects/${project.id}`

  return (
    <PageLayout
      title="AI-Powered Codebase Analysis"
      description="Comprehensive automated analysis using advanced AI to identify security vulnerabilities, code quality issues, and performance bottlenecks"
      titleClassName="bg-gradient-to-r from-orlixis-teal to-orlixis-teal-light bg-clip-text text-transparent"
      breadcrumbItems={[
        { label: "Projects", href: "/projects" },
        { label: project.name, href: basePath },
        { label: "Analysis", href: `${basePath}/analysis`, isCurrentPage: true }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={basePath}>
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href={`${basePath}/reports`}>
              <FileText className="h-4 w-4" />
              View Reports
            </Link>
          </Button>
        </div>
      }
      headerExtras={
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="secondary" className="capitalize">
              <Code className="h-3.5 w-3.5 mr-1" />
              {techStack.languages.join(", ") || "Mixed"}
            </Badge>
            <Badge variant="outline">
              <HardDrive className="h-3.5 w-3.5 mr-1" />
              {formatSize(techStack.codebaseSize)} codebase
            </Badge>
            <Badge variant="outline">
              <FileText className="h-3.5 w-3.5 mr-1" />
              {techStack.totalFiles} files
            </Badge>
            <Badge variant="outline">
              <BarChart className="h-3.5 w-3.5 mr-1" />
              {project._count.vulnerabilities} known issues
            </Badge>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-orlixis-teal via-orlixis-teal/70 to-orlixis-teal-light" />
        </div>
      }
    >
      <div className="space-y-8">
        {/* Active Scans */}
        {activeScans.length > 0 && (
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Active Analysis
              </CardTitle>
              <CardDescription>Real-time progress of running analyses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeScans.map((scan) => (
                <div key={scan.scanId} className="p-4 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium capitalize">{scan.type} Analysis</div>
                    <Badge variant={scan.status === "RUNNING" ? "default" : scan.status === "COMPLETED" ? "success" : "destructive"}>
                      {scan.status === "RUNNING" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {scan.status === "COMPLETED" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {scan.status === "FAILED" && <XCircle className="h-3 w-3 mr-1" />}
                      {scan.status}
                    </Badge>
                  </div>
                  <Progress value={scan.progress} className="mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {scan.statusMessage || `Started ${formatRelativeTime(scan.startTime.toISOString())}`}
                    </div>
                    <div className="text-sm font-semibold text-orlixis-teal">
                      {scan.progress}%
                    </div>
                  </div>
                  {scan.status === "COMPLETED" && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Analysis complete! Redirecting to results...
                    </div>
                  )}
                  {scan.status === "FAILED" && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      ✗ Analysis failed: {scan.error || "Unknown error"}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Analysis Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analysisTypes.map((analysis) => {
            const Icon = analysis.icon
            const isSelected = selectedAnalysisType === analysis.id

            return (
              <Card
                key={analysis.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-lg",
                  "border-2",
                  isSelected
                    ? cn("shadow-lg", analysis.borderColor, analysis.bgColor)
                    : "border-slate-200 dark:border-slate-700 hover:border-orlixis-teal/30"
                )}
                onClick={() => setSelectedAnalysisType(analysis.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", analysis.bgColor)}>
                        <Icon className={cn("h-6 w-6", analysis.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{analysis.label}</CardTitle>
                        <CardDescription className="mt-1">{analysis.description}</CardDescription>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-orlixis-teal" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="h-4 w-4" />
                      Est. {analysis.duration}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {analysis.features.map((feature) => (
                        <Badge key={feature} variant="outline" size="sm">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        startAnalysis(analysis.id)
                      }}
                      disabled={isAnalyzing}
                      className={cn(
                        "w-full gap-2",
                        isSelected
                          ? "bg-orlixis-teal hover:bg-orlixis-teal-dark"
                          : ""
                      )}
                      variant={isSelected ? "default" : "outline"}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Start {analysis.label}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Advanced Configuration */}
        <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orlixis-teal" />
                  Advanced Configuration
                </CardTitle>
                <CardDescription>Fine-tune analysis parameters for better results</CardDescription>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                {showAdvanced ? "Hide" : "Show"} Advanced
              </Button>
            </div>
          </CardHeader>
          {showAdvanced && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Analysis Depth</label>
                  <Select value={scanDepth} onValueChange={setScanDepth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scanDepthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-slate-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Dependency Analysis</label>
                  <Select value={includeDependencies} onValueChange={setIncludeDependencies}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dependencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-slate-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Custom AI Analysis */}
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/10 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Custom AI Analysis
            </CardTitle>
            <CardDescription>
              Describe specific analysis requirements for AI-powered custom insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="E.g., 'Focus on React performance patterns and state management issues' or 'Check for specific security vulnerabilities in authentication flows'"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              onClick={startCustomAnalysis}
              disabled={isAnalyzing || !customPrompt.trim()}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Start Custom Analysis
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Analysis Results */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-orlixis-teal" />
                  Recent Analysis History
                </CardTitle>
                <CardDescription>Latest scans and their results</CardDescription>
              </CardHeader>
              <CardContent>
                {recentScans.length > 0 ? (
                  <div className="space-y-3">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/30">
                        <div className="flex items-center gap-3">
                          <Badge variant={scan.status === "COMPLETED" ? "success" : scan.status === "FAILED" ? "destructive" : "secondary"}>
                            {scan.status}
                          </Badge>
                          <div>
                            <div className="font-medium capitalize">{scan.type.toLowerCase()} Analysis</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {formatRelativeTime(scan.startedAt.toISOString())}
                            </div>
                          </div>
                        </div>
                        {scan.status === "COMPLETED" && (
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No analysis history yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Start your first analysis to see results here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Reports */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orlixis-teal" />
                  Generated Reports
                </CardTitle>
                <CardDescription>Professional audit reports from completed analyses</CardDescription>
              </CardHeader>
              <CardContent>
                {recentReports.length > 0 ? (
                  <div className="space-y-3">
                    {recentReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/30">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize">
                            {report.type.toLowerCase()}
                          </Badge>
                          <div>
                            <div className="font-medium">{report.name}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {formatRelativeTime(report.createdAt.toISOString())}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline" size="sm" className="gap-1">
                            <Link href={`${basePath}/reports/${report.id}`}>
                              <Eye className="h-3 w-3" />
                              View
                            </Link>
                          </Button>
                          {report.pdfUrl && (
                            <Button asChild variant="outline" size="sm" className="gap-1">
                              <Link href={report.pdfUrl} target="_blank" rel="noreferrer">
                                <Download className="h-3 w-3" />
                                PDF
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No reports generated yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Complete an analysis to generate professional reports</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Overview Sidebar */}
          <div className="space-y-6">
            {/* Project Stats */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orlixis-teal" />
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Files</span>
                    <span className="font-medium">{techStack.totalFiles}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Codebase Size</span>
                    <span className="font-medium">{formatSize(techStack.codebaseSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Reports</span>
                    <span className="font-medium">{project._count.reports}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Scans</span>
                    <span className="font-medium">{project._count.scans}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Known Issues</span>
                    <span className="font-medium">{project._count.vulnerabilities}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-medium">Technology Stack</div>
                  <div className="flex flex-wrap gap-1">
                    {techStack.languages.map((lang) => (
                      <Badge key={lang} variant="outline" size="sm">
                        {lang}
                      </Badge>
                    ))}
                    {techStack.frameworks.map((framework) => (
                      <Badge key={framework} variant="outline" size="sm">
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orlixis-teal" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <Link href={`${basePath}/files`}>
                    <Code className="h-4 w-4" />
                    Browse Files
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <Link href={`${basePath}/reports`}>
                    <FileText className="h-4 w-4" />
                    View All Reports
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <Link href={basePath}>
                    <TrendingUp className="h-4 w-4" />
                    Project Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
