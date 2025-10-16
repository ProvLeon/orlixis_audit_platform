"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  Upload,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Activity,
  ArrowRight,
  Plus,
  Eye,
  Code
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageLayout } from "@/components/layout/authenticated-layout"
import { supabase } from "@/lib/supabase/client"

type ProjectRow = {
  id: string
  name: string
  status: string
  language: string[] | null
  size: number
  updatedAt: string
}

type ProjectItem = {
  id: string
  name: string
  status: string
  issues: number
  lastUpdated: string
  languageText: string
  sizeText: string
}

type Stats = {
  totalProjects: number
  securityIssues: number
  reports: number
  openScans: number
}

type AlertItem = {
  id: string
  title: string
  severity: "critical" | "high" | "medium" | "low" | "info"
  projectName: string
  time: string
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "text-green-200 bg-green-900/30 border-green-200"
    case "analyzing":
    case "in_progress":
    case "in-progress":
      return "text-blue-200 bg-blue-900/30 border-blue-200"
    case "pending":
      return "text-yellow-200 bg-yellow-900/30 border-yellow-200"
    case "failed":
      return "text-red-200 bg-red-900/30 border-red-200"
    default:
      return "text-gray-200 bg-gray-900/30 border-gray-200"
  }
}

function getSeverityVariant(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
      return "critical"
    case "high":
      return "high"
    case "medium":
      return "medium"
    case "low":
      return "low"
    default:
      return "info"
  }
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    securityIssues: 0,
    reports: 0,
    openScans: 0,
  })
  const [recentProjects, setRecentProjects] = useState<ProjectItem[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    async function loadData(userId: string) {
      try {
        // 1) Fetch recent projects for this user
        const { data: projectsData, error: projectsErr, count: projectsCount } = await supabase
          .from("projects")
          .select("id,name,status,language,size,updatedAt", { count: "exact" })
          .eq("userId", userId)
          .order("updatedAt", { ascending: false })
          .limit(8)

        if (projectsErr) throw projectsErr

        const projects: ProjectRow[] = projectsData ?? []
        const projectIds = projects.map((p) => p.id)

        // 2) For each project, count vulnerabilities
        const issuesByProject: Record<string, number> = {}
        await Promise.all(
          projects.map(async (p) => {
            const { count, error } = await supabase
              .from("vulnerabilities")
              .select("id", { count: "exact", head: true })
              .eq("projectId", p.id)
            if (error) {
              issuesByProject[p.id] = 0
            } else {
              issuesByProject[p.id] = count ?? 0
            }
          })
        )

        const recent: ProjectItem[] = projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          issues: issuesByProject[p.id] ?? 0,
          lastUpdated: new Date(p.updatedAt).toLocaleString(),
          languageText: Array.isArray(p.language) ? p.language.join(", ") : "",
          sizeText: formatBytes(Number(p.size)),
        }))
        setRecentProjects(recent)

        // 3) Counts for stats
        // total projects (use projectsCount for accuracy even if we limited results)
        const totalProjects = projectsCount ?? recent.length

        // total issues across user's projects
        let securityIssues = 0
        if (projectIds.length > 0) {
          const { count: issuesCount, error: issuesErr } = await supabase
            .from("vulnerabilities")
            .select("id", { count: "exact", head: true })
            .in("projectId", projectIds)
          if (issuesErr) throw issuesErr
          securityIssues = issuesCount ?? 0
        }

        // total reports for user
        const { count: reportsCount, error: reportsErr } = await supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("userId", userId)
        if (reportsErr) throw reportsErr

        // open scans (RUNNING or PENDING)
        let openScans = 0
        if (projectIds.length > 0) {
          const { count: pendingCount, error: pendingErr } = await supabase
            .from("scans")
            .select("id", { count: "exact", head: true })
            .in("projectId", projectIds)
            .in("status", ["PENDING", "RUNNING"])
          if (pendingErr) throw pendingErr
          openScans = pendingCount ?? 0
        }

        setStats({
          totalProjects,
          securityIssues,
          reports: reportsCount ?? 0,
          openScans,
        })

        // 4) Security alerts (recent vulnerabilities)
        if (projectIds.length > 0) {
          const { data: alertsData, error: alertsErr } = await supabase
            .from("vulnerabilities")
            .select("id,title,severity,projectId,discoveredAt")
            .in("projectId", projectIds)
            .order("discoveredAt", { ascending: false })
            .limit(5)
          if (alertsErr) throw alertsErr

          const projectNameById = new Map<string, string>(projects.map((p) => [p.id, p.name]))
          const alerts: AlertItem[] =
            alertsData?.map((a: Record<string, unknown>) => ({
              id: String(a.id) || "",
              title: String(a.title) || "Vulnerability",
              severity: (String(a.severity) || "info").toLowerCase() as AlertItem["severity"],
              projectName: projectNameById.get(String(a.projectId)) || "Unknown Project",
              time: a.discoveredAt ? new Date(String(a.discoveredAt)).toLocaleString() : "",
            })) ?? []

          setSecurityAlerts(alerts)
        } else {
          setSecurityAlerts([])
        }

        setApiHealthy(true)
      } catch (error) {
        console.error("Dashboard data loading error:", error)
        setApiHealthy(false)
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated" && session?.user?.id) {
      void loadData(session.user.id as string)
    }
  }, [status, session?.user?.id])

  // Redirect to signin if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  // Show loading state while checking authentication or fetching data
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const statsGrid = [
    {
      title: "Total Projects",
      value: String(stats.totalProjects),
      icon: Database,
      description: "Projects you own",
    },
    {
      title: "Security Issues",
      value: String(stats.securityIssues),
      icon: Shield,
      description: "Vulnerabilities detected",
    },
    {
      title: "Reports Generated",
      value: String(stats.reports),
      icon: FileText,
      description: "All-time",
    },
    {
      title: "Open Scans",
      value: String(stats.openScans),
      icon: BarChart3,
      description: "Pending or running",
    },
  ]

  const quickActions = [
    {
      title: "Upload New Project",
      description: "Start a fresh codebase audit",
      icon: Upload,
      href: "/projects/upload",
      color: "bg-orlixis-teal/30",
    },
    {
      title: "View Reports",
      description: "Browse generated reports",
      icon: FileText,
      href: "/reports",
      color: "bg-blue-600/30",
    },
    {
      title: "Security Center",
      description: "Review security findings",
      icon: Shield,
      href: "/security",
      color: "bg-red-900/50",
    },
  ]

  return (
    <PageLayout
      title="Welcome to Orlixis"
      description="Professional codebase auditing and security analysis platform"
      actions={
        <Button size="lg" className="shadow-orlixis" onClick={() => router.push("/projects/upload")}>
          <Plus className="h-4 w-4 mr-2" />
          New Audit
        </Button>
      }
      breadcrumbItems={[
        { label: "Dashboard", href: "/", icon: BarChart3, isCurrentPage: true }
      ]}
    >

      {/* Welcome Message */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""} to{" "}
          <span className="text-gradient-orlixis">Orlixis</span>
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsGrid.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="transition-all duration-200 hover:shadow-orlixis">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orlixis-teal/10">
                    <Icon className="h-6 w-6 text-orlixis-teal" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Latest codebase audits and their status</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/projects/upload")}>
                  <Eye className="h-4 w-4 mr-2" />
                  Upload New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No projects yet. Start by uploading one.</div>
                ) : (
                  recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orlixis-teal/10">
                          <Code className="h-5 w-5 text-orlixis-teal" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{project.name}</p>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            <Badge variant="outline" size="sm" className={getStatusColor(project.status)}
                              translucent
                              blurred>
                              {project.status}
                            </Badge>
                            <Badge variant={project.issues > 0 ? getSeverityVariant("high") : "info"} size="sm" className="bg-red-900/50"
                              translucent
                              blurred
                            >
                              {project.issues} issues
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate">
                              {project.languageText}
                              {project.languageText && " • "} {project.sizeText}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-muted-foreground">{project.lastUpdated}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Link key={index} href={action.href}>
                      <Button
                        variant="ghost"
                        className="h-auto p-4 w-full flex flex-col items-center space-y-2 hover:bg-accent transition-all duration-200"
                      >
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg  ${action.color}`}>
                          <Icon className={`h-8 w-8 text-white`} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium">{action.title}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Security Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                    Security Alerts
                  </CardTitle>
                  <CardDescription>Recent security findings</CardDescription>
                </div>
                <Badge variant="high" size="sm" className="bg-orange-900/10 text-orange-600 border-orange-200">
                  {securityAlerts.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityAlerts.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No recent alerts.</div>
                ) : (
                  securityAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex h-2 w-2 rounded-full bg-red-500 mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.projectName}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant={getSeverityVariant(alert.severity)} size="sm">
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{alert.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link href="/security">
                  View All Alerts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 text-green-500 mr-2" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Services</span>
                  <div className="flex items-center">
                    {apiHealthy ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">Online</span>
                      </>
                    ) : apiHealthy === false ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-sm text-red-600">Degraded</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-yellow-600">Checking...</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <div className="flex items-center">
                    {apiHealthy ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">Healthy</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-sm text-red-600">Issues</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
