import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email } = body

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser
    })

  } catch (error) {
    console.error("Error updating profile:", error)

    // Handle Prisma unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
