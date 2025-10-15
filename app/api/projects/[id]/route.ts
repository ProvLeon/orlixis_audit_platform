import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { Prisma, ProjectStatus } from "@prisma/client"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type UpdateProjectBody = {
  name?: string | null
  description?: string | null
  repositoryUrl?: string | null
  branch?: string | null
  language?: string[] | string | null
  framework?: string[] | string | null
  size?: number | string | null
  status?: ProjectStatus | string | null
}

/**
 * Utility: Ensure value is a string array
 */
function toStringArray(v: unknown): string[] | null {
  if (v == null) return null
  if (Array.isArray(v)) return v.map((x) => String(x))
  return [String(v)]
}

/**
 * Utility: Normalize project status to Prisma enum
 */
function normalizeStatus(v: unknown): ProjectStatus {
  if (v == null) return ProjectStatus.PENDING
  const allowed = Object.values(ProjectStatus) as string[]
  const s = String(v || "").toUpperCase()
  return allowed.includes(s) ? (s as ProjectStatus) : ProjectStatus.PENDING
}

/**
 * Utility: Safe BigInt serialization for JSON responses.
 * Converts all BigInt values to strings recursively.
 */
function serializeBigInt<T>(data: T): T {
  if (data === null || data === undefined) return data
  if (typeof data === "bigint") return (data.toString() as unknown) as T
  if (Array.isArray(data)) return (data.map(serializeBigInt) as unknown) as T
  if (typeof data === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      out[k] = serializeBigInt(v)
    }
    return (out as unknown) as T
  }
  return data
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
 * GET /api/projects/[id]
 * Returns a single project belonging to the authenticated user.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveUserIdFromSession(session)

    const project = await prisma.project.findFirst({
      where: { id, userId }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(serializeBigInt({ project }))
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error while fetching project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/projects/[id]
 * Updates an existing project belonging to the authenticated user.
 * Accepts partial updates.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = req.headers.get("content-type") || ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Invalid content-type. Use application/json." }, { status: 415 })
    }

    const userId = await resolveUserIdFromSession(session)

    // Ensure ownership before updating
    const existing = await prisma.project.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const body = (await req.json()) as UpdateProjectBody
    const data: Prisma.ProjectUpdateInput = {}

    if (body.name !== undefined) data.name = (body.name ?? "").toString().trim()
    if (body.description !== undefined) data.description = body.description ? body.description.toString() : null
    if (body.repositoryUrl !== undefined) data.repositoryUrl = body.repositoryUrl ? body.repositoryUrl.toString() : null
    if (body.branch !== undefined) data.branch = (body.branch ?? "").toString().trim()

    if (body.language !== undefined) {
      const arr = toStringArray(body.language)
      data.language = arr ?? []
    }
    if (body.framework !== undefined) {
      const arr = toStringArray(body.framework)
      data.framework = arr ?? []
    }

    if (body.status !== undefined) {
      data.status = normalizeStatus(body.status)
    }

    if (body.size !== undefined) {
      let sizeBigInt: bigint = 0n
      if (typeof body.size === "number") {
        sizeBigInt = BigInt(Math.max(0, Math.floor(body.size)))
      } else if (typeof body.size === "string" && body.size.trim().length > 0) {
        const asNum = Number(body.size)
        if (Number.isFinite(asNum)) {
          sizeBigInt = BigInt(Math.max(0, Math.floor(asNum)))
        } else {
          try {
            sizeBigInt = BigInt(body.size)
            if (sizeBigInt < 0n) sizeBigInt = 0n
          } catch {
            sizeBigInt = 0n
          }
        }
      }
      data.size = sizeBigInt
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json(serializeBigInt({ project: updated }))
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: `${err.code}: ${err.message}` }, { status: 400 })
    }
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error while updating project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/projects/[id]
 * Deletes a project belonging to the authenticated user.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveUserIdFromSession(session)

    // Ensure the project exists and belongs to the user
    const existing = await prisma.project.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    await prisma.project.delete({
      where: { id: params.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: `${err.code}: ${err.message}` }, { status: 400 })
    }
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error while deleting project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
