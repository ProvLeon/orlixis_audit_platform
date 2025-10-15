import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { Octokit } from "@octokit/rest"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type RepoOut = {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
  html_url: string
  clone_url: string
  ssh_url: string
  default_branch: string
  language: string | null
  updated_at: string
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
  permissions?: {
    admin?: boolean
    maintain?: boolean
    push?: boolean
    triage?: boolean
    pull?: boolean
  }
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

export async function GET(req: NextRequest) {
  try {
    console.log("GitHub repositories API called")

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log("No session or user email")
      return NextResponse.json(
        { error: "Unauthorized: No active session" },
        { status: 401 }
      )
    }

    console.log("Session user:", session.user.email)

    // Get user and their linked accounts
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

    console.log("User found:", !!user, "GitHub accounts:", user?.accounts?.length || 0)

    if (!user) {
      console.log("User not found in database")
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const githubAccount = user.accounts[0]
    console.log("GitHub account:", {
      exists: !!githubAccount,
      hasToken: !!githubAccount?.access_token,
      expiresAt: githubAccount?.expires_at
    })

    if (!githubAccount || !githubAccount.access_token) {
      console.log("No GitHub account or access token missing")
      return NextResponse.json(
        { error: "GitHub account not linked or access token missing. Please link your GitHub account first." },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (githubAccount.expires_at && githubAccount.expires_at * 1000 < Date.now()) {
      console.log("GitHub token expired")
      return NextResponse.json(
        { error: "GitHub access token has expired. Please re-link your GitHub account." },
        { status: 401 }
      )
    }

    const accessToken = githubAccount.access_token
    console.log("Using GitHub token:", accessToken?.substring(0, 10) + "...")

    const octokit = new Octokit({ auth: accessToken })

    // Query params for flexibility
    const q = req.nextUrl.searchParams.get("q")?.trim() || ""
    const org = req.nextUrl.searchParams.get("org")?.trim() || ""
    const visibility =
      req.nextUrl.searchParams.get("visibility")?.trim() || undefined // all, public, private
    const affiliation =
      req.nextUrl.searchParams.get("affiliation")?.trim() || undefined // owner, collaborator, organization_member
    const sort = req.nextUrl.searchParams.get("sort")?.trim() || undefined // created, updated, pushed, full_name
    const direction =
      req.nextUrl.searchParams.get("direction")?.trim() || undefined // asc, desc

    // Pagination
    const per_page = getNumberParam(req, "per_page", 50, { min: 1, max: 100 })
    const page = getNumberParam(req, "page", 1, { min: 1 })

    let repositories: RepoOut[] = []
    let total_count: number | undefined = undefined

    if (q) {
      // Use Search API scoped to the authenticated user login for better filtering
      const me = await octokit.users.getAuthenticated()
      const login = me.data.login

      const searchQuery = `user:${login} ${q} in:name fork:true`
      const search = await octokit.search.repos({
        q: searchQuery,
        per_page,
        page,
        sort: sort as any, // GitHub accepts "stars", "forks", "help-wanted-issues", "updated" for search
        order: (direction as any) || "desc",
      })

      total_count = search.data.total_count
      repositories = search.data.items.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private: r.private || false,
        description: r.description,
        html_url: r.html_url,
        clone_url: r.clone_url,
        ssh_url: r.ssh_url || "",
        default_branch: r.default_branch || "main",
        language: r.language,
        updated_at: r.updated_at || r.pushed_at || r.created_at || "",
        owner: {
          login: r.owner?.login || "",
          avatar_url: (r.owner as any)?.avatar_url || "",
          html_url: (r.owner as any)?.html_url || "",
        },
        permissions: (r as any).permissions,
      }))
    } else if (org) {
      // List repositories for a specific organization
      const resp = await octokit.repos.listForOrg({
        org,
        type: "all",
        per_page,
        page,
      })
      repositories = resp.data.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private: r.private || false,
        description: r.description,
        html_url: r.html_url,
        clone_url: r.clone_url,
        ssh_url: r.ssh_url || "",
        default_branch: r.default_branch || "main",
        language: r.language,
        updated_at: r.updated_at || r.pushed_at || r.created_at || "",
        owner: {
          login: r.owner?.login || "",
          avatar_url: (r.owner as any)?.avatar_url || "",
          html_url: (r.owner as any)?.html_url || "",
        },
        permissions: (r as any).permissions,
      }))
    } else {
      // Default: list repositories the authenticated user has access to
      const resp = await octokit.repos.listForAuthenticatedUser({
        per_page,
        page,
        visibility: visibility as any, // undefined means all
        affiliation: affiliation as any, // undefined means owner,collaborator,organization_member
        sort: sort as any,
        direction: direction as any,
      })

      repositories = resp.data.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private: r.private || false,
        description: r.description,
        html_url: r.html_url,
        clone_url: r.clone_url,
        ssh_url: r.ssh_url || "",
        default_branch: r.default_branch || "main",
        language: r.language,
        updated_at: r.updated_at || r.pushed_at || r.created_at || "",
        owner: {
          login: r.owner?.login || "",
          avatar_url: (r.owner as any)?.avatar_url || "",
          html_url: (r.owner as any)?.html_url || "",
        },
        permissions: (r as any).permissions,
      }))
    }

    console.log("Successfully fetched repositories:", repositories.length)

    return NextResponse.json({
      repositories,
      page,
      per_page,
      total_count,
      has_more: total_count ? page * per_page < total_count : repositories.length === per_page,
    })
  } catch (error: any) {
    console.error("GitHub repositories API error:", {
      status: error?.status,
      message: error?.message,
      response: error?.response?.data,
      stack: error?.stack
    })

    // Normalize GitHub/Octokit errors
    const status = error?.status || 500
    const message =
      error?.message ||
      error?.toString?.() ||
      "Unexpected error while fetching GitHub repositories"

    // Avoid leaking sensitive data in responses
    return NextResponse.json(
      {
        error: message,
        debug: process.env.NODE_ENV === 'development' ? {
          status: error?.status,
          githubError: error?.response?.data
        } : undefined
      },
      { status }
    )
  }
}
