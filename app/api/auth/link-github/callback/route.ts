import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Verify that user is still signed in
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.redirect(new URL("/auth/signin?error=SessionExpired", request.url))
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Handle OAuth errors
    if (error) {
      console.error("GitHub OAuth error:", error)
      const errorDescription = searchParams.get("error_description") || "GitHub authentication failed"
      return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(errorDescription)}`, request.url))
    }

    if (!code || !state) {
      console.error("Missing OAuth code or state parameter")
      return NextResponse.redirect(new URL("/profile?error=InvalidOAuthResponse", request.url))
    }

    // Parse and validate state
    let linkingState
    try {
      linkingState = JSON.parse(decodeURIComponent(state))
    } catch (e) {
      console.error("Invalid state parameter:", e)
      return NextResponse.redirect(new URL("/profile?error=InvalidState", request.url))
    }

    if (linkingState.action !== "link" || !linkingState.userId || !linkingState.userEmail) {
      console.error("Invalid linking state:", linkingState)
      return NextResponse.redirect(new URL("/profile?error=InvalidLinkingState", request.url))
    }

    // Verify the state matches current session
    if (linkingState.userEmail !== session.user.email) {
      console.error("State email mismatch:", {
        stateEmail: linkingState.userEmail,
        sessionEmail: session.user.email
      })
      return NextResponse.redirect(new URL("/profile?error=SessionMismatch", request.url))
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Orlixis-Audit-Platform"
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_LINK_CLIENT_ID,
        client_secret: process.env.GITHUB_LINK_CLIENT_SECRET,
        code: code
      })
    })

    if (!tokenResponse.ok) {
      console.error("Failed to exchange OAuth code:", tokenResponse.status, tokenResponse.statusText)
      return NextResponse.redirect(new URL("/profile?error=TokenExchangeFailed", request.url))
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error("GitHub token error:", tokenData.error_description || tokenData.error)
      return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(tokenData.error_description || "TokenError")}`, request.url))
    }

    // Get GitHub user information
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Orlixis-Audit-Platform"
      }
    })

    if (!userResponse.ok) {
      console.error("Failed to fetch GitHub user info:", userResponse.status, userResponse.statusText)
      return NextResponse.redirect(new URL("/profile?error=GitHubUserFetchFailed", request.url))
    }

    const githubUser = await userResponse.json()

    // Find the current user in database
    const user = await prisma.user.findUnique({
      where: { id: linkingState.userId },
      include: { accounts: true }
    })

    if (!user) {
      console.error("User not found for linking:", linkingState.userId)
      return NextResponse.redirect(new URL("/profile?error=UserNotFound", request.url))
    }

    // Check if GitHub account is already linked to this user
    const existingGithubAccount = user.accounts.find(acc => acc.provider === "github")

    if (existingGithubAccount) {
      console.log("GitHub account already linked to user:", user.id)
      return NextResponse.redirect(new URL(`${linkingState.callbackUrl}?github_linked=already_linked`, request.url))
    }

    // Check if this GitHub account is linked to a different user
    const conflictingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: String(githubUser.id)
        }
      }
    })

    if (conflictingAccount) {
      console.error("GitHub account already linked to different user:", {
        githubId: githubUser.id,
        existingUserId: conflictingAccount.userId,
        currentUserId: user.id
      })
      return NextResponse.redirect(new URL("/profile?error=GitHubAccountAlreadyLinked", request.url))
    }

    // Link the GitHub account to the current user
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "oauth",
        provider: "github",
        providerAccountId: String(githubUser.id),
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in ? Math.floor(Date.now() / 1000) + tokenData.expires_in : null,
        token_type: tokenData.token_type || "bearer",
        scope: tokenData.scope
      }
    })

    console.log("GitHub account linked successfully:", {
      userId: user.id,
      userEmail: user.email,
      githubId: githubUser.id,
      githubLogin: githubUser.login,
      scope: tokenData.scope
    })

    // Redirect back to the callback URL with success parameter
    const redirectUrl = `${linkingState.callbackUrl}?github_linked=success`
    return NextResponse.redirect(new URL(redirectUrl, request.url))

  } catch (error) {
    console.error("Error in GitHub account linking callback:", error)
    return NextResponse.redirect(new URL("/profile?error=LinkingFailed", request.url))
  }
}
