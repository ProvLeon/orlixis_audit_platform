import { authOptions } from "@/lib/auth/config"
import { GitHubClient } from "@/lib/github/client"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

// Debug endpoint to test token access
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let resolvedUserId = (session.user.id || "").trim()

    // Resolve user ID if needed
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
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
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

    // Verify project access
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: resolvedUserId }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get GitHub access token from session or fallback to linked account
    let accessToken = (session as any)?.accessToken as string | undefined
    console.log("Debug - Session token check:", {
      hasSessionToken: !!accessToken,
      sessionProvider: (session as any)?.provider,
      userId: resolvedUserId
    })

    if (!accessToken) {
      // Fallback: load token from linked GitHub account stored by NextAuth
      const githubAccount = await prisma.account.findFirst({
        where: { userId: resolvedUserId, provider: "github" }
      })
      console.log("Debug - GitHub account lookup:", {
        hasGitHubAccount: !!githubAccount,
        hasAccessToken: !!githubAccount?.access_token,
        accountId: githubAccount?.id,
        tokenLength: githubAccount?.access_token?.length,
        tokenPrefix: githubAccount?.access_token ? githubAccount.access_token.substring(0, 10) + "..." : null,
        expiresAt: githubAccount?.expires_at,
        isExpired: githubAccount?.expires_at ? Date.now() > githubAccount.expires_at * 1000 : null
      })
      if (githubAccount?.access_token) {
        accessToken = githubAccount.access_token
      }
    }

    return NextResponse.json({
      debug: true,
      project: {
        id: project.id,
        name: project.name,
        repositoryUrl: project.repositoryUrl
      },
      session: {
        provider: (session as any)?.provider,
        hasAccessToken: !!(session as any)?.accessToken,
        accessTokenLength: (session as any)?.accessToken?.length || 0
      },
      token_status: {
        finalTokenAvailable: !!accessToken,
        finalTokenLength: accessToken?.length || 0,
        finalTokenPrefix: accessToken ? accessToken.substring(0, 10) + "..." : null
      }
    })

  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let resolvedUserId = (session.user.id || "").trim()

    // Resolve user ID if needed
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
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
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

    // Verify project access
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: resolvedUserId }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if project has a GitHub repository URL
    if (!project.repositoryUrl || !project.repositoryUrl.includes('github.com')) {
      return NextResponse.json({
        error: "Project does not have a valid GitHub repository URL"
      }, { status: 400 })
    }

    // Get GitHub access token from session or fallback to linked account
    let accessToken = (session as any)?.accessToken as string | undefined
    console.log("Fetch files - checking access token sources:", {
      hasSessionToken: !!accessToken,
      sessionProvider: (session as any)?.provider,
      userId: resolvedUserId
    })

    if (!accessToken) {
      // Fallback: load token from linked GitHub account stored by NextAuth
      const githubAccount = await prisma.account.findFirst({
        where: { userId: resolvedUserId, provider: "github" }
      })
      console.log("Fetch files - GitHub account lookup:", {
        hasGitHubAccount: !!githubAccount,
        hasAccessToken: !!githubAccount?.access_token,
        accountId: githubAccount?.id,
        tokenLength: githubAccount?.access_token?.length
      })
      if (githubAccount?.access_token) {
        accessToken = githubAccount.access_token
      }
    }

    // Safety check: Skip obviously invalid tokens
    if (accessToken && (accessToken.startsWith("ghp_fake") || accessToken.length < 10 || accessToken === "undefined" || accessToken === "null")) {
      console.log("Detected invalid/test token, forcing public access")
      accessToken = undefined
    }

    // Additional validation: Check if token format looks valid
    if (accessToken && !accessToken.match(/^(ghp_|gho_|ghu_|ghs_|ghr_)/)) {
      console.log("Token doesn't match GitHub token format, forcing public access")
      accessToken = undefined
    }

    console.log("Fetch files - Using access token:", {
      hasToken: !!accessToken,
      tokenLength: accessToken?.length || 0,
      tokenPrefix: accessToken ? accessToken.substring(0, 10) + "..." : "none"
    })

    // Parse GitHub repo from URL
    const repoMatch = project.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!repoMatch) {
      return NextResponse.json({
        error: "Invalid GitHub repository URL format"
      }, { status: 400 })
    }

    const [, owner, repo] = repoMatch
    const cleanRepo = repo.replace('.git', '')
    const branch = project.branch || "main"

    // Update project status to indicate we're fetching files
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "UPLOADING" }
    })

    try {
      let repoInfo: any
      let repoFiles: any
      let githubClient: GitHubClient

      console.log("Starting repository file fetch process:", {
        owner,
        repo: cleanRepo,
        branch,
        hasAccessToken: !!accessToken,
        tokenLength: accessToken?.length || 0
      })

      if (accessToken) {
        // Try with authenticated access first
        console.log("Attempting authenticated GitHub access with token")
        try {
          console.log("Creating authenticated GitHubClient...")
          githubClient = new GitHubClient(accessToken)
          console.log("Making authenticated API calls...")

          // Test the token first
          const isValidToken = await githubClient.validateToken()
          if (!isValidToken) {
            console.log("❌ Token validation failed")
            throw new Error("Invalid token")
          }
          console.log("✅ Token validation successful")

          ;[repoInfo, repoFiles] = await Promise.all([
            githubClient.getRepositoryInfo(owner, cleanRepo, branch),
            githubClient.getRepositoryFiles(owner, cleanRepo, branch, 500)
          ])
          console.log("✅ Authenticated access succeeded", {
            filesFound: repoFiles.length,
            languages: repoInfo.languages
          })
        } catch (authError: any) {
          console.log("❌ Authenticated access failed:", {
            status: authError.status,
            message: authError.message,
            name: authError.name
          })

          if (authError.status === 401 || authError.message.includes("Bad credentials") || authError.message.includes("token")) {
            console.log("🔄 Token appears invalid, falling back to public access...")
            try {
              console.log("Creating unauthenticated GitHubClient...")
              githubClient = new GitHubClient("")
              console.log("Making unauthenticated API calls...")
              ;[repoInfo, repoFiles] = await Promise.all([
                githubClient.getRepositoryInfo(owner, cleanRepo, branch),
                githubClient.getRepositoryFiles(owner, cleanRepo, branch, 500)
              ])
              console.log("✅ Public access succeeded after auth failure", {
                filesFound: repoFiles.length,
                languages: repoInfo.languages
              })
            } catch (fallbackError: any) {
              console.log("❌ Public access fallback also failed:", {
                status: fallbackError.status,
                message: fallbackError.message,
                name: fallbackError.name
              })

              // If public access also fails with 401/404, the repository is likely private
              if (fallbackError.status === 401 || fallbackError.status === 404) {
                throw new Error(`Repository ${owner}/${cleanRepo} appears to be private and requires valid GitHub authentication. Please ensure you have access to this repository and try linking your GitHub account.`)
              }
              throw fallbackError
            }
          } else {
            console.log("❌ Non-auth error, not attempting fallback")
            throw authError
          }
        }
      } else {
        // Try public access for public repositories
        console.log("No access token provided, attempting public GitHub access")
        try {
          console.log("Creating unauthenticated GitHubClient...")
          githubClient = new GitHubClient("")
          console.log("Making unauthenticated API calls...")
          ;[repoInfo, repoFiles] = await Promise.all([
            githubClient.getRepositoryInfo(owner, cleanRepo, branch),
            githubClient.getRepositoryFiles(owner, cleanRepo, branch, 500)
          ])
          console.log("✅ Public access succeeded", {
            filesFound: repoFiles.length,
            languages: repoInfo.languages
          })
        } catch (publicError: any) {
          console.log("❌ Public access failed:", {
            status: publicError.status,
            message: publicError.message,
            name: publicError.name
          })

          if (publicError.status === 401 || publicError.status === 404) {
            return NextResponse.json({
              error: `Repository ${owner}/${cleanRepo} appears to be private or does not exist. Please ensure the repository URL is correct and you have access to it. If it's a private repository, please link your GitHub account in Profile and try again.`
            }, { status: 401 })
          }
          throw publicError
        }
      }

      // Clear existing files if any
      await prisma.projectFile.deleteMany({
        where: { projectId: project.id }
      })

      // Filter for text files only
      const textFiles = repoFiles.filter(file => {
        const { name, size } = file

        // Skip files larger than 100KB
        if (size && size > 100000) {
          return false
        }

        // Skip binary file extensions
        const binaryExtensions = [
          '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico',
          '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
          '.zip', '.rar', '.tar', '.gz', '.7z',
          '.exe', '.dll', '.so', '.dylib',
          '.mp3', '.mp4', '.avi', '.mov', '.wav',
          '.ttf', '.otf', '.woff', '.woff2',
          '.class', '.jar', '.war'
        ]

        const extension = name.toLowerCase().split('.').pop()
        if (extension && binaryExtensions.includes(`.${extension}`)) {
          return false
        }

        // Skip common binary/generated directories
        const skipPaths = [
          'node_modules/', 'vendor/', '.git/', 'dist/', 'build/',
          'target/', '.idea/', '.vscode/', '__pycache__/', '.next/',
          'coverage/', '.nyc_output/', 'out/'
        ]

        if (skipPaths.some(skipPath => file.path.includes(skipPath))) {
          return false
        }

        return true
      }).slice(0, 100) // Limit to 100 files with content

      // Get file contents
      const filesWithContent = await githubClient.getMultipleFileContents(
        owner,
        cleanRepo,
        textFiles,
        branch,
        3 // Max 3 concurrent requests
      )

      // Store files in database
      const fileCreationPromises = filesWithContent.map(file => {
        const language = GitHubClient.getLanguageFromExtension(file.name)
        return prisma.projectFile.create({
          data: {
            filename: file.name,
            path: file.path,
            content: file.content || '',
            language,
            size: file.size || 0,
            projectId: project.id
          }
        })
      })

      await Promise.all(fileCreationPromises)

      // Update project with repository info
      await prisma.project.update({
        where: { id: project.id },
        data: {
          language: repoInfo.languages,
          framework: repoInfo.frameworks,
          size: BigInt(repoInfo.totalSize),
          status: "COMPLETED",
          branch: repoInfo.branch
        }
      })

      return NextResponse.json({
        message: "Files fetched successfully",
        filesImported: filesWithContent.length,
        totalFiles: repoFiles.length,
        repositoryInfo: {
          owner,
          repo: cleanRepo,
          branch: repoInfo.branch,
          languages: repoInfo.languages,
          frameworks: repoInfo.frameworks,
          totalSize: repoInfo.totalSize
        }
      })

    } catch (error: any) {
      console.error('Error fetching GitHub repository files:', error)

      // Update project status to failed
      await prisma.project.update({
        where: { id: project.id },
        data: { status: "FAILED" }
      })

      // Provide more specific error messages based on the error type
      let errorMessage = "Failed to fetch repository files"
      let statusCode = 500

      if (error.status === 401 || error.message?.includes("Bad credentials")) {
        errorMessage = `GitHub authentication failed for ${owner}/${cleanRepo}. Please link your GitHub account in Profile and ensure you have access to this repository.`
        statusCode = 401
      } else if (error.status === 404) {
        errorMessage = `Repository ${owner}/${cleanRepo} not found. Please check the repository URL and ensure it exists and is accessible.`
        statusCode = 404
      } else if (error.status === 403) {
        errorMessage = `Access denied to repository ${owner}/${cleanRepo}. Please ensure you have the necessary permissions or link a GitHub account with access.`
        statusCode = 403
      } else if (error.message?.includes("rate limit")) {
        errorMessage = "GitHub API rate limit exceeded. Please try again later."
        statusCode = 429
      } else if (error.message?.includes("private") || error.message?.includes("requires valid GitHub authentication")) {
        errorMessage = error.message
        statusCode = 401
      } else {
        errorMessage = `Failed to fetch repository files: ${error instanceof Error ? error.message : String(error)}`
      }

      return NextResponse.json({ error: errorMessage }, { status: statusCode })
    }

  } catch (error) {
    console.error("Error in fetch-files endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
