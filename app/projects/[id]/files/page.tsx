import React from "react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import {
  ArrowLeft,
  FolderOpen,
  FileText,
  Code2,
  Search,
  Filter,
  Download,
  ExternalLink,
  AlertTriangle,
  Shield,
  Layers
} from "lucide-react"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileNode } from "@/components/ui/file-tree"
import { FilesClient } from "./files-client"
import { FetchGitHubFilesButton } from "@/components/fetch-github-files-button"
import { cn, formatBytes, formatDateTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

// Helper function to build file tree from flat file structure
function buildFileTree(files: any[]): FileNode[] {
  const tree: FileNode[] = []
  const pathMap = new Map<string, FileNode>()

  // Sort files by path to ensure proper tree construction
  const sortedFiles = files.sort((a, b) => a.path.localeCompare(b.path))

  for (const file of sortedFiles) {
    const pathParts = file.path.split('/').filter(part => part.length > 0)
    let currentPath = ''
    let currentLevel = tree

    // Create directory structure
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part

      let dirNode = pathMap.get(currentPath)
      if (!dirNode) {
        dirNode = {
          id: `dir-${currentPath}`,
          name: part,
          path: currentPath,
          type: "directory",
          children: []
        }
        pathMap.set(currentPath, dirNode)
        currentLevel.push(dirNode)
      }

      currentLevel = dirNode.children!
    }

    // Add the file
    const fileName = pathParts[pathParts.length - 1]
    const fileNode: FileNode = {
      id: file.id,
      name: fileName,
      path: file.path,
      type: "file",
      size: file.size,
      language: file.language,
      content: file.content,
      createdAt: file.createdAt,
      vulnerabilities: file._count?.vulnerabilities || 0
    }

    currentLevel.push(fileNode)
  }

  return tree
}

export default async function ProjectFilesPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ open?: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  let resolvedUserId = (session.user.id || "").trim()

  try {
    if (!resolvedUserId) {
      throw new Error("Missing session user id")
    }
    const existingById = await prisma.user.findUnique({ where: { id: resolvedUserId } })
    if (!existingById) {
      throw new Error("User not found by id")
    }
  } catch {
    const email = (session.user.email || "").trim()
    const name = session.user.name || null
    const image = (session.user as any).image || null

    if (!email) {
      redirect("/auth/signin")
    }

    const upserted = await prisma.user.upsert({
      where: { email },
      update: {
        name: name || undefined,
        image: image || undefined
      },
      create: {
        email,
        name,
        image
      }
    })
    resolvedUserId = upserted.id
  }

  const project = await prisma.project.findFirst({
    where: { id, userId: resolvedUserId },
  })

  if (!project) {
    notFound()
  }

  // Fetch project files with vulnerability counts
  const files = await prisma.projectFile.findMany({
    where: { projectId: project.id },
    include: {
      _count: {
        select: {
          vulnerabilities: true
        }
      }
    },
    orderBy: { path: "asc" }
  })

  // Get project statistics
  const [totalVulnerabilities, criticalVulns, highVulns, languageStats] = await Promise.all([
    prisma.vulnerability.count({
      where: { projectId: project.id }
    }),
    prisma.vulnerability.count({
      where: { projectId: project.id, severity: "CRITICAL" }
    }),
    prisma.vulnerability.count({
      where: { projectId: project.id, severity: "HIGH" }
    }),
    prisma.projectFile.groupBy({
      by: ["language"],
      where: { projectId: project.id, language: { not: null } },
      _count: { _all: true }
    })
  ])

  const fileTree = buildFileTree(files)
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const uniqueLanguages = new Set(files.map(f => f.language).filter(Boolean))

  // Read query param for an initial file to open (e.g., /projects/[id]/files?open=FILE_ID)
  let openFileId: string | undefined
  try {
    const sp = await (searchParams as any)
    openFileId = sp?.open as string | undefined
  } catch {
    openFileId = undefined
  }

  // Prepare an initial viewer payload if a file is specified
  const initialViewerFile = openFileId
    ? (() => {
      const target = files.find((f) => f.id === openFileId)
      if (!target) return null
      const parts = (target.path || target.filename || "").split("/")
      const name = parts[parts.length - 1] || target.filename || "file"
      return {
        id: target.id,
        name,
        path: target.path,
        content: target.content,
        language: target.language,
        size: target.size,
        vulnerabilities: []
      }
    })()
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Header />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Button>
          </Link>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">Project Files & Directory Structure</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            {project.repositoryUrl?.includes('github.com') && (
              <FetchGitHubFilesButton
                projectId={project.id}
                repositoryUrl={project.repositoryUrl}
                hasFiles={files.length > 0}
                variant="outline"
                className="gap-2"
              />
            )}
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Repository
            </Button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {files.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Files</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatBytes(totalSize)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Size</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {uniqueLanguages.size}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Languages</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {totalVulnerabilities}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Issues</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {criticalVulns}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Critical</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500 dark:text-red-400">
                {highVulns}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">High Risk</div>
            </CardContent>
          </Card>
        </div>

        {/* Language Distribution */}
        {languageStats.length > 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Language Distribution
              </CardTitle>
              <CardDescription>
                Files breakdown by programming language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {languageStats.map((stat) => (
                  <Badge
                    key={stat.language}
                    variant="secondary"
                    className="px-3 py-1"
                  >
                    {stat.language}: {stat._count._all} files
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Overview */}
        {totalVulnerabilities > 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Overview
              </CardTitle>
              <CardDescription>
                Security issues found in project files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">
                    {totalVulnerabilities} security issues found across {files.filter(f => f._count.vulnerabilities > 0).length} files
                  </span>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">
                  View Security Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Tree */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border-0 shadow-lg">
          <FilesClient
            files={fileTree}
            projectId={project.id}
            projectName={project.name}
            repositoryUrl={project.repositoryUrl}
            initialViewerFile={initialViewerFile}
          />
        </div>

        {/* Project Information Footer */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Project Details</h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <div>Created: {formatDateTime(project.createdAt)}</div>
                  <div>Last Updated: {formatDateTime(project.updatedAt)}</div>
                  <div>Status: <Badge variant="outline">{project.status}</Badge></div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Repository</h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  {project.repositoryUrl ? (
                    <div>
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center gap-1"
                      >
                        View Repository <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <div>No repository linked</div>
                  )}
                  <div>Branch: {project.branch || "main"}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Technologies</h3>
                <div className="space-y-2">
                  {project.framework.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.framework.map((fw) => (
                        <Badge key={fw} variant="outline" className="text-xs">
                          {fw}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {project.language.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.language.map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
