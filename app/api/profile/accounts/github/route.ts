import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
            type: true
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

    // Find GitHub account
    const githubAccount = user.accounts.find(acc => acc.provider === "github")

    if (!githubAccount) {
      return NextResponse.json(
        { error: "GitHub account not found" },
        { status: 404 }
      )
    }

    // Prevent disconnecting if it's the only account
    if (user.accounts.length === 1) {
      return NextResponse.json(
        { error: "Cannot disconnect the only linked account" },
        { status: 400 }
      )
    }

    // Delete the GitHub account
    await prisma.account.delete({
      where: {
        id: githubAccount.id
      }
    })

    return NextResponse.json({
      message: "GitHub account disconnected successfully"
    })

  } catch (error) {
    console.error("Error disconnecting GitHub account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
