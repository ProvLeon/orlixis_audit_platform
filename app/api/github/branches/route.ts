import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { Octokit } from "@octokit/rest"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type BranchOut = {
  name: string
  protected: boolean
  commitSha: string
  commitUrl: string
}

function getNumberParam(
  req: NextRequest,
  key: string,
  fallback: number,
  { min, max }: { min?: number; max?: number } = {}
) {
  const raw = req.nextUrl.searchParams.get(key)
  if (!raw) return fallback
  const n = Number(raw)
  if (Number.isNaN(n)) return fallback
  if (min !== undefined && n < min) return min
  if (max !== undefined && n > max) return max
  return n
}

function getBoolParam(req: NextRequest, key: string): boolean | undefined {
  const raw = req.nextUrl.searchParams.get(key)
  if (raw === null) return undefined
  const v = raw.trim().toLowerCase()
  if (["1", "true", "yes", "on"].includes(v)) return true
  if (["0", "false", "no", "off"].includes(v)) return false
  return undefined
}

function parseOwnerRepo(req: NextRequest): { owner?: string; repo?: string; error?: string } {
  // Accept either:
  // - full_name=owner/repo
  // - repo=owner/repo
  // - owner=<owner>&repo=<repo>
  const fullName = req.nextUrl.searchParams.get("full_name") || req.nextUrl.searchParams.get("repo") || ""
  const ownerParam = req.nextUrl.searchParams.get("owner") || ""
  const repoParam = req.nextUrl.searchParams.get("repo_name") || req.nextUrl.searchParams.get("name") || ""

  if (fullName && fullName.includes("/")) {
    const [owner, repo] = fullName.split("/", 2)
    if (!owner || !repo) return { error: "Invalid full_name format. Expected 'owner/repo'." }
    return { owner, repo }
  }

  if (ownerParam && repoParam) {
    return { owner: ownerParam, repo: repoParam }
  }

  return { error: "Missing repository identification. Provide full_name=owner/repo or owner & repo_name." }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized: No active session" }, { status: 401 })
    }

    // Get user and their linked GitHub account
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: "github" },
          select: {
            access_token: true,
            expires_at: true,
            refresh_token: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const githubAccount = user.accounts[0]
    if (!githubAccount || !githubAccount.access_token) {
      return NextResponse.json({ error: "GitHub account not linked or access token missing. Please link your GitHub account first." }, { status: 400 })
    }

    // Check if token is expired
    if (githubAccount.expires_at && githubAccount.expires_at * 1000 < Date.now()) {
      return NextResponse.json({ error: "GitHub access token has expired. Please re-link your GitHub account." }, { status: 401 })
    }

    const accessToken = githubAccount.access_token

    const { owner, repo, error } = parseOwnerRepo(req)
    if (error || !owner || !repo) {
      return NextResponse.json({ error: error || "owner/repo is required" }, { status: 400 })
    }

    const octokit = new Octokit({ auth: accessToken })

    const per_page = getNumberParam(req, "per_page", 50, { min: 1, max: 100 })
    const page = getNumberParam(req, "page", 1, { min: 1 })
    const protectedFilter = getBoolParam(req, "protected")
    const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || ""

    // GitHub supports an optional `protected` filter
    const listParams: {
      owner: string
      repo: string
      per_page: number
      page: number
      protected?: boolean
    } = { owner, repo, per_page, page }

    if (typeof protectedFilter === "boolean") {
      listParams.protected = protectedFilter
    }

    const resp = await octokit.repos.listBranches(listParams)

    let branches: BranchOut[] = resp.data.map((b) => ({
      name: b.name,
      protected: Boolean(b.protected),
      commitSha: (b.commit as any)?.sha || "",
      commitUrl: (b.commit as any)?.url || ""
    }))

    if (q) {
      branches = branches.filter((b) => b.name.toLowerCase().includes(q))
    }

    // We cannot reliably know total_count without additional calls.
    // Provide has_more heuristic based on page size.
    const has_more = branches.length === per_page

    return NextResponse.json({
      owner,
      repo,
      branches,
      page,
      per_page,
      has_more
    })
  } catch (error: any) {
    const status = error?.status || 500
    const message =
      error?.message ||
      error?.toString?.() ||
      "Unexpected error while fetching GitHub branches"
    return NextResponse.json({ error: message }, { status })
  }
}
