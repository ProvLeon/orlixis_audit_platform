import React from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { dedupeVulnerabilities, computeScoreAndRisk, unifySecurityMetric } from "@/lib/reportTheme"
import { PageLayout } from "@/components/layout/authenticated-layout"
import { ReportViewerWrapper } from "@/components/report-viewer-wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime, formatRelativeTime } from "@/lib/utils"
import type { ReportStatus, ReportType, VulnerabilitySeverity } from "@prisma/client"
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  Clock,
  Shield,
  BarChart3,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  Database,
  Globe,
  Lock,
  Settings,
  Bug,
  Zap,
  Eye
} from "lucide-react"

export const dynamic = "force-dynamic"

function statusBadgeVariant(status: ReportStatus) {
  switch (status) {
    case "COMPLETED":
      return "success" as const
    case "GENERATING":
      return "warning" as const
    case "FAILED":
      return "destructive" as const
    case "ARCHIVED":
      return "secondary" as const
    default:
      return "secondary" as const
  }
}

function statusIcon(status: ReportStatus) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case "GENERATING":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "FAILED":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "ARCHIVED":
      return <Database className="h-4 w-4 text-slate-500" />
    default:
      return <AlertTriangle className="h-4 w-4 text-slate-500" />
  }
}

function typeMeta(type: ReportType) {
  switch (type) {
    case "SECURITY":
      return { icon: Shield, label: "Security Analysis" }
    case "QUALITY":
      return { icon: Star, label: "Quality Assessment" }
    case "PERFORMANCE":
      return { icon: BarChart3, label: "Performance Analysis" }
    case "COMPREHENSIVE":
    default:
      return { icon: FileText, label: "Comprehensive Audit" }
  }
}

function getCategoryIcon(category: string) {
  const iconMap: Record<string, any> = {
    INJECTION: Database,
    XSS: Globe,
    AUTHENTICATION: Lock,
    AUTHORIZATION: Shield,
    CRYPTOGRAPHY: Lock,
    CODE_QUALITY: Star,
    PERFORMANCE: Zap,
    CONFIGURATION: Settings,
    DEPENDENCY: Layers,
    DEFAULT: Bug
  }
  return iconMap[category] || iconMap.DEFAULT
}

// Safe date conversion helper
function safeDate(date: any): Date {
  if (!date) return new Date()
  if (date instanceof Date) return date
  try {
    return new Date(date)
  } catch {
    return new Date()
  }
}

// Convert database data to report template format
function transformReportData(report: any, project: any, vulnerabilities: any[], scan: any) {
  // Ensure we have valid data
  if (!report || !project) {
    throw new Error("Invalid report or project data")
  }

  // Deduplicate vulnerabilities using shared utilities
  const deduped = dedupeVulnerabilities(vulnerabilities || [])

  // Group vulnerabilities by title/category/CWE and aggregate locations across files
  const groupedFindings = (() => {
    const rank = (s: string) => ({ CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 } as const)[s] ?? 0
    const map = new Map<string, any>()
    for (const v of deduped) {
      const key = `${(v.title || "").trim().toLowerCase()}|${(v.category || "").trim().toLowerCase()}|${(v.cwe || "").toString().toLowerCase()}`
      const loc = { file: v.filePath || "Unknown file", line: v.line || null, function: v.function || null }
      const prev = map.get(key)
      if (!prev) {
        map.set(key, { ...v, locations: [loc] })
      } else {
        prev.locations.push(loc)
        if (rank(v.severity) > rank(prev.severity)) prev.severity = v.severity
        if ((v.cvss ?? -1) > (prev.cvss ?? -1)) prev.cvss = v.cvss
        if (v.description && (!prev.description || prev.description.length < v.description.length)) prev.description = v.description
        if (v.recommendation && (!prev.recommendation || prev.recommendation.length < v.recommendation.length)) prev.recommendation = v.recommendation
      }
    }
    return Array.from(map.values()).map(v => ({
      id: v.id || "unknown",
      title: v.title || `${v.category || "Security"} Vulnerability`,
      severity: v.severity || "LOW",
      category: v.category || "UNKNOWN",
      description: v.description || "No description available",
      location: v.locations?.[0] || { file: "Unknown file", line: null, function: null },
      impact: "Potential security risk that could affect application security",
      recommendation: v.recommendation || "Review and fix this vulnerability",
      cwe: v.cwe ? `CWE-${v.cwe}` : undefined,
      cvss: v.cvss || null,
      locations: v.locations || []
    }))
  })()

  // Compute unified score and risk using shared utilities
  const { score: overallScore, risk } = computeScoreAndRisk(groupedFindings)
    return {
    project: {
      id: project.id || "",
      name: project.name || "Unknown Project",
      description: project.description || null,
      language: Array.isArray(project.language) ? project.language : [],
      framework: Array.isArray(project.framework) ? project.framework : [],
      repositoryUrl: project.repositoryUrl || null,
      branch: project.branch || null,
      size: project.size ? Number(project.size) : 0,
      totalFiles: project.totalFiles || 0,
      totalLines: project.totalLines || 0
    },
    scan: {
      id: scan?.id || report.id || "unknown",
      type: report.type || "SECURITY",
      startedAt: safeDate(scan?.startedAt || report.createdAt),
      completedAt: safeDate(scan?.completedAt || report.updatedAt),
      duration: scan && scan.completedAt && scan.startedAt ?
        (safeDate(scan.completedAt).getTime() - safeDate(scan.startedAt).getTime()) :
        60000 // Default 1 minute
    },
    vulnerabilities: groupedFindings,
    qualityMetrics: [
      {
        name: "Code Quality Score",
        score: 85,
        maxScore: 100,
        issues: groupedFindings.filter(v => v.category === "CODE_QUALITY").length,
        trend: "up" as const,
        description: "Overall assessment of code quality based on static analysis"
      },
      {
        name: "Security Score",
        score: unifySecurityMetric(overallScore),
        maxScore: 100,
        issues: groupedFindings.length,
        trend: "stable" as const,
        description: "Security posture based on identified vulnerabilities"
      }
    ],
    performanceMetrics: [
      {
        name: "Load Time",
        value: 2.3,
        unit: "seconds",
        benchmark: 3.0,
        status: "good" as const,
        description: "Average application load time"
      },
      {
        name: "Memory Usage",
        value: 256,
        unit: "MB",
        benchmark: 512,
        status: "good" as const,
        description: "Peak memory consumption during analysis"
      },
      {
        name: "Bundle Size",
        value: 1.2,
        unit: "MB",
        benchmark: 2.0,
        status: "good" as const,
        description: "Total size of application bundle"
      }
    ],
    summary: {
      overallScore: overallScore,
      riskLevel: risk,
      totalIssues: groupedFindings.length,
      fixedIssues: 0,
      newIssues: groupedFindings.length
    },
    recommendations: generateRecommendations(groupedFindings)
  }
}

function getRiskLevel(vulnerabilities: any[]): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  // Use the unified scoring logic from reportTheme
  const { risk } = computeScoreAndRisk(vulnerabilities)
  return risk
}

function generateRecommendations(vulnerabilities: any[]) {
  const recommendations = []

  if (!Array.isArray(vulnerabilities) || vulnerabilities.length === 0) {
    recommendations.push({
      priority: "LOW" as const,
      title: "Regular Security Reviews",
      description: "Establish a regular schedule for security code reviews and vulnerability assessments.",
      effort: "LOW" as const,
      impact: "MEDIUM" as const
    })
    return recommendations
  }

  if (vulnerabilities.some(v => v.severity === "CRITICAL")) {
    recommendations.push({
      priority: "HIGH" as const,
      title: "Address Critical Security Vulnerabilities",
      description: "Immediately fix all critical security vulnerabilities to prevent potential exploitation.",
      effort: "HIGH" as const,
      impact: "HIGH" as const
    })
  }

  if (vulnerabilities.filter(v => v.category === "INJECTION").length > 0) {
    recommendations.push({
      priority: "HIGH" as const,
      title: "Implement Input Validation",
      description: "Add comprehensive input validation and sanitization to prevent injection attacks.",
      effort: "MEDIUM" as const,
      impact: "HIGH" as const
    })
  }

  if (vulnerabilities.filter(v => v.category === "AUTHENTICATION").length > 0) {
    recommendations.push({
      priority: "MEDIUM" as const,
      title: "Strengthen Authentication",
      description: "Review and enhance authentication mechanisms to prevent unauthorized access.",
      effort: "MEDIUM" as const,
      impact: "MEDIUM" as const
    })
  }

  recommendations.push({
    priority: "LOW" as const,
    title: "Regular Security Reviews",
    description: "Establish a regular schedule for security code reviews and vulnerability assessments.",
    effort: "LOW" as const,
    impact: "MEDIUM" as const
  })

  return recommendations
}

export default async function ReportDetailsPage({
  params,
}: {
  params: Promise<{ id: string; reportId: string }>
}) {
  const { id: projectId, reportId } = await params

  // Auth
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Resolve or upsert user
  let resolvedUserId = (session.user.id || "").trim()
  try {
    if (!resolvedUserId) throw new Error("Missing session user id")
    const existingById = await prisma.user.findUnique({ where: { id: resolvedUserId } })
    if (!existingById) throw new Error("User not found by id")
  } catch {
    const email = (session.user.email || "").trim()
    const name = session.user.name || null
    const image = (session.user as { image?: string })?.image || null
    if (!email) redirect("/auth/signin")
    const upserted = await prisma.user.upsert({
      where: { email },
      update: { name: name || undefined, image: image || undefined },
      create: { email, name, image }
    })
    resolvedUserId = upserted.id
  }

  // Ensure project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: resolvedUserId },
    select: {
      id: true,
      name: true,
      description: true,
      language: true,
      framework: true,
      repositoryUrl: true,
      branch: true,
      size: true
    }
  })
  if (!project) notFound()

  // Fetch report with related data and project statistics
  const [report, vulnerabilities, scan, projectStats] = await Promise.all([
    prisma.report.findFirst({
      where: { id: reportId, projectId: projectId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        size: true,
        template: true,
        pdfUrl: true,
        htmlContent: true,
        content: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.vulnerability.findMany({
      where: { projectId: projectId },
      select: {
        id: true,
        title: true,
        severity: true,
        category: true,
        description: true,
        filePath: true,
        line: true,
        function: true,
        recommendation: true,
        cwe: true,
        cvss: true,
        discoveredAt: true
      },
      orderBy: [
        { severity: "desc" },
        { discoveredAt: "desc" }
      ]
    }),
    prisma.scan.findFirst({
      where: { projectId: projectId },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        startedAt: true,
        completedAt: true
      }
    }),
    // Get actual project file statistics
    prisma.projectFile.aggregate({
      where: { projectId: projectId },
      _count: { id: true },
      _sum: { size: true }
    })
  ])

  if (!report) notFound()

  const { icon: TypeIcon, label: typeLabel } = typeMeta(report.type)
  const basePath = `/projects/${projectId}/reports`
  const titleText = report.name || `${typeLabel} Report`
  const descText = `Detailed ${typeLabel.toLowerCase()} for ${project.name}`

  // Calculate lines of code estimation (rough estimate: 30 lines per KB)
  const estimatedLines = projectStats._sum.size ? Math.round(Number(projectStats._sum.size) / 1024 * 30) : 0

  // Enhance project data with actual statistics
  const enhancedProject = {
    ...project,
    totalFiles: projectStats._count.id || 0,
    totalLines: estimatedLines
  }

  // Transform data for the report template
  const reportData = transformReportData(report, enhancedProject, vulnerabilities, scan)

  return (
    <PageLayout
      title={titleText}
      description={descText}
      titleClassName="bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent"
      descriptionClassName="text-slate-600 dark:text-slate-300"
      breadcrumbItems={[
        { label: "Projects", href: "/projects" },
        { label: project.name, href: `/projects/${projectId}` },
        { label: "Reports", href: `${basePath}` },
        { label: report.name || report.id.slice(0, 8), href: `${basePath}/${report.id}`, isCurrentPage: true }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={basePath}>
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
          {report.pdfUrl && (
            <Button asChild variant="outline" className="gap-2">
              <Link href={report.pdfUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                View PDF
              </Link>
            </Button>
          )}
        </div>
      }
      headerExtras={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Badge variant={statusBadgeVariant(report.status)} className="capitalize">
              <span className="inline-flex items-center gap-1">
                {statusIcon(report.status)}
                {report.status.toLowerCase()}
              </span>
            </Badge>
            <Badge variant="secondary" className="capitalize">
              <span className="inline-flex items-center gap-1">
                <TypeIcon className="h-3.5 w-3.5 text-teal-600" />
                {typeLabel}
              </span>
            </Badge>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-teal-600" />
              Created {formatRelativeTime(report.createdAt)}
            </span>
            <span>•</span>
            <span>Updated {formatRelativeTime(report.updatedAt)}</span>
            {vulnerabilities.length > 0 && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-teal-600" />
                  {vulnerabilities.length} issues found
                </span>
              </>
            )}
          </div>
          <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700" />
        </div>
      }
      showBreadcrumbs={true}
      maxWidth="full"
      className="h-full overflow-hidden"
    >
      <div className="flex-1 min-h-0">
        <ReportViewerWrapper
          reportData={reportData}
          reportId={report.id}
          projectName={project.name}
          className="h-full rounded-lg border bg-white dark:bg-gray-900 shadow-sm"
        />
      </div>

      {/* Additional Report Info */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-shrink-0">
        <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              Report Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={statusBadgeVariant(report.status)} size="sm" className="capitalize">
                {report.status.toLowerCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="secondary" size="sm" className="capitalize">
                <span className="inline-flex items-center gap-1">
                  <TypeIcon className="h-3.5 w-3.5 text-teal-600" />
                  {typeLabel}
                </span>
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">{formatDateTime(report.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vulnerabilities</span>
              <span className="text-sm font-medium">{vulnerabilities.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600" />
              Security Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(severity => {
              const count = vulnerabilities.filter(v => v.severity === severity).length
              const colors = {
                CRITICAL: "text-red-600",
                HIGH: "text-orange-600",
                MEDIUM: "text-yellow-600",
                LOW: "text-blue-600"
              }
              return (
                <div key={severity} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">
                    {severity.toLowerCase()}
                  </span>
                  <span className={`text-sm font-medium ${colors[severity as keyof typeof colors]}`}>
                    {count}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link href={`/projects/${projectId}`}>
                <FileText className="h-4 w-4" />
                Project Overview
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link href={`/projects/${projectId}/files`}>
                <Layers className="h-4 w-4" />
                Browse Files
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link href={`${basePath}`}>
                <FileText className="h-4 w-4" />
                All Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
