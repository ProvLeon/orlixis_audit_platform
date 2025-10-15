import React from "react"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { AnalysisClient } from "./analysis-client"

export const dynamic = "force-dynamic"

interface Props {
  params: { id: string }
}

export default async function AnalysisPage({ params }: Props) {
  const { id: projectId } = await params

  // Auth check
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Resolve user ID
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

  // Fetch project with authorization check
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: resolvedUserId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      language: true,
      framework: true,
      repositoryUrl: true,
      branch: true,
      size: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          files: true,
          reports: true,
          scans: true,
          vulnerabilities: true
        }
      }
    }
  })

  if (!project) {
    notFound()
  }

  // Fetch recent analysis data
  const [recentScans, recentReports, projectFiles, vulnerabilityStats] = await Promise.all([
    prisma.scan.findMany({
      where: { projectId },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        status: true,
        progress: true,
        startedAt: true,
        completedAt: true,
        error: true,
        results: true
      }
    }),
    prisma.report.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
        pdfUrl: true
      }
    }),
    prisma.projectFile.findMany({
      where: { projectId },
      select: {
        id: true,
        filename: true,
        path: true,
        language: true,
        size: true
      },
      take: 20 // Sample of files for analysis preview
    }),
    prisma.vulnerability.groupBy({
      by: ["severity"],
      where: { projectId },
      _count: { _all: true }
    }).catch(() => [])
  ])

  // Calculate tech stack from files
  const techStack = {
    languages: [...new Set(projectFiles.map(f => f.language).filter(Boolean))],
    frameworks: project.framework || [],
    totalFiles: project._count.files,
    codebaseSize: project.size ? Number(project.size) : 0
  }

  // Process vulnerability statistics
  const vulnStats = vulnerabilityStats.reduce((acc, stat) => {
    acc[stat.severity.toLowerCase()] = stat._count._all
    return acc
  }, {} as Record<string, number>)

  return (
    <AnalysisClient
      project={project}
      recentScans={recentScans}
      recentReports={recentReports}
      projectFiles={projectFiles}
      techStack={techStack}
      vulnerabilityStats={vulnStats}
      userId={resolvedUserId}
    />
  )
}
