"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Search,
  Filter,
  Calendar,
  Clock,
  FileText,
  Code,
  Database,
  Lock,
  Unlock,
  Key,
  Bug,
  Zap,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Play,
  Pause,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  Globe,
  Server,
  Archive
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PageLayout } from "@/components/layout/authenticated-layout"
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils"

type VulnerabilitySeverity = "critical" | "high" | "medium" | "low" | "info"
type VulnerabilityCategory = "injection" | "authentication" | "authorization" | "crypto" | "configuration" | "dependency" | "code_quality"
type ScanStatus = "running" | "completed" | "failed" | "scheduled"

interface Vulnerability {
  id: string
  title: string
  description: string
  severity: VulnerabilitySeverity
  category: VulnerabilityCategory
  cwe: string
  cvss: number
  file: string
  line: number
  function?: string
  code: string
  recommendation: string
  project: string
  discoveredAt: Date
  status: "open" | "acknowledged" | "resolved" | "false_positive"
  assignee?: string
}

interface SecurityMetrics {
  totalVulnerabilities: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  resolvedCount: number
  newThisWeek: number
  averageCvss: number
  securityScore: number
  lastScanDate: Date
  nextScanDate: Date
}

const securityMetrics: SecurityMetrics = {
  totalVulnerabilities: 147,
  criticalCount: 8,
  highCount: 23,
  mediumCount: 45,
  lowCount: 71,
  resolvedCount: 89,
  newThisWeek: 12,
  averageCvss: 6.2,
  securityScore: 72,
  lastScanDate: new Date("2024-01-16T14:30:00"),
  nextScanDate: new Date("2024-01-17T02:00:00")
}

const vulnerabilities: Vulnerability[] = [
  {
    id: "vuln-001",
    title: "SQL Injection in User Authentication",
    description: "User input is directly concatenated into SQL query without proper sanitization",
    severity: "critical",
    category: "injection",
    cwe: "CWE-89",
    cvss: 9.1,
    file: "src/auth/login.ts",
    line: 45,
    function: "authenticateUser",
    code: "const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;",
    recommendation: "Use parameterized queries or prepared statements to prevent SQL injection attacks",
    project: "Banking Mobile App",
    discoveredAt: new Date("2024-01-16T10:15:00"),
    status: "open",
    assignee: "john.doe@company.com"
  },
  {
    id: "vuln-002",
    title: "Hardcoded API Key in Configuration",
    description: "API key is hardcoded in the source code, exposing sensitive credentials",
    severity: "high",
    category: "configuration",
    cwe: "CWE-798",
    cvss: 7.5,
    file: "config/api.js",
    line: 12,
    code: "const API_KEY = 'sk-1234567890abcdef';",
    recommendation: "Store API keys in environment variables or secure configuration management",
    project: "E-Commerce Platform",
    discoveredAt: new Date("2024-01-15T16:20:00"),
    status: "acknowledged"
  },
  {
    id: "vuln-003",
    title: "Weak Password Policy Implementation",
    description: "Password validation allows weak passwords that don't meet security standards",
    severity: "medium",
    category: "authentication",
    cwe: "CWE-521",
    cvss: 5.3,
    file: "utils/validation.py",
    line: 78,
    function: "validate_password",
    code: "if len(password) >= 6: return True",
    recommendation: "Implement strong password policy with complexity requirements",
    project: "Healthcare Dashboard",
    discoveredAt: new Date("2024-01-14T11:30:00"),
    status: "open"
  },
  {
    id: "vuln-004",
    title: "Outdated Dependency with Known Vulnerabilities",
    description: "Using vulnerable version of lodash library (CVE-2021-23337)",
    severity: "high",
    category: "dependency",
    cwe: "CWE-1104",
    cvss: 8.2,
    file: "package.json",
    line: 23,
    code: "\"lodash\": \"^4.17.19\"",
    recommendation: "Update lodash to version 4.17.21 or later to fix security vulnerabilities",
    project: "E-Commerce Platform",
    discoveredAt: new Date("2024-01-13T09:45:00"),
    status: "resolved"
  },
  {
    id: "vuln-005",
    title: "Missing HTTPS Enforcement",
    description: "Application accepts HTTP connections without redirecting to HTTPS",
    severity: "medium",
    category: "configuration",
    cwe: "CWE-319",
    cvss: 4.8,
    file: "server/app.js",
    line: 15,
    code: "app.listen(3000, () => { console.log('Server running on port 3000'); });",
    recommendation: "Implement HTTPS-only communication and use HSTS headers",
    project: "Logistics API",
    discoveredAt: new Date("2024-01-12T14:10:00"),
    status: "open"
  }
]

const categoryLabels = {
  injection: "Injection",
  authentication: "Authentication",
  authorization: "Authorization",
  crypto: "Cryptography",
  configuration: "Configuration",
  dependency: "Dependencies",
  code_quality: "Code Quality"
}

const severityColors = {
  critical: "text-red-700 bg-red-50 border-red-200",
  high: "text-orange-700 bg-orange-50 border-orange-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  low: "text-blue-700 bg-blue-50 border-blue-200",
  info: "text-gray-700 bg-gray-50 border-gray-200"
}

const statusColors = {
  open: "text-red-600 bg-red-50 border-red-200",
  acknowledged: "text-yellow-600 bg-yellow-50 border-yellow-200",
  resolved: "text-green-600 bg-green-50 border-green-200",
  false_positive: "text-gray-600 bg-gray-50 border-gray-200"
}

export default function SecurityPage() {
  const [selectedSeverity, setSelectedSeverity] = useState<VulnerabilitySeverity | "all">("all")
  const [selectedCategory, setSelectedCategory] = useState<VulnerabilityCategory | "all">("all")
  const [selectedStatus, setSelectedStatus] = useState<"all" | "open" | "acknowledged" | "resolved" | "false_positive">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isScanning, setIsScanning] = useState(false)

  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    const matchesSearch = vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vuln.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vuln.file.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = selectedSeverity === "all" || vuln.severity === selectedSeverity
    const matchesCategory = selectedCategory === "all" || vuln.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || vuln.status === selectedStatus
    return matchesSearch && matchesSeverity && matchesCategory && matchesStatus
  })

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getSeverityIcon = (severity: VulnerabilitySeverity) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      case "high":
        return <AlertCircle className="h-4 w-4" />
      case "medium":
        return <Info className="h-4 w-4" />
      case "low":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getCategoryIcon = (category: VulnerabilityCategory) => {
    switch (category) {
      case "injection":
        return <Bug className="h-4 w-4" />
      case "authentication":
        return <Lock className="h-4 w-4" />
      case "authorization":
        return <Key className="h-4 w-4" />
      case "crypto":
        return <Shield className="h-4 w-4" />
      case "configuration":
        return <Settings className="h-4 w-4" />
      case "dependency":
        return <Archive className="h-4 w-4" />
      case "code_quality":
        return <Code className="h-4 w-4" />
      default:
        return <Bug className="h-4 w-4" />
    }
  }

  const startScan = () => {
    setIsScanning(true)
    // Simulate scan process
    setTimeout(() => {
      setIsScanning(false)
    }, 5000)
  }

  return (
    <PageLayout
      title="Security Analysis"
      description="Comprehensive vulnerability assessment and security monitoring"
      breadcrumbItems={[
        { label: "Dashboard", href: "/", icon: Shield },
        { label: "Security", href: "/security", icon: Shield, isCurrentPage: true }
      ]}
      actions={
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button
            onClick={startScan}
            disabled={isScanning}
            size="lg"
            className="shadow-orlixis"
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Scan
              </>
            )}
          </Button>
        </div>
      }
    >

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="transition-all duration-200 hover:shadow-orlixis">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className={cn("text-3xl font-bold", getSecurityScoreColor(securityMetrics.securityScore))}>
                  {securityMetrics.securityScore}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Overall security rating</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orlixis-teal/10">
                <Shield className="h-6 w-6 text-orlixis-teal" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-orlixis">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Vulnerabilities</p>
                <p className="text-3xl font-bold text-foreground">{securityMetrics.totalVulnerabilities}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-xs text-red-600">+{securityMetrics.newThisWeek} this week</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-orlixis">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                <p className="text-3xl font-bold text-red-600">{securityMetrics.criticalCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-orlixis">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Issues</p>
                <p className="text-3xl font-bold text-green-600">{securityMetrics.resolvedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((securityMetrics.resolvedCount / (securityMetrics.totalVulnerabilities + securityMetrics.resolvedCount)) * 100)}% resolution rate
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vulnerability Severity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Distribution</CardTitle>
              <CardDescription>Breakdown by severity level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Critical</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={(securityMetrics.criticalCount / securityMetrics.totalVulnerabilities) * 100}
                      className="w-32"
                      variant="error"
                    />
                    <span className="text-sm font-medium w-8">{securityMetrics.criticalCount}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">High</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={(securityMetrics.highCount / securityMetrics.totalVulnerabilities) * 100}
                      className="w-32"
                      variant="warning"
                    />
                    <span className="text-sm font-medium w-8">{securityMetrics.highCount}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Medium</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={(securityMetrics.mediumCount / securityMetrics.totalVulnerabilities) * 100}
                      className="w-32"
                      variant="orlixis"
                    />
                    <span className="text-sm font-medium w-8">{securityMetrics.mediumCount}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Low</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={(securityMetrics.lowCount / securityMetrics.totalVulnerabilities) * 100}
                      className="w-32"
                      variant="success"
                    />
                    <span className="text-sm font-medium w-8">{securityMetrics.lowCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vulnerabilities List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vulnerabilities ({filteredVulnerabilities.length})</CardTitle>
                  <CardDescription>Security issues found in your codebase</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search vulnerabilities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value as VulnerabilitySeverity | "all")}
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as VulnerabilityCategory | "all")}
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as "all" | "open" | "acknowledged" | "resolved" | "false_positive")}
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                    <option value="false_positive">False Positive</option>
                  </select>
                </div>
              </div>

              {/* Vulnerabilities */}
              <div className="space-y-4">
                {filteredVulnerabilities.map((vulnerability) => (
                  <div key={vulnerability.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={vulnerability.severity} size="sm">
                            {getSeverityIcon(vulnerability.severity)}
                            {vulnerability.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {getCategoryIcon(vulnerability.category)}
                            {categoryLabels[vulnerability.category]}
                          </Badge>
                          <Badge variant="outline" size="sm" className={statusColors[vulnerability.status]}>
                            {vulnerability.status.replace("_", " ").toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            CVSS: {vulnerability.cvss} • {vulnerability.cwe}
                          </span>
                        </div>

                        <h3 className="font-medium text-foreground mb-1">{vulnerability.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{vulnerability.description}</p>

                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {vulnerability.file}:{vulnerability.line}
                          </span>
                          {vulnerability.function && (
                            <span className="flex items-center">
                              <Code className="h-3 w-3 mr-1" />
                              {vulnerability.function}()
                            </span>
                          )}
                          <span className="flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {vulnerability.project}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatRelativeTime(vulnerability.discoveredAt)}
                          </span>
                        </div>

                        <div className="bg-muted rounded p-2 mb-2">
                          <code className="text-xs">{vulnerability.code}</code>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <strong>Recommendation:</strong> {vulnerability.recommendation}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredVulnerabilities.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No vulnerabilities found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || selectedSeverity !== "all" || selectedCategory !== "all" || selectedStatus !== "all"
                        ? "Try adjusting your filters to see more results."
                        : "Great! No security issues detected."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Scan Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className={cn("h-5 w-5 mr-2", isScanning && "animate-spin")} />
                Scan Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Scan</span>
                  <span className="text-sm text-foreground">{formatRelativeTime(securityMetrics.lastScanDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Scan</span>
                  <span className="text-sm text-foreground">{formatRelativeTime(securityMetrics.nextScanDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average CVSS</span>
                  <Badge variant={securityMetrics.averageCvss > 7 ? "high" : securityMetrics.averageCvss > 4 ? "medium" : "low"}>
                    {securityMetrics.averageCvss}
                  </Badge>
                </div>
                <div className="pt-3 border-t">
                  <Button
                    onClick={startScan}
                    disabled={isScanning}
                    className="w-full"
                    size="sm"
                  >
                    {isScanning ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Scan
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Scan Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Vulnerability Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(categoryLabels).slice(0, 5).map(([key, label]) => {
                  const count = vulnerabilities.filter(v => v.category === key).length
                  const Icon = getCategoryIcon(key as VulnerabilityCategory)

                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {Icon}
                        <span className="text-sm">{label}</span>
                      </div>
                      <Badge variant="secondary" size="sm">{count}</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Security Report
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Scan Rules
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Trends
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Security Policies
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
