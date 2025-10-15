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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
            type: true,
            scope: true,
            expires_at: true,
            access_token: true,
            refresh_token: true,
            token_type: true
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

    return NextResponse.json({
      accounts: user.accounts,
      totalAccounts: user.accounts.length
    })

  } catch (error) {
    console.error("Error fetching linked accounts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
