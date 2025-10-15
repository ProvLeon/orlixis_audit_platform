import { analysisEngine } from "@/lib/analysis/engine"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { ScanStatus, ScanType } from "@prisma/client"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type CreateScanBody = {
  projectId: string
  type?: ScanType | string
  config?: Record<string, unknown>
}

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
 * Normalize scan type to Prisma enum
 */
function normalizeScanType(v: unknown): ScanType {
  const allowed = Object.values(ScanType) as string[]
  const s = String(v || "").toUpperCase()
  return allowed.includes(s) ? (s as ScanType) : ScanType.COMPREHENSIVE
}

/**
 * GET /api/scans
 * Returns scans for the authenticated user, optionally filtered by projectId
 * Query params: projectId (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")
    const userId = await resolveUserIdFromSession(session)

    const whereClause: any = {
      project: { userId }
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    const scans = await prisma.scan.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            vulnerabilities: true
          }
        }
      },
      orderBy: { startedAt: "desc" },
      take: 20
    })

    return NextResponse.json({
      scans: scans.map(scan => ({
        ...scan,
        vulnerabilityCount: scan._count.vulnerabilities
      }))
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error while fetching scans"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/scans
 * Creates a new scan for a project belonging to the authenticated user.
 * Body: {
 *   projectId: string (required)
 *   type?: ScanType (default "COMPREHENSIVE")
 *   config?: object
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = req.headers.get("content-type") || ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Invalid content-type. Use application/json." }, { status: 415 })
    }

    const body = (await req.json()) as CreateScanBody
    const projectId = (body.projectId || "").toString().trim()
    if (!projectId) {
      return NextResponse.json({ error: "Field 'projectId' is required." }, { status: 400 })
    }

    const userId = await resolveUserIdFromSession(session)

    // Ensure the project exists and belongs to the user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    })
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 })
    }

    const type = normalizeScanType(body.type)
    const config = body.config || {}

    // Create the scan
    const scan = await prisma.scan.create({
      data: {
        type,
        status: ScanStatus.PENDING,
        config,
        projectId
      }
    })

    console.log(`Created scan ${scan.id} for project ${projectId}`)

    // Update project status to ANALYZING
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "ANALYZING" }
    })

    // Start analysis in background with proper error handling
    process.nextTick(async () => {
      try {
        console.log(`Starting background analysis for scan ${scan.id}`)
        await analysisEngine.startAnalysis(scan.id)
        console.log(`Background analysis completed for scan ${scan.id}`)
      } catch (err) {
        console.error(`Background analysis failed for scan ${scan.id}:`, err)

        // Update scan status to failed
        try {
          await prisma.scan.update({
            where: { id: scan.id },
            data: {
              status: ScanStatus.FAILED,
              error: err instanceof Error ? err.message : "Unknown error",
              progress: 0
            }
          })

          await prisma.project.update({
            where: { id: projectId },
            data: { status: "FAILED" }
          })
        } catch (updateErr) {
          console.error("Failed to update scan status after error:", updateErr)
        }
      }
    })

    return NextResponse.json({ scan }, { status: 201 })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error while creating scan"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
