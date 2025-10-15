import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user from database with GitHub account
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: {
            provider: "github"
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const githubAccount = user.accounts.find(acc => acc.provider === "github")

    if (!githubAccount || !githubAccount.access_token) {
      return NextResponse.json(
        { error: "GitHub account not connected or access token not available" },
        { status: 404 }
      )
    }

    // Fetch GitHub profile using the access token
    const githubResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${githubAccount.access_token}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Orlixis-Audit-Platform"
      }
    })

    if (!githubResponse.ok) {
      console.error("GitHub API error:", githubResponse.status, githubResponse.statusText)

      // If token is expired or invalid, we might need to refresh it
      if (githubResponse.status === 401) {
        return NextResponse.json(
          { error: "GitHub access token expired. Please reconnect your account." },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: "Failed to fetch GitHub profile" },
        { status: 500 }
      )
    }

    const githubProfile = await githubResponse.json()

    // Return sanitized profile data
    return NextResponse.json({
      profile: {
        login: githubProfile.login,
        id: githubProfile.id,
        avatar_url: githubProfile.avatar_url,
        name: githubProfile.name,
        company: githubProfile.company,
        blog: githubProfile.blog,
        location: githubProfile.location,
        email: githubProfile.email,
        bio: githubProfile.bio,
        public_repos: githubProfile.public_repos,
        public_gists: githubProfile.public_gists,
        followers: githubProfile.followers,
        following: githubProfile.following,
        created_at: githubProfile.created_at,
        updated_at: githubProfile.updated_at
      }
    })

  } catch (error) {
    console.error("Error fetching GitHub profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
