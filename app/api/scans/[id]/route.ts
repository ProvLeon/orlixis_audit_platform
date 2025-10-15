import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Resolve a stable DB user id based on the session.
 * Attempts to use session.user.id; if not present in DB, upserts by email.
 */
async function resolveUserIdFromSession(session: any): Promise<string> {
  let resolvedUserId = (session?.user?.id || "").trim()
  try {
    if (!resolvedUserId) {
      throw new Error("Missing session user id")
    }
    const existingById = await prisma.user.findUnique({ where: { id: resolvedUserId } })
    if (!existingById) {
      throw new Error("User not found by id")
    }
    return resolvedUserId
  } catch {
    const email = (session?.user?.email || "").trim()
    const name = session?.user?.name || null
    const image = (session?.user as any)?.image || null

    if (!email) {
      throw new Error("Authenticated user not found in DB and email is missing to resolve user.")
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
    return resolvedUserId
  }
}

/**
 * GET /api/scans/[id]
 * Returns scan progress and details for the authenticated user
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveUserIdFromSession(session)

    // Get scan with project ownership check
    const scan = await prisma.scan.findFirst({
      where: {
        id,
        project: { userId }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        vulnerabilities: {
          select: {
            id: true,
            severity: true,
            category: true,
            status: true
          }
        }
      }
    })

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 })
    }

    // Calculate vulnerability summary
    const vulnerabilitySummary = {
      total: scan.vulnerabilities.length,
      critical: scan.vulnerabilities.filter(v => v.severity === "CRITICAL").length,
      high: scan.vulnerabilities.filter(v => v.severity === "HIGH").length,
      medium: scan.vulnerabilities.filter(v => v.severity === "MEDIUM").length,
      low: scan.vulnerabilities.filter(v => v.severity === "LOW").length,
      info: scan.vulnerabilities.filter(v => v.severity === "INFO").length,
      open: scan.vulnerabilities.filter(v => v.status === "OPEN").length,
      resolved: scan.vulnerabilities.filter(v => v.status === "RESOLVED").length
    }

    // Calculate estimated completion time
    let estimatedCompletion = null
    if (scan.status === "RUNNING" && scan.startedAt) {
      const elapsed = Date.now() - scan.startedAt.getTime()
      const progressRatio = scan.progress || 1
      const totalEstimated = (elapsed / progressRatio) * 100
      const remaining = totalEstimated - elapsed
      estimatedCompletion = new Date(Date.now() + remaining)
    }

    const response = {
      scan: {
        id: scan.id,
        type: scan.type,
        status: scan.status,
        progress: scan.progress || 0,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
        error: scan.error,
        estimatedCompletion,
        project: scan.project
      },
      vulnerabilities: vulnerabilitySummary,
      config: scan.config || {}
    }

    return NextResponse.json(response)
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error while fetching scan"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/scans/[id]
 * Cancels or deletes a scan for the authenticated user
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveUserIdFromSession(session)

    // Check ownership
    const scan = await prisma.scan.findFirst({
      where: {
        id,
        project: { userId }
      }
    })

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 })
    }

    // If scan is running, mark as cancelled
    if (scan.status === "RUNNING" || scan.status === "PENDING") {
      await prisma.scan.update({
        where: { id },
        data: {
          status: "CANCELLED",
          completedAt: new Date(),
          error: "Cancelled by user"
        }
      })
    } else {
      // If completed/failed, delete the scan and associated vulnerabilities
      await prisma.vulnerability.deleteMany({
        where: { scanId: id }
      })

      await prisma.scan.delete({
        where: { id }
      })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error while deleting scan"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
