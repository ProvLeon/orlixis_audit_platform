import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

// POST: Initiate GitHub account linking for already signed-in users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Must be signed in to link accounts" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { callbackUrl } = body

    // Validate environment variables for account linking
    if (!process.env.GITHUB_LINK_CLIENT_ID || !process.env.GITHUB_LINK_CLIENT_SECRET || !process.env.NEXTAUTH_URL) {
      console.error("Missing required environment variables: GITHUB_LINK_CLIENT_ID, GITHUB_LINK_CLIENT_SECRET, or NEXTAUTH_URL")
      return NextResponse.json(
        { error: "Server configuration error - GitHub linking app not configured" },
        { status: 500 }
      )
    }

    // Check if user exists and GitHub is already linked
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const existingGithubAccount = user.accounts.find(acc => acc.provider === "github")

    if (existingGithubAccount) {
      return NextResponse.json(
        { error: "GitHub account is already linked to this user" },
        { status: 409 }
      )
    }

    // Generate GitHub OAuth URL for linking (not sign-in)
    const baseUrl = process.env.NEXTAUTH_URL || (
      process.env.NODE_ENV === 'production'
        ? 'https://yourdomain.com'
        : 'http://localhost:3000'
    )

    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize")
    githubAuthUrl.searchParams.set("client_id", process.env.GITHUB_LINK_CLIENT_ID)
    githubAuthUrl.searchParams.set("scope", "read:user user:email repo")

    // Use our custom linking callback endpoint
    githubAuthUrl.searchParams.set("redirect_uri", `${baseUrl}/api/auth/link-github/callback`)

    // Store linking context in state
    const linkingState = {
      action: "link",
      userId: user.id,
      userEmail: session.user.email,
      callbackUrl: callbackUrl || "/profile",
      timestamp: Date.now()
    }
    githubAuthUrl.searchParams.set("state", encodeURIComponent(JSON.stringify(linkingState)))

    console.log("Generated GitHub linking URL:", {
      userId: user.id,
      email: session.user.email,
      clientId: process.env.GITHUB_LINK_CLIENT_ID?.substring(0, 10) + "...",
      redirectUri: `${baseUrl}/api/auth/link-github/callback`,
      callbackUrl: callbackUrl || "/profile"
    })

    return NextResponse.json({
      authUrl: githubAuthUrl.toString(),
      message: "GitHub linking URL generated successfully"
    })

  } catch (error) {
    console.error("Error generating GitHub linking URL:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET: Check GitHub linking status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's linked accounts
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const githubAccount = user.accounts.find(acc => acc.provider === "github")

    return NextResponse.json({
      linked: !!githubAccount,
      account: githubAccount ? {
        id: githubAccount.id,
        provider: githubAccount.provider,
        providerAccountId: githubAccount.providerAccountId,
        scope: githubAccount.scope,
        hasAccessToken: !!githubAccount.access_token
      } : null
    })

  } catch (error) {
    console.error("Error checking GitHub link status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE: Unlink GitHub account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Find user and their GitHub account
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const githubAccount = user.accounts.find(acc => acc.provider === "github")

    if (!githubAccount) {
      return NextResponse.json(
        { error: "No GitHub account linked" },
        { status: 404 }
      )
    }

    // Remove the GitHub account
    await prisma.account.delete({
      where: { id: githubAccount.id }
    })

    console.log("GitHub account unlinked:", {
      userId: user.id,
      githubId: githubAccount.providerAccountId,
      email: session.user.email
    })

    return NextResponse.json({
      message: "GitHub account unlinked successfully"
    })

  } catch (error) {
    console.error("Error unlinking GitHub account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
