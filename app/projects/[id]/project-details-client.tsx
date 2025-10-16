"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLayout } from "@/components/layout/authenticated-layout"
import { LanguageIcon } from "@/components/ui/language-icon"
import { ScanManager } from "@/components/scan-manager"
import { AnalysisDropdown } from "@/components/analysis-dropdown"
import { FetchGitHubFilesButton } from "@/components/fetch-github-files-button"
import {
  Activity,
  AlertTriangle,
  Clock,
  ClipboardList,
  ExternalLink,
  FileCode,
  FileText,
  FolderOpenDot,
  GitBranch,
  Globe,
  Layers,
  Shield,
  Zap,
  Database,
  Eye,
  Download,
  Search,
  BarChart3,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Brain,
  Sparkles,
  ArrowRight
} from "lucide-react"
import { VulnerabilitySeverity } from "@prisma/client"
import { cn, formatBytes, formatDateTime, formatRelativeTime } from "@/lib/utils"

// Strict Orlixis teal branding – dynamic brand helpers removed

function statusBadgeVariant(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return "success"
    case "completed":
      return "success"
    case "pending":
      return "warning"
    case "failed":
      return "destructive"
    case "inactive":
      return "secondary"
    default:
      return "secondary"
  }
}

function severityBadgeVariant(severity: VulnerabilitySeverity) {
  switch (severity) {
    case "CRITICAL":
      return "destructive"
    case "HIGH":
      return "destructive"
    case "MEDIUM":
      return "warning"
    case "LOW":
      return "secondary"
    default:
      return "secondary"
  }
}

interface Report {
  id: string
  title: string | null
  summary: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  projectId: string
  scanId: string | null
}

interface Scan {
  id: string
  status: string
  startedAt: Date
  completedAt: Date | null
  projectId: string
}

interface FileItem {
  id: string
  filename: string
  path: string | null
  language: string | null
  size: number
  createdAt: Date
  updatedAt: Date
  projectId: string
}

interface VulnBySeverity {
  [key: string]: number
}

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  language: string[]
  framework: string[]
  primaryColor?: string | null
  repositoryUrl: string | null
  branch: string | null
  size: bigint | null
  createdAt: Date
  updatedAt: Date
  userId: string
}

interface ProjectDetailsClientProps {
  project: Project
  reports: Report[]
  scans: Scan[]
  files: FileItem[]
  filesCount: number
  reportsCount: number
  scansCount: number
  vulnBySeverity: VulnBySeverity
}

export function ProjectDetailsClient({
  project,
  reports,
  scans: initialScans,
  files,
  filesCount,
  reportsCount,
  scansCount,
  vulnBySeverity
}: ProjectDetailsClientProps) {
  const [currentScans, setCurrentScans] = useState<Scan[]>([])

  useEffect(() => {
    // Check for running scans and poll their progress
    const runningScans = initialScans.filter((scan: Scan) =>
      scan.status === "RUNNING" || scan.status === "PENDING"
    )

    if (runningScans.length > 0) {
      const pollInterval = setInterval(async () => {
        try {
          const scanPromises = runningScans.map(async (scan: Scan) => {
            const response = await fetch(`/api/scans/${scan.id}`)
            if (response.ok) {
              const data = await response.json()
              return data.scan
            }
            return scan
          })

          const updatedScans = await Promise.all(scanPromises)
          setCurrentScans(updatedScans)

          // Check if all scans are completed
          const stillRunning = updatedScans.some((scan: Scan) =>
            scan.status === "RUNNING" || scan.status === "PENDING"
          )

          if (!stillRunning) {
            clearInterval(pollInterval)
            // Refresh the page to get updated data
            window.location.reload()
          }
        } catch (error) {
          console.error("Failed to poll scan progress:", error)
        }
      }, 2000)

      return () => clearInterval(pollInterval)
    }
  }, [initialScans])

  const displayScans = currentScans.length > 0 ? currentScans : initialScans

  const primaryLang = project.language?.[0] ?? "code"
  const languages = Array.isArray(project.language) ? project.language : []
  const frameworks = Array.isArray(project.framework) ? project.framework : []
  const repoHost = (() => {
    try {
      return project.repositoryUrl ? new URL(project.repositoryUrl).host : null
    } catch {
      return null
    }
  })()

  const sizeNumber = typeof project.size === "bigint" ? Number(project.size) : (project.size as unknown as number) ?? 0

  // Using global Orlixis teal from CSS variables; dynamic brand mapping removed

  // Calculate vulnerability metrics
  const totalVulns = Object.values(vulnBySeverity).reduce((sum, count) => sum + count, 0)
  const criticalCount = vulnBySeverity.CRITICAL || 0
  const highCount = vulnBySeverity.HIGH || 0
  const mediumCount = vulnBySeverity.MEDIUM || 0
  const lowCount = vulnBySeverity.LOW || 0

  // Get security status
  const getSecurityStatus = () => {
    if (criticalCount > 0) return { status: "critical", icon: XCircle, color: "text-red-500" }
    if (highCount > 0) return { status: "high-risk", icon: AlertCircle, color: "text-orange-500" }
    if (mediumCount > 0) return { status: "moderate", icon: AlertTriangle, color: "text-yellow-500" }
    if (lowCount > 0) return { status: "low-risk", icon: Info, color: "text-orlixis-teal" }
    return { status: "secure", icon: CheckCircle2, color: "text-orlixis-teal" }
  }

  const securityStatus = getSecurityStatus()

  return (
    <div className="min-h-screen bg-gradient-orlixis-subtle">
      <PageLayout
        title={project.name}
        description={project.description || "No description provided."}
        titleClassName="bg-gradient-to-r from-orlixis-teal to-orlixis-teal-light bg-clip-text text-transparent"
        descriptionClassName="text-slate-600 dark:text-slate-300"
        headerExtras={
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-orlixis-teal" />
                Created {formatRelativeTime(project.createdAt)}
              </span>
              {repoHost && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <GitBranch className="h-3.5 w-3.5 text-orlixis-teal" />
                    {repoHost}
                  </span>
                </>
              )}
              {sizeNumber > 0 && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Database className="h-3.5 w-3.5 text-orlixis-teal" />
                    {formatBytes(sizeNumber)}
                  </span>
                </>
              )}
            </div>
            {/*<div className="h-1.5 w-full rounded-full bg-gradient-to-r from-orlixis-teal via-orlixis-teal/70 to-orlixis-teal-light" />*/}
          </div>
        }
        breadcrumbItems={[
          { label: "Dashboard", href: "/", icon: FolderOpenDot },
          { label: "Projects", href: "/projects", icon: FolderOpenDot },
          { label: project.name, href: `/projects/${project.id}`, icon: FileCode, isCurrentPage: true }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Badge
              variant={statusBadgeVariant(project.status)}
              blurred
              translucent
              className="capitalize px-3 py-1 text-sm font-medium"
            >
              {project.status.toLowerCase()}
            </Badge>
            {project.repositoryUrl && (
              <Button asChild variant="outline" className="gap-2 hover:shadow-md transition-all">
                <a href={project.repositoryUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Repository
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="gap-2 hover:shadow-md transition-all border-orlixis-teal/30 hover:border-orlixis-teal hover:bg-orlixis-teal/5">
              <Link href={`/projects/${project.id}/files`}>
                <FileCode className="h-4 w-4" />
                Browse Files
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 hover:shadow-md transition-all">
              <Link href="/projects/upload">
                <FolderOpenDot className="h-4 w-4" />
                Upload Code
              </Link>
            </Button>
            <Button asChild className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all">
              <Link href={`/projects/${project.id}/analysis`}>
                <Brain className="h-4 w-4" />
                AI Analysis
              </Link>
            </Button>
            <AnalysisDropdown projectId={project.id} className="!bg-orlixis-teal !hover:bg-orlixis-teal-dark text-white [&_svg]:text-white" />
          </div>
        }
      >
        {/* Project Header Banner */}
        <div className="hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orlixis-teal/10 border border-orlixis-teal/20">
                  <LanguageIcon language={primaryLang} size={32} />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orlixis-teal to-orlixis-teal-light bg-clip-text text-transparent">
                    {project.name}
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-slate-300 mt-1">
                    {project.description || "No description provided"}
                  </p>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>Created {formatRelativeTime(project.createdAt)}</span>
                </div>
                {repoHost && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <GitBranch className="h-4 w-4" />
                    <span>{repoHost}</span>
                  </div>
                )}
                {sizeNumber > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Database className="h-4 w-4" />
                    <span>{formatBytes(sizeNumber)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Reports</p>
                  <p className="text-2xl font-bold text-orlixis-teal">{reportsCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-orlixis-teal/10">
                  <ClipboardList className="h-5 w-5 text-orlixis-teal" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {reports[0] ? `Last: ${formatRelativeTime(reports[0].createdAt)}` : "No reports yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Scans</p>
                  <p className="text-2xl font-bold text-orlixis-teal">{scansCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-orlixis-teal/10 dark:bg-orlixis-teal/20">
                  <Search className="h-5 w-5 text-orlixis-teal" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {displayScans[0] ? `Last: ${formatRelativeTime(displayScans[0].startedAt)}` : "No scans yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Files</p>
                  <p className="text-2xl font-bold text-orlixis-teal">{filesCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-orlixis-teal/10 dark:bg-orlixis-teal/20">
                  <FileCode className="h-5 w-5 text-orlixis-teal" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {files.length > 0 ? `Last: ${formatRelativeTime(files[0].createdAt)}` : "No files yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Security</p>
                  <p className={cn("text-2xl font-bold", securityStatus.color)}>{totalVulns}</p>
                </div>
                <div className={cn("p-2 rounded-lg",
                  totalVulns === 0 ? "bg-orlixis-teal/10 dark:bg-orlixis-teal/20" : "bg-red-100 dark:bg-red-900/20"
                )}>
                  <securityStatus.icon className={cn("h-5 w-5", securityStatus.color)} />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 capitalize">
                {securityStatus.status.replace('-', ' ')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Enhanced Overview */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-orlixis-teal/10">
                    <Activity className="h-5 w-5 text-orlixis-teal" />
                  </div>
                  Project Analytics
                </CardTitle>
                <CardDescription className="text-base">
                  Comprehensive overview of your project&apos;s health and activity metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group p-4 rounded-xl border border-orlixis-teal/20 bg-gradient-to-br from-orlixis-teal/5 to-orlixis-teal/10 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <BarChart3 className="h-5 w-5 text-orlixis-teal" />
                      <span className="font-medium text-orlixis-teal">Analysis Reports</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{reportsCount}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {reports[0] ? `Latest: ${formatRelativeTime(reports[0].createdAt)}` : "Generate your first report"}
                    </p>
                  </div>

                  <div className="group p-4 rounded-xl border border-orlixis-teal/20 bg-gradient-to-br from-orlixis-teal/5 to-orlixis-teal/10 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="h-5 w-5 text-orlixis-teal" />
                      <span className="font-medium text-orlixis-teal">Active Scans</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{scansCount}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {displayScans[0] ? `Latest: ${formatRelativeTime(displayScans[0].startedAt)}` : "Start your first scan"}
                    </p>
                  </div>

                  <div className="group p-4 rounded-xl border border-orlixis-teal/20 bg-gradient-to-br from-orlixis-teal/5 to-orlixis-teal/10 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <Database className="h-5 w-5 text-orlixis-teal" />
                      <span className="font-medium text-orlixis-teal">Codebase Size</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{filesCount}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {sizeNumber > 0 ? formatBytes(sizeNumber) : "Upload your code"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button asChild className="bg-orlixis-teal hover:bg-orlixis-teal-dark text-white gap-2">
                    <Link href={`/projects/${project.id}/files`}>
                      <Eye className="h-4 w-4" />
                      Explore Codebase
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-2 hover:shadow-md transition-all">
                    <Link href={`/projects/${project.id}/reports`}>
                      <FileText className="h-4 w-4" />
                      Reports
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Scan Manager */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-orlixis-teal/10 dark:bg-orlixis-teal/20">
                    <Zap className="h-5 w-5 text-orlixis-teal" />
                  </div>
                  Security Analysis
                </CardTitle>
                <CardDescription className="text-base">
                  Run comprehensive security scans and monitor progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScanManager projectId={project.id} showHistory={true} />
              </CardContent>
            </Card>

            {/* Enhanced Recent Reports */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-orlixis-teal/10">
                    <ClipboardList className="h-5 w-5 text-orlixis-teal" />
                  </div>
                  Recent Analysis Reports
                </CardTitle>
                <CardDescription className="text-base">
                  Latest security analysis results and findings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.slice(0, 3).map((report: Report) => (
                      <div
                        key={report.id}
                        className="group flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-orlixis-teal/5 hover:border-orlixis-teal/40 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-orlixis-teal/10">
                            <ClipboardList className="h-4 w-4 text-orlixis-teal" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              Report #{report.id.slice(-8)}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              Generated {formatDateTime(report.createdAt)}
                            </div>
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="text-orlixis-teal hover:text-orlixis-teal-dark hover:bg-orlixis-teal/10 gap-2">
                          <Link href={`/projects/${project.id}/reports/${report.id}`}>
                            View Report
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    {reports.length > 3 && (
                      <div className="pt-4">
                        <Button asChild variant="outline" className="w-full hover:shadow-md transition-all">
                          <Link href={`/projects/${project.id}/reports`}>
                            View All Reports ({reportsCount})
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                      <ClipboardList className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      No reports generated yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Start a security scan to generate comprehensive analysis reports
                    </p>
                    <Button className="bg-orlixis-teal hover:bg-orlixis-teal-dark text-white">
                      Start First Scan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Languages & Technologies */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-orlixis-teal">
                  <Layers className="h-5 w-5" />
                  Tech Stack
                </CardTitle>
                <CardDescription>Languages and frameworks used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {languages.length ? (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang: string, index: number) => (
                        <Badge key={`${lang}-${index}`} variant="secondary" className="gap-1 px-3 py-1">
                          <LanguageIcon language={lang} size={14} />
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No languages detected</p>
                )}

                {frameworks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Frameworks</h4>
                    <div className="flex flex-wrap gap-2">
                      {frameworks.map((framework: string, index: number) => (
                        <Badge key={`${framework}-${index}`} variant="outline" className="px-3 py-1">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Repository Info */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-orlixis-teal">
                  <Globe className="h-5 w-5" />
                  Repository
                </CardTitle>
                <CardDescription>Source control information</CardDescription>
              </CardHeader>
              <CardContent>
                {project.repositoryUrl ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-orlixis-teal hover:text-orlixis-teal-light underline break-all"
                      >
                        {project.repositoryUrl}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <FetchGitHubFilesButton projectId={project.id} size="sm" />
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href={project.repositoryUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Globe className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No repository linked</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Security Overview */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-orlixis-teal">
                  <Shield className="h-5 w-5" />
                  Security Overview
                </CardTitle>
                <CardDescription>Vulnerability analysis results</CardDescription>
              </CardHeader>
              <CardContent>
                {totalVulns > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <securityStatus.icon className={cn("h-5 w-5", securityStatus.color)} />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {totalVulns} Issues Found
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                          {securityStatus.status.replace('-', ' ')} risk level
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(vulnBySeverity).map(([severity, count]) => (
                        <div key={severity} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={severityBadgeVariant(severity as VulnerabilitySeverity)}
                              className="capitalize px-2 py-1"
                            >
                              {severity.toLowerCase()}
                            </Badge>
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-12 w-12 text-orlixis-teal mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      All Clear!
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      No security vulnerabilities detected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Files Preview */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-orlixis-teal">
                  <FileCode className="h-5 w-5" />
                  Recent Files
                </CardTitle>
                <CardDescription>Latest uploaded project files</CardDescription>
              </CardHeader>
              <CardContent>
                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.slice(0, 5).map((file: FileItem) => (
                      <div
                        key={file.id}
                        className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-orlixis-teal/5 hover:border-orlixis-teal/40 transition-all"
                      >
                        <LanguageIcon
                          language={file.language || file.filename?.split('.').pop() || 'file'}
                          size={16}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate text-slate-900 dark:text-white">
                            {file.filename}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatBytes(file.size)}
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-orlixis-teal hover:text-orlixis-teal-dark">
                          <Link href={`/projects/${project.id}/files?open=${file.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    <div className="pt-3">
                      <Button asChild variant="outline" className="w-full hover:shadow-md transition-all gap-2">
                        <Link href={`/projects/${project.id}/files`}>
                          <FileCode className="h-4 w-4" />
                          Browse All Files ({filesCount})
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                      <FileCode className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      No files uploaded
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                      Upload your code or connect a repository
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button asChild size="sm" className="bg-orlixis-teal hover:bg-orlixis-teal-dark text-white">
                        <Link href="/projects/upload">Upload Files</Link>
                      </Button>
                      {project.repositoryUrl && (
                        <FetchGitHubFilesButton projectId={project.id} size="sm" variant="outline" />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    </div>
  )
}
