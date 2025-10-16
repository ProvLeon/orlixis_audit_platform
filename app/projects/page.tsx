"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  FolderOpen,
  GitBranch,
  Link2,
  Clock,
  Filter,
  ArrowLeft,
  ArrowRight,
  Layers,
} from "lucide-react";

import { PageLayout } from "@/components/layout/authenticated-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageIcon } from "@/components/ui/language-icon";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import { Folder } from "lucide-react";

type ProjectStatus = "PENDING" | "UPLOADING" | "ANALYZING" | "COMPLETED" | "FAILED" | "ARCHIVED";

type Project = {
  id: string;
  name: string;
  description: string | null;
  repositoryUrl: string | null;
  branch: string;
  language: string[];
  framework: string[];
  size: number | string; // API serializes BigInt as string
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

type ProjectsResponse = {
  projects: Project[];
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
};

const STATUS_OPTIONS: { label: string; value: "ALL" | ProjectStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Uploading", value: "UPLOADING" },
  { label: "Analyzing", value: "ANALYZING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
  { label: "Archived", value: "ARCHIVED" },
];

function statusBadgeVariant(status: ProjectStatus) {
  switch (status) {
    case "COMPLETED":
      return "success" as const;
    case "FAILED":
      return "destructive" as const;
    case "ANALYZING":
      return "warning" as const;
    case "UPLOADING":
      return "info" as const;
    case "ARCHIVED":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

function ProjectCard({ project }: { project: Project }) {
  const primaryLang = project.language?.[0] ?? "code";
  const sizeNumber = typeof project.size === "string" ? Number(project.size) : project.size ?? 0;
  const repoHost = useMemo(() => {
    try {
      return project.repositoryUrl ? new URL(project.repositoryUrl).host : null;
    } catch {
      return null;
    }
  }, [project.repositoryUrl]);

  const handleCardClick = () => {
    window.location.href = `/projects/${project.id}`;
  };

  return (
    <Card
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-orlixis cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-orlixis-teal/15 blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="transition-transform duration-200 group-hover:scale-110">
                <LanguageIcon language={primaryLang} />
              </span>
              <CardTitle className="text-lg truncate transition-colors duration-200 group-hover:text-foreground">{project.name}</CardTitle>
            </div>
            <CardDescription className="mt-1 line-clamp-2">
              {project.description || "No description provided."}
            </CardDescription>
          </div>
          <Badge variant={statusBadgeVariant(project.status)}
            blurred
            translucent
            className="shrink-0 capitalize">
            {project.status.toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2 truncate">
            <Layers className="h-4 w-4 text-orlixis-teal" />
            <span className="text-muted-foreground truncate">
              {project.language?.length ? project.language.join(", ") : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <GitBranch className="h-4 w-4 text-orlixis-teal" />
            <span className="text-muted-foreground truncate">{project.branch || "main"}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <Clock className="h-4 w-4 text-orlixis-teal" />
            <span className="text-muted-foreground truncate">
              Updated {formatRelativeTime(project.updatedAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <FolderOpen className="h-4 w-4 text-orlixis-teal" />
            <span className="text-muted-foreground truncate">{formatBytes(sizeNumber || 0)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
            {project.repositoryUrl ? (
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-orlixis-teal hover:underline truncate"
                title={project.repositoryUrl}
                onClick={(e) => e.stopPropagation()}
              >
                {repoHost || project.repositoryUrl}
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">No repository linked</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">Open</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("ALL");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(perPage));
      const res = await fetch(`/api/projects?${params.toString()}`, { cache: "no-store" });
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to load projects");
      }
      const data: ProjectsResponse = await res.json();
      setProjects(data.projects || []);
      setTotal(data.total || 0);
      setHasMore(Boolean(data.has_more));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetchProjects();
    }
  }, [status, fetchProjects, router]);

  const filtered = useMemo(() => {
    let list = projects.slice();

    if (statusFilter !== "ALL") {
      list = list.filter((p) => p.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.repositoryUrl || "").toLowerCase().includes(q) ||
          p.language?.some((l) => l.toLowerCase().includes(q)) ||
          p.framework?.some((f) => f.toLowerCase().includes(q))
      );
    }

    return list;
  }, [projects, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Loading state
  if (status === "loading" || (loading && projects.length === 0)) {
    return (
      <PageLayout
        title="Projects"
        description="Loading your projects..."
        breadcrumbItems={[
          { label: "Dashboard", href: "/", icon: Folder },
          { label: "Projects", href: "/projects", icon: Folder, isCurrentPage: true }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="loading-spinner h-9 w-9" />
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-sm bg-muted animate-pulse" />
                      <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Your Projects"
      description="Manage and track your audits with a clean, professional interface."
      breadcrumbItems={[
        { label: "Dashboard", href: "/", icon: Folder },
        { label: "Projects", href: "/projects", icon: Folder, isCurrentPage: true }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/projects" onClick={fetchProjects}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Link>
          </Button>
          <Button asChild className="gap-2 shadow-orlixis">
            <Link href="/projects/upload">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      }
    >

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1 min-w-[260px]">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, repo URL, language, or framework..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number]["value"])
                }
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {!loading && filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orlixis-teal/10">
              <FolderOpen className="h-6 w-6 text-orlixis-teal" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {projects.length === 0
                ? "You haven't created any projects yet."
                : "Try adjusting your search or filters to find what you need."}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button asChild>
                <Link href="/projects/upload">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first project
                </Link>
              </Button>
              <Button variant="outline" onClick={fetchProjects}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} • {total} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => (hasMore ? p + 1 : p))}
                  disabled={!hasMore}
                  className="gap-1"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Error Banner */}
      {!!error && (
        <div className="mt-6">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchProjects} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
