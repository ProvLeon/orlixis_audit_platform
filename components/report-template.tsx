"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  FileText,
  Clock,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Code,
  Bug,
  Zap,
  Eye,
  Lock,
  Globe,
  Database,
  Settings,
  Layers
} from "lucide-react"
import { cn, formatDateTime, formatBytes } from "@/lib/utils"

interface VulnerabilityDetails {
  id: string
  title: string
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"
  category: string
  description: string
  location: {
    file: string
    line?: number
    function?: string
  }
  impact: string
  recommendation: string
  cwe?: string
  cvss?: number
}

interface QualityMetric {
  name: string
  score: number
  maxScore: number
  issues: number
  trend: "up" | "down" | "stable"
  description: string
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  benchmark: number
  status: "good" | "warning" | "critical"
  description: string
}

interface ReportData {
  project: {
    id: string
    name: string
    description?: string
    language: string[]
    framework: string[]
    repositoryUrl?: string
    branch?: string
    size?: number
    totalFiles: number
    totalLines: number
  }
  scan: {
    id: string
    type: "SECURITY" | "QUALITY" | "PERFORMANCE" | "COMPREHENSIVE"
    startedAt: Date
    completedAt: Date
    duration: number
  }
  vulnerabilities: VulnerabilityDetails[]
  qualityMetrics: QualityMetric[]
  performanceMetrics: PerformanceMetric[]
  summary: {
    overallScore: number
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    totalIssues: number
    fixedIssues?: number
    newIssues?: number
  }
  recommendations: Array<{
    priority: "HIGH" | "MEDIUM" | "LOW"
    title: string
    description: string
    effort: "LOW" | "MEDIUM" | "HIGH"
    impact: "LOW" | "MEDIUM" | "HIGH"
  }>
}

interface ReportTemplateProps {
  data: ReportData
  reportId: string
  generatedAt?: Date
  className?: string
}

const severityConfig = {
  CRITICAL: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    score: 10,
    bgColor: "bg-red-50"
  },
  HIGH: {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
    score: 7,
    bgColor: "bg-orange-50"
  },
  MEDIUM: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Minus,
    score: 5,
    bgColor: "bg-yellow-50"
  },
  LOW: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Eye,
    score: 2,
    bgColor: "bg-blue-50"
  },
  INFO: {
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: FileText,
    score: 1,
    bgColor: "bg-gray-50"
  }
}

const riskLevelConfig = {
  LOW: { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
  MEDIUM: { color: "text-yellow-600", bg: "bg-yellow-50", icon: Minus },
  HIGH: { color: "text-orange-600", bg: "bg-orange-50", icon: AlertTriangle },
  CRITICAL: { color: "text-red-600", bg: "bg-red-50", icon: XCircle }
}

export function ReportTemplate({ data, reportId, generatedAt, className }: ReportTemplateProps) {
  const { project, scan, vulnerabilities, qualityMetrics, performanceMetrics, summary, recommendations } = data

  const getRiskLevel = (score: number) => {
    if (score >= 90) return "LOW"
    if (score >= 70) return "MEDIUM"
    if (score >= 40) return "HIGH"
    return "CRITICAL"
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-teal-600"
    if (score >= 70) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getCategoryIcon = (category: string) => {
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

  return (
    <div className={cn("min-h-full bg-white text-slate-900 print:bg-white print:min-h-screen overflow-auto", className)}>
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:break-after-page { page-break-after: always; }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:break-inside-avoid { page-break-inside: avoid; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; color-adjust: exact; }
          .print\\:text-black { color: black !important; }
          .print\\:border-black { border-color: black !important; }
          .print\\:min-h-screen { min-height: 100vh !important; }
        }
        @media screen {
          .report-content { max-height: none; overflow: visible; }
        }
        @page {
          margin: 1in;
          size: A4;
        }
      `}</style>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-64 sticky top-4 self-start bg-white border rounded-xl p-4 shadow-sm print:hidden">
          <div className="text-sm font-semibold text-slate-700 mb-3">Contents</div>
          <nav className="space-y-2 text-sm">
            <a href="#executive-summary" className="block text-slate-700 hover:text-[#007b8c]">Executive Summary</a>
            <a href="#vuln-overview" className="block text-slate-700 hover:text-[#007b8c]">Vulnerability Overview</a>
            <a href="#detailed-findings" className="block text-slate-700 hover:text-[#007b8c]">
              Findings
              <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">{vulnerabilities.length}</span>
            </a>
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">By severity</div>
              <ul className="space-y-1">
                <li className="flex justify-between"><a href="#detailed-findings" className="text-red-600 hover:text-red-700">Critical</a><span>{vulnerabilities.filter(v => v.severity === "CRITICAL").length}</span></li>
                <li className="flex justify-between"><a href="#detailed-findings" className="text-orange-600 hover:text-orange-700">High</a><span>{vulnerabilities.filter(v => v.severity === "HIGH").length}</span></li>
                <li className="flex justify-between"><a href="#detailed-findings" className="text-yellow-600 hover:text-yellow-700">Medium</a><span>{vulnerabilities.filter(v => v.severity === "MEDIUM").length}</span></li>
                <li className="flex justify-between"><a href="#detailed-findings" className="text-blue-600 hover:text-blue-700">Low</a><span>{vulnerabilities.filter(v => v.severity === "LOW").length}</span></li>
                <li className="flex justify-between"><a href="#detailed-findings" className="text-slate-600 hover:text-slate-700">Info</a><span>{vulnerabilities.filter(v => v.severity === "INFO").length}</span></li>
              </ul>
            </div>
            <a href="#quality-metrics" className="block text-slate-700 hover:text-[#007b8c]">Code Quality</a>
            <a href="#performance-analysis" className="block text-slate-700 hover:text-[#007b8c]">Performance</a>
            <a href="#recommendations" className="block text-slate-700 hover:text-[#007b8c]">Recommendations</a>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
      {/* Report Header */}
      <header className="mb-8 print:mb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#007b8c] to-[#008da0] rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 print:text-black">
                  Security Audit Report
                </h1>
                <p className="text-lg text-slate-700 font-medium">Project: {project.name}</p>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-slate-600 no-print">
            <p><span className="font-semibold">Report ID:</span> {reportId}</p>
            <p><span className="font-semibold">Generated:</span> {formatDateTime(generatedAt || new Date())}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-[#f0fdfa] border-2 border-[#007b8c]/20 rounded-lg p-6 print:border-black shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Project Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold text-[#007b8c]">Languages:</span> <span className="text-slate-700">{project.language.join(", ")}</span></p>
                <p><span className="font-semibold text-[#007b8c]">Framework:</span> <span className="text-slate-700">{project.framework.join(", ")}</span></p>
                <p><span className="font-semibold text-[#007b8c]">Files:</span> <span className="text-slate-700">{project.totalFiles.toLocaleString()}</span></p>
                <p><span className="font-semibold text-[#007b8c]">Lines:</span> <span className="text-slate-700">{project.totalLines.toLocaleString()}</span></p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Scan Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold text-[#007b8c]">Type:</span> <span className="text-slate-700">{scan.type}</span></p>
                <p><span className="font-semibold text-[#007b8c]">Started:</span> <span className="text-slate-700">{formatDateTime(scan.startedAt)}</span></p>
                <p><span className="font-semibold text-[#007b8c]">Completed:</span> <span className="text-slate-700">{formatDateTime(scan.completedAt)}</span></p>
                <p><span className="font-semibold text-[#007b8c]">Duration:</span> <span className="text-slate-700">{Math.round(scan.duration / 1000)}s</span></p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Overall Score</h3>
              <div className="flex items-center gap-3">
                <div className={cn("text-4xl font-bold", getScoreColor(summary.overallScore))}>
                  {summary.overallScore}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-[#007b8c] to-[#008da0] h-3 rounded-full transition-all duration-300"
                      style={{ width: `${summary.overallScore}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">Security Score</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Risk Level</h3>
              <div className="flex items-center gap-2">
                {React.createElement(riskLevelConfig[summary.riskLevel].icon, {
                  className: cn("w-6 h-6", riskLevelConfig[summary.riskLevel].color)
                })}
                <span className={cn("text-xl font-bold", riskLevelConfig[summary.riskLevel].color)}>
                  {summary.riskLevel}
                </span>
              </div>
              <p className="text-sm text-slate-700 mt-1 font-medium">
                {summary.totalIssues} total issues found
              </p>
            </div>
          </div>
        </div>
      </header>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="mb-8 print:break-inside-avoid flex-shrink-0">
        <h2 id="executive-summary" className="text-2xl font-bold text-gray-900 mb-4 print:text-black border-b-3 border-[#007b8c] pb-2">Executive Summary</h2>
        <Card className="border-2 border-[#007b8c20] print:border-black shadow-lg">
          <CardContent className="p-6 bg-gradient-to-br from-white to-slate-50">
            <div className="prose max-w-none">
              <p className="text-lg text-gray-800 mb-4 leading-relaxed">
                This comprehensive security audit report provides a detailed analysis of the <strong className="text-[#007b8c]">{project.name}</strong> project.
                The assessment covers security vulnerabilities, code quality metrics, and performance indicators.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="text-center p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200 shadow-md">
                  <div className="text-3xl font-bold text-red-700 mb-2">
                    {vulnerabilities.filter(v => v.severity === "CRITICAL" || v.severity === "HIGH").length}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">High-Risk Issues</p>
                  <p className="text-xs text-gray-700">Require immediate attention</p>
                </div>

                <div className="text-center p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 shadow-md">
                  <div className="text-3xl font-bold text-orange-700 mb-2">
                    {vulnerabilities.filter(v => v.severity === "MEDIUM").length}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Medium-Risk Issues</p>
                  <p className="text-xs text-gray-700">Should be addressed</p>
                </div>

                <div className="text-center p-5 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200 shadow-md">
                  <div className="text-3xl font-bold text-teal-700 mb-2">
                    {vulnerabilities.filter(v => v.severity === "LOW" || v.severity === "INFO").length}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Low-Risk Issues</p>
                  <p className="text-xs text-gray-700">Good to fix when possible</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Vulnerability Summary */}
      <section className="mb-8 print:break-inside-avoid flex-shrink-0">
        <h2 id="vuln-overview" className="text-2xl font-bold text-gray-900 mb-4 print:text-black border-b-3 border-[#007b8c] pb-2">Vulnerability Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Object.entries(severityConfig).map(([severity, config]) => {
            const count = vulnerabilities.filter(v => v.severity === severity).length
            const Icon = config.icon

            return (
              <Card key={severity} className={cn("border-2 print:border-black shadow-lg", config.bgColor)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{severity}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                    <Icon className="w-8 h-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Detailed Vulnerabilities */}
      {vulnerabilities.length > 0 && (
        <section className="mb-8 print:break-after-page">
          <h2 id="detailed-findings" className="text-2xl font-bold text-gray-900 mb-6 print:text-black">Detailed Findings</h2>
          <div className="space-y-6">
            {vulnerabilities
              .sort((a, b) => severityConfig[b.severity].score - severityConfig[a.severity].score)
              .map((vuln, index) => {
                const config = severityConfig[vuln.severity]
                const Icon = config.icon
                const CategoryIcon = getCategoryIcon(vuln.category)

                return (
                  <Card key={vuln.id} className="border print:border-black print:break-inside-avoid">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={cn("border", config.color)}>
                              <Icon className="w-3 h-3 mr-1" />
                              {vuln.severity}
                            </Badge>
                            <Badge variant="outline" className="border-gray-200">
                              <CategoryIcon className="w-3 h-3 mr-1" />
                              {vuln.category}
                            </Badge>
                            {vuln.cvss && (
                              <Badge variant="outline" className="border-gray-200">
                                CVSS: {vuln.cvss}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {vuln.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <span className="text-gray-500 font-medium">@</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                              {vuln.location.file}
                              {vuln.location.line && `:${vuln.location.line}`}
                            </code>
                            {vuln.location.function && (
                              <span className="text-gray-500 italic">in {vuln.location.function}()</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          #{index + 1}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700">{vuln.description}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Impact</h4>
                        <p className="text-gray-700">{vuln.impact}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Recommendation</h4>
                        <p className="text-gray-700">{vuln.recommendation}</p>
                      </div>

                      {vuln.cwe && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">CWE:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded">{vuln.cwe}</code>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </section>
      )}

      {/* Quality Metrics */}
      {qualityMetrics.length > 0 && (
        <section className="mb-8 print:break-inside-avoid">
          <h2 id="quality-metrics" className="text-2xl font-bold text-gray-900 mb-6 print:text-black">Code Quality Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {qualityMetrics.map((metric) => {
              const percentage = (metric.score / metric.maxScore) * 100
              const TrendIcon = metric.trend === "up" ? TrendingUp :
                               metric.trend === "down" ? TrendingDown : Minus

              return (
                <Card key={metric.name} className="border print:border-black">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                      <TrendIcon className={cn(
                        "w-5 h-5",
                        metric.trend === "up" ? "text-green-600" :
                        metric.trend === "down" ? "text-red-600" : "text-gray-400"
                      )} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {metric.score}/{metric.maxScore}
                        </span>
                        <span className={cn(
                          "text-sm font-medium",
                          percentage >= 80 ? "text-teal-600" :
                          percentage >= 60 ? "text-orange-600" : "text-red-600"
                        )}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            percentage >= 80 ? "bg-gradient-to-r from-teal-500 to-teal-600" :
                            percentage >= 60 ? "bg-gradient-to-r from-orange-400 to-orange-500" :
                            "bg-gradient-to-r from-red-400 to-red-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Issues: {metric.issues}</span>
                      </div>

                      <p className="text-sm text-gray-700">{metric.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Performance Metrics */}
      {performanceMetrics.length > 0 && (
        <section className="mb-8 print:break-inside-avoid">
          <h2 id="performance-analysis" className="text-2xl font-bold text-gray-900 mb-6 print:text-black">Performance Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {performanceMetrics.map((metric) => {
              const statusConfig = {
                good: { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
                warning: { color: "text-yellow-600", bg: "bg-yellow-50", icon: AlertTriangle },
                critical: { color: "text-red-600", bg: "bg-red-50", icon: XCircle }
              }

              const config = statusConfig[metric.status]
              const StatusIcon = config.icon

              return (
                <Card key={metric.name} className={cn("border print:border-black", config.bg)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                      <StatusIcon className={cn("w-5 h-5", config.color)} />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {metric.value.toLocaleString()} {metric.unit}
                        </div>
                        <div className="text-sm text-gray-600">
                          Benchmark: {metric.benchmark.toLocaleString()} {metric.unit}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700">{metric.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="mb-8 print:break-after-page">
          <h2 id="recommendations" className="text-2xl font-bold text-gray-900 mb-6 print:text-black">Recommendations</h2>
          <div className="space-y-4">
            {recommendations
              .sort((a, b) => {
                const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
                return priorityOrder[b.priority] - priorityOrder[a.priority]
              })
              .map((rec, index) => {
                const priorityConfig = {
                  HIGH: "bg-red-50 text-red-700 border-red-300",
                  MEDIUM: "bg-orange-50 text-orange-700 border-orange-300",
                  LOW: "bg-teal-50 text-teal-700 border-teal-300"
                }

                return (
                  <Card key={index} className="border print:border-black">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg">{rec.title}</h3>
                        <div className="flex gap-2">
                          <Badge className={cn("border", priorityConfig[rec.priority])}>
                            {rec.priority} Priority
                          </Badge>
                          <Badge variant="outline" className="border-teal-200 text-teal-700">
                            {rec.effort} Effort
                          </Badge>
                          <Badge variant="outline" className="border-teal-200 text-teal-700">
                            {rec.impact} Impact
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-700">{rec.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </section>
      )}

      {/* Report Footer */}
      <footer className="mt-12 pt-8 border-t-2 border-[#007b8c] print:border-black print:break-inside-avoid flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Report Information</h3>
            <p><span className="font-medium text-[#007b8c]">ID:</span> <span className="text-gray-700">{reportId}</span></p>
            <p><span className="font-medium text-[#007b8c]">Generated:</span> <span className="text-gray-700">{formatDateTime(generatedAt || new Date())}</span></p>
            <p><span className="font-medium text-[#007b8c]">Version:</span> <span className="text-gray-700">1.0</span></p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Scan Details</h3>
            <p><span className="font-medium text-[#007b8c]">Engine:</span> <span className="text-gray-700">Orlixis Security Scanner</span></p>
            <p><span className="font-medium text-[#007b8c]">Type:</span> <span className="text-gray-700">{scan.type}</span></p>
            <p><span className="font-medium text-[#007b8c]">Duration:</span> <span className="text-gray-700">{Math.round(scan.duration / 1000)}s</span></p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Project Info</h3>
            <p><span className="font-medium text-[#007b8c]">Name:</span> <span className="text-gray-700">{project.name}</span></p>
            <p><span className="font-medium text-[#007b8c]">Files Scanned:</span> <span className="text-gray-700">{project.totalFiles.toLocaleString()}</span></p>
            <p><span className="font-medium text-[#007b8c]">Lines of Code:</span> <span className="text-gray-700">{project.totalLines.toLocaleString()}</span></p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-300 print:border-black text-center">
          <p className="text-sm text-[#007b8c] font-medium">
            This report was generated by <span className="font-semibold text-[#007b8c]">Orlixis Audit Platform</span> - Professional Security Analysis
          </p>
        </div>
      </footer>
    </div>
  )
}
