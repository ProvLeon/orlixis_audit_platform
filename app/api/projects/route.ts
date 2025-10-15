import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { Prisma, ProjectStatus } from "@prisma/client"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type CreateProjectBody = {
  name?: string
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
 * Utility: parse number param with bounds
 */
function getNumberParam(url: URL, key: string, fallback: number, { min, max }: { min?: number; max?: number } = {}) {
  const raw = url.searchParams.get(key)
  if (!raw) return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  let out = n
  if (min !== undefined) out = Math.max(min, out)
  if (max !== undefined) out = Math.min(max, out)
  return out
}

/**
 * GET /api/projects
 * Returns the authenticated user's projects (paginated).
 * Query params: page (default 1), per_page (default 20)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = getNumberParam(url, "page", 1, { min: 1 })
    const perPage = getNumberParam(url, "per_page", 20, { min: 1, max: 100 })
    const skip = (page - 1) * perPage
    const take = perPage

    // Resolve a stable database user id for filtering
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
        return NextResponse.json(
          { error: "Authenticated user not found in DB and email is missing to resolve user." },
          { status: 400 }
        )
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

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId: resolvedUserId },
        orderBy: { updatedAt: "desc" },
        skip,
        take
      }),
      prisma.project.count({
        where: { userId: resolvedUserId }
      })
    ])

    const payload = serializeBigInt({
      projects,
      page,
      per_page: perPage,
      total,
      has_more: page * perPage < total
    })

    return NextResponse.json(payload)
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error while fetching projects"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/projects
 * Creates a new project record tied to the authenticated user.
 * Body: {
 *   name: string (required)
 *   description?: string
 *   repositoryUrl?: string
 *   branch?: string (default "main")
 *   language?: string | string[]
 *   framework?: string | string[]
 *   size?: number | string
 *   status?: ProjectStatus
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

    const body = (await req.json()) as CreateProjectBody
    const name = (body.name || "").toString().trim()
    if (!name) {
      return NextResponse.json({ error: "Field 'name' is required." }, { status: 400 })
    }

    const description = body.description?.toString() || null
    const repositoryUrl = body.repositoryUrl?.toString() || null
    const branch = (body.branch?.toString() || "main").trim()
    const language = toStringArray(body.language)
    const framework = toStringArray(body.framework)
    const status = normalizeStatus(body.status)

    let sizeBigInt: bigint = 0n
    if (typeof body.size === "number") {
      sizeBigInt = BigInt(Math.max(0, Math.floor(body.size)))
    } else if (typeof body.size === "string" && body.size.trim().length > 0) {
      // Attempt to parse number-like strings
      const asNum = Number(body.size)
      if (Number.isFinite(asNum)) {
        sizeBigInt = BigInt(Math.max(0, Math.floor(asNum)))
      } else {
        // Fallback if it's an integer-like string beyond Number range
        try {
          sizeBigInt = BigInt(body.size)
          if (sizeBigInt < 0n) sizeBigInt = 0n
        } catch {
          sizeBigInt = 0n
        }
      }
    }

    // Ensure the user exists in the database and resolve a valid FK id
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
        return NextResponse.json(
          { error: "Authenticated user not found in DB and email is missing to create one." },
          { status: 400 }
        )
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

    const created = await prisma.project.create({
      data: {
        name,
        description,
        repositoryUrl,
        branch,
        language: language ?? [],
        framework: framework ?? [],
        size: sizeBigInt,
        status,
        userId: resolvedUserId
      }
    })

    return NextResponse.json(serializeBigInt({ project: created }), { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle common constraint errors
      return NextResponse.json({ error: `${err.code}: ${err.message}` }, { status: 400 })
    }
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error while creating project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
