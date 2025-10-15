import React from "react"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { ProjectDetailsClient } from "./project-details-client"
import { VulnerabilitySeverity } from "@prisma/client"

export const dynamic = "force-dynamic"

export default async function ProjectDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session?.user) {
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
    const image = (session.user as { image?: string }).image || null

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
      userId: true
    }
  })

  if (!project) {
    notFound()
  }

  const [reports, scans, files, totalFiles, totalReports, totalScans, vulnGroups] = await Promise.all([
    prisma.report.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.scan.findMany({
      where: { projectId: project.id },
      orderBy: { startedAt: "desc" },
      take: 5
    }),
    prisma.projectFile.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.projectFile.count({ where: { projectId: project.id } }),
    prisma.report.count({ where: { projectId: project.id } }),
    prisma.scan.count({ where: { projectId: project.id } }),
    prisma.vulnerability.groupBy({
      by: ["severity"],
      where: { projectId: project.id },
      _count: { _all: true }
    }).catch(() => [])
  ])

  const vulnBySeverity: Partial<Record<VulnerabilitySeverity, number>> = {}
  for (const v of vulnGroups as { severity: VulnerabilitySeverity; _count: { _all: number } }[]) {
    vulnBySeverity[v.severity] = v._count._all
  }

  return (
    <ProjectDetailsClient
      project={project}
      reports={reports}
      scans={scans}
      files={files}
      filesCount={totalFiles}
      reportsCount={totalReports}
      scansCount={totalScans}
      vulnBySeverity={vulnBySeverity}
    />
  )
}
