import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: projectId, fileId } = await params
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

    // Get the file
    const file = await prisma.projectFile.findFirst({
      where: {
        id: fileId,
        projectId: project.id
      }
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: file.id,
      filename: file.filename,
      path: file.path,
      content: file.content,
      language: file.language,
      size: file.size,
      createdAt: file.createdAt
    })

  } catch (error) {
    console.error("Error fetching file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
