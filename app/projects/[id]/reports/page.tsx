
import React from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { PageLayout } from "@/components/layout/authenticated-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils"
import {
  FileText,
  Shield,
  BarChart3,
  Star,
  FileDown,
  Download,
  Eye,
  SortAsc,
  SortDesc,
  Search,
  Layers,
  Filter,
} from "lucide-react"
import type { ReportStatus, ReportType } from "@prisma/client"

export const dynamic = "force-dynamic"

interface FilterBarProps {
  q: string
  type?: string
  status?: string
  sort: string
  order: string
  onFiltersChange: (filters: Record<string, string>) => void
}

function FilterBar({ q, type, status, sort, order, onFiltersChange }: FilterBarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Reports
          </label>
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            defaultValue={q}
            onChange={(e) => onFiltersChange({ q: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            defaultValue={type || ""}
            onChange={(e) => onFiltersChange({ type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="SECURITY">Security</option>
            <option value="QUALITY">Quality</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="COMPREHENSIVE">Comprehensive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            defaultValue={status || ""}
            onChange={(e) => onFiltersChange({ status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="GENERATING">Generating</option>
            <option value="FAILED">Failed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort By
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            defaultValue={sort}
            onChange={(e) => onFiltersChange({ sort: e.target.value })}
          >
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Created Date</option>
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Order
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            defaultValue={order}
            onChange={(e) => onFiltersChange({ order: e.target.value })}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  )
}

type SortField = "name" | "date" | "status" | "type"
type SortOrder = "asc" | "desc"

function toReportType(param?: string | null): ReportType | undefined {
  if (!param) return undefined
  const map: Record<string, ReportType> = {
    security: "SECURITY",
    quality: "QUALITY",
    performance: "PERFORMANCE",
    comprehensive: "COMPREHENSIVE",
  }
  return map[param.toLowerCase()]
}

function toReportStatus(param?: string | null): ReportStatus | undefined {
  if (!param) return undefined
  const map: Record<string, ReportStatus> = {
    generating: "GENERATING",
    completed: "COMPLETED",
    failed: "FAILED",
    archived: "ARCHIVED",
  }
  return map[param.toLowerCase()]
}

function toSortField(param?: string | null): SortField {
  const allowed: SortField[] = ["name", "date", "status", "type"]
  return (param as SortField) && allowed.includes(param as SortField) ? (param as SortField) : "date"
}

function toSortOrder(param?: string | null): SortOrder {
  return param === "asc" || param === "desc" ? param : "desc"
}

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

function typeChip(type: ReportType) {
  const Icon = type === "SECURITY" ? Shield : type === "QUALITY" ? Star : type === "PERFORMANCE" ? BarChart3 : FileText
  return { Icon, label: type.toLowerCase() }
}

function qs(baseUrl: string, params: Record<string, string | number | undefined>) {
  const url = new URL(baseUrl, "http://localhost") // base is ignored when rendered
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return
    url.searchParams.set(k, String(v))
  })
  // Return only search portion (without origin)
  const sp = url.search.toString()
  return sp.startsWith("?") ? sp : `?${sp}`
}

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{
    q?: string
    type?: string
    status?: string
    sort?: SortField
    order?: SortOrder
    page?: string
    pageSize?: string
  }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/auth/signin")
  }

  let resolvedUserId = (session.user.id || "").trim()
  try {
    if (!resolvedUserId) throw new Error("Missing session user id")
    const existingById = await prisma.user.findUnique({ where: { id: resolvedUserId } })
    if (!existingById) throw new Error("User not found by id")
  } catch {
    const email = (session?.user?.email || "").trim()

    const name = session?.user?.name || null
    const image = (session?.user as { image?: string })?.image || null
    if (!email) redirect("/auth/signin")
    const upserted = await prisma.user.upsert({
      where: { email },
      update: { name: name || undefined, image: image || undefined },
      create: { email, name, image },
    })
    resolvedUserId = upserted.id
  }

  const { id: projectId } = await params

  // Ensure project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: resolvedUserId },
    select: { id: true, name: true, userId: true },
  })
  if (!project) {
    notFound()
  }

  // Read filters from searchParams
  const resolvedSearchParams = await searchParams
  const q = (resolvedSearchParams?.q || "").trim()
  const typeParam = toReportType(resolvedSearchParams?.type)
  const statusParam = toReportStatus(resolvedSearchParams?.status)
  const sortField = toSortField(resolvedSearchParams?.sort)
  const sortOrder = toSortOrder(resolvedSearchParams?.order)
  const page = Math.max(1, parseInt(resolvedSearchParams?.page || "1", 10) || 1)
  const pageSize = Math.min(50, Math.max(5, parseInt(resolvedSearchParams?.pageSize || "10", 10) || 10))

  const where = {
    projectId,
    ...(q
      ? {
          OR: [{ name: { contains: q, mode: "insensitive" } }],
        }
      : {}),
    ...(typeParam ? { type: typeParam } : {}),
    ...(statusParam ? { status: statusParam } : {}),
  }

  const orderBy =
    sortField === "name"
      ? { name: sortOrder }
      : sortField === "status"
        ? { status: sortOrder }
        : sortField === "type"
          ? { type: sortOrder }
          : { updatedAt: sortOrder }

  // Fetch data
  const [rows, total, byStatus] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        size: true,
        pdfUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.report.count({ where }),
    prisma.report
      .groupBy({
        by: ["status"],
        where: { projectId },
        _count: { _all: true },
      })
      .catch(() => [] as { status: ReportStatus; _count: { _all: number } }[]),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const basePath = `/projects/${projectId}/reports`

  return (
    <PageLayout
      title="Audit Reports"
      description={`All generated reports for ${project.name}`}
      titleClassName="bg-gradient-to-r from-orlixis-teal to-orlixis-teal-light bg-clip-text text-transparent"
      descriptionClassName="text-slate-600 dark:text-slate-300"
      breadcrumbItems={[
        { label: "Projects", href: "/projects" },
        { label: project.name, href: `/projects/${projectId}` },
        { label: "Reports", href: `${basePath}`, isCurrentPage: true },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/projects/${projectId}`}>
              <FileText className="h-4 w-4" />
              Back to Project
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/projects/${projectId}/files`}>
              <Layers className="h-4 w-4" />
              Browse Files
            </Link>
          </Button>
        </div>
      }
      headerExtras={
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-orlixis-teal" />
            {total} total report{total === 1 ? "" : "s"}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-orlixis-teal" />
            {q ? `Search “${q}” • ` : ""} {typeParam ? `${typeParam.toLowerCase()}` : "all types"} •{" "}
            {statusParam ? `${statusParam.toLowerCase()}` : "all status"}
          </span>
        </div>
      }
    >
      {/* Filters */}
      <Card className="mb-6 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4 md:p-6">
          <form method="get" action={basePath} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="md:col-span-5">
              <label htmlFor="q" className="sr-only">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="q"
                  name="q"
                  defaultValue={q}
                  type="search"
                  placeholder="Search reports by name..."
                  className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2"
                />
              </div>
            </div>

            {/* Type */}
            <div className="md:col-span-3">
              <label htmlFor="type" className="block text-xs font-medium text-muted-foreground mb-1">
                Type
              </label>
              <select
                id="type"
                name="type"
                defaultValue={(resolvedSearchParams?.type as string) || ""}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2"
              >
                <option value="">All</option>
                <option value="security">Security</option>
                <option value="quality">Quality</option>
                <option value="performance">Performance</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label htmlFor="status" className="block text-xs font-medium text-muted-foreground mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={(resolvedSearchParams?.status as string) || ""}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2"
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="generating">Generating</option>
                <option value="failed">Failed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Sort */}
            <div className="md:col-span-2">
              <label htmlFor="sort" className="block text-xs font-medium text-muted-foreground mb-1">
                Sort by
              </label>
              <div className="flex gap-2">
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sortField}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2"
                >
                  <option value="date">Last updated</option>
                  <option value="name">Name</option>
                  <option value="status">Status</option>
                  <option value="type">Type</option>
                </select>
                <select
                  id="order"
                  name="order"
                  defaultValue={sortOrder}
                  className="rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="md:col-span-12 flex justify-end">
              <input type="hidden" name="page" value="1" />
              <Button type="submit" className="bg-orlixis-teal hover:bg-orlixis-teal-dark">
                Apply Filters
              </Button>
            </div>
          </form>

          {/* Status overview chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(["GENERATING", "COMPLETED", "FAILED", "ARCHIVED"] as ReportStatus[]).map((st) => {
              const item = (byStatus as { status: ReportStatus; _count: { _all: number } }[]).find((x) => x.status === st)
              const count = item?._count?._all || 0
              return (
                <Badge key={st} variant={statusBadgeVariant(st)} blurred translucent className="px-3 py-1 capitalize">
                  {st.toLowerCase()} <span className="ml-1 font-normal opacity-75">({count})</span>
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-orlixis-teal">Reports ({total})</CardTitle>
              <CardDescription>
                Page {page} of {totalPages}
              </CardDescription>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={page <= 1}
              >
                <Link
                  href={`${basePath}${qs(basePath, {
                    q,
                    type: resolvedSearchParams?.type,
                    status: resolvedSearchParams?.status,
                    sort: sortField,
                    order: sortOrder,
                    page: Math.max(1, page - 1),
                    pageSize,
                  })}`}
                >
                  <SortAsc className="h-4 w-4" />
                  Prev
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={page >= totalPages}
              >
                <Link
                  href={`${basePath}${qs(basePath, {
                    q,
                    type: resolvedSearchParams?.type,
                    status: resolvedSearchParams?.status,
                    sort: sortField,
                    order: sortOrder,
                    page: Math.min(totalPages, page + 1),
                    pageSize,
                  })}`}
                >
                  <SortDesc className="h-4 w-4" />
                  Next
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Responsive list: cards on small screens */}
          <div className="md:hidden space-y-3">
            {rows.map((r) => {
              const { Icon, label } = typeChip(r.type)
              return (
                <div key={r.id} className="rounded-lg border p-4 bg-white/80 dark:bg-slate-900/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-orlixis-teal" />
                        <h3 className="font-semibold truncate">{r.name}</h3>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {label}
                        </span>
                        <span>•</span>
                        <span>Updated {formatRelativeTime(r.updatedAt.toISOString())}</span>
                        <span>•</span>
                        <span>{r.size ?? "—"}</span>
                      </div>
                    </div>
                    <Badge variant={statusBadgeVariant(r.status)} size="sm" className="capitalize">
                      {r.status.toLowerCase()}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm" className="text-orlixis-teal">
                      <Link href={`/projects/${projectId}/reports/${r.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {r.pdfUrl && (
                      <Button asChild variant="ghost" size="sm" className="text-orlixis-teal">
                        <Link href={r.pdfUrl} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            {rows.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No reports found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters above.
                </p>
              </div>
            )}
          </div>

          {/* Table on md+ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left p-3">
                    <div className="inline-flex items-center">
                      Report
                      {sortField === "name" && (sortOrder === "asc" ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />)}
                    </div>
                  </th>
                  <th className="text-left p-3">
                    <div className="inline-flex items-center">
                      Type
                      {sortField === "type" && (sortOrder === "asc" ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />)}
                    </div>
                  </th>
                  <th className="text-left p-3">
                    <div className="inline-flex items-center">
                      Status
                      {sortField === "status" && (sortOrder === "asc" ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />)}
                    </div>
                  </th>
                  <th className="text-left p-3">
                    Last Updated
                    {sortField === "date" && (sortOrder === "asc" ? <SortAsc className="h-4 w-4 ml-1 inline" /> : <SortDesc className="h-4 w-4 ml-1 inline" />)}
                  </th>
                  <th className="text-left p-3">Size</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const { Icon, label } = typeChip(r.type)
                  return (
                    <tr key={r.id} className="border-b hover:bg-orlixis-teal/5 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-orlixis-teal" />
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{r.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Created {formatDateTime(r.createdAt.toISOString())}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="capitalize">
                          {label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={statusBadgeVariant(r.status)} className="capitalize">
                          {r.status.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-foreground">{formatRelativeTime(r.updatedAt.toISOString())}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(r.updatedAt.toISOString())}</div>
                      </td>
                      <td className="p-3">
                        <span className="text-muted-foreground">{r.size ?? "—"}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm" className="text-orlixis-teal">
                            <Link href={`/projects/${projectId}/reports/${r.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {r.pdfUrl && (
                            <Button asChild variant="ghost" size="sm" className="text-orlixis-teal">
                              <Link href={r.pdfUrl} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <div className="text-center">
                        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <div className="text-foreground font-medium mb-1">No reports found</div>
                        <div className="text-muted-foreground text-sm">Try adjusting your filters above.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (mobile) */}
          <div className="mt-4 md:hidden flex items-center justify-between">
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page <= 1}
            >
              <Link
                href={`${basePath}${qs(basePath, {
                  q,
                  type: resolvedSearchParams?.type,
                  status: resolvedSearchParams?.status,
                  sort: sortField,
                  order: sortOrder,
                  page: Math.max(1, page - 1),
                  pageSize,
                })}`}
              >
                Prev
              </Link>
            </Button>
            <div className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
            >
              <Link
                href={`${basePath}${qs(basePath, {
                  q,
                  type: resolvedSearchParams?.type,
                  status: resolvedSearchParams?.status,
                  sort: sortField,
                  order: sortOrder,
                  page: Math.min(totalPages, page + 1),
                  pageSize,
                })}`}
              >
                Next
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
