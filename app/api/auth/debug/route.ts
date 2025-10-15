import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Get environment info (without exposing secrets)
    const envInfo = {
      hasGithubClientId: !!process.env.GITHUB_CLIENT_ID,
      hasGithubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
      hasGithubLinkClientId: !!process.env.GITHUB_LINK_CLIENT_ID,
      hasGithubLinkClientSecret: !!process.env.GITHUB_LINK_CLIENT_SECRET,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
      githubClientIdPrefix: process.env.GITHUB_CLIENT_ID?.substring(0, 8) + "...",
      githubLinkClientIdPrefix: process.env.GITHUB_LINK_CLIENT_ID?.substring(0, 8) + "...",
      googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 8) + "...",
    }

    // Check expected URLs
    const baseUrl = process.env.NEXTAUTH_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000')

    const expectedRedirectUris = {
      github: {
        signIn: `${baseUrl}/api/auth/callback/github`,
        linking: `${baseUrl}/api/auth/callback/github`
      },
      google: {
        signIn: `${baseUrl}/api/auth/callback/google`
      }
    }

    // Session info (without sensitive data)
    const sessionInfo = session ? {
      hasUser: !!session.user,
      userEmail: session.user?.email,
      userId: session.user?.id,
      hasAccessToken: !!(session as any).accessToken,
      provider: (session as any).provider
    } : null

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: envInfo,
      expectedRedirectUris,
      session: sessionInfo,
      requestUrl: request.url,
      userAgent: request.headers.get('user-agent'),
      instructions: {
        setup: "Make sure your GitHub OAuth app includes both redirect URIs",
        githubOAuthApp: "https://github.com/settings/developers",
        requiredEnvVars: [
          "NEXTAUTH_URL",
          "NEXTAUTH_SECRET",
          "GITHUB_CLIENT_ID",
          "GITHUB_CLIENT_SECRET",
          "GOOGLE_CLIENT_ID",
          "GOOGLE_CLIENT_SECRET"
        ]
      }
    }

    return NextResponse.json(debugInfo, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error("Debug endpoint error:", error)

    return NextResponse.json({
      error: "Debug endpoint failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === "test-github-linking") {
      const session = await getServerSession(authOptions)

      if (!session?.user?.email) {
        return NextResponse.json({ error: "Must be signed in to test linking" }, { status: 401 })
      }

      // Check current user accounts
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { accounts: true }
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const hasGithub = user.accounts.some(acc => acc.provider === 'github')
      const hasGoogle = user.accounts.some(acc => acc.provider === 'google')

      return NextResponse.json({
        currentUser: {
          id: user.id,
          email: user.email,
          linkedAccounts: user.accounts.map(acc => ({
            provider: acc.provider,
            providerAccountId: acc.providerAccountId
          }))
        },
        hasGithub,
        hasGoogle,
        canLinkGithub: !hasGithub,
        recommendation: !hasGithub
          ? "You can try linking GitHub using NextAuth signIn('github')"
          : "GitHub is already linked to this account"
      })
    }

    if (action === "test-github-auth") {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

      // Generate test GitHub OAuth URL for linking
      const githubAuthUrl = new URL("https://github.com/login/oauth/authorize")
      githubAuthUrl.searchParams.set("client_id", process.env.GITHUB_LINK_CLIENT_ID || "")
      githubAuthUrl.searchParams.set("scope", "read:user user:email repo")
      githubAuthUrl.searchParams.set("state", JSON.stringify({ callbackUrl: "/debug", linking: true }))
      githubAuthUrl.searchParams.set("redirect_uri", `${baseUrl}/api/auth/link-github/callback`)

      return NextResponse.json({
        testAuthUrl: githubAuthUrl.toString(),
        redirectUri: `${baseUrl}/api/auth/link-github/callback`,
        message: "Use this URL to test GitHub OAuth linking flow (uses separate OAuth app for account linking)"
      })
    }

    if (action === "validate-env") {
      const missing = []
      const required = [
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET',
        'GITHUB_CLIENT_ID',
        'GITHUB_CLIENT_SECRET',
        'GITHUB_LINK_CLIENT_ID',
        'GITHUB_LINK_CLIENT_SECRET',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
      ]

      required.forEach(envVar => {
        if (!process.env[envVar]) {
          missing.push(envVar)
        }
      })

      return NextResponse.json({
        valid: missing.length === 0,
        missing,
        message: missing.length === 0
          ? "All required environment variables are set"
          : `Missing environment variables: ${missing.join(', ')}`
      })
    }

    return NextResponse.json({
      error: "Invalid action",
      availableActions: ["test-github-linking", "test-github-auth", "validate-env"]
    }, { status: 400 })

  } catch (error) {
    console.error("Debug POST error:", error)

    return NextResponse.json({
      error: "Debug POST failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
