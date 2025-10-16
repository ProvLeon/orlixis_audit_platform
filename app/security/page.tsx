import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { PageLayout } from "@/components/layout/authenticated-layout"
import SecurityClient from "./SecurityClient"

export default async function SecurityPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Resolve or upsert user to get a stable userId
  let resolvedUserId = (session.user.id || "").trim()
  try {
    if (!resolvedUserId) throw new Error("Missing session user id")
    const existingById = await prisma.user.findUnique({ where: { id: resolvedUserId } })
    if (!existingById) throw new Error("User not found by id")
  } catch {
    const email = (session.user.email || "").trim()
    const name = session.user.name || null
    const image = (session.user as { image?: string })?.image || null
    if (!email) redirect("/auth/signin")
    const upserted = await prisma.user.upsert({
      where: { email },
      update: { name: name || undefined, image: image || undefined },
      create: { email, name, image }
    })
    resolvedUserId = upserted.id
  }

  // Load projects for this user
  const projectsRaw = await prisma.project.findMany({
    where: { userId: resolvedUserId },
    select: { id: true, name: true },
    orderBy: { updatedAt: "desc" },
    take: 100
  })

  const projects = projectsRaw.map(p => ({ id: p.id, name: p.name }))
  const initialProjectId = projects[0]?.id

  return (
    <PageLayout
      title="Security"
      description="Run and monitor security scans across your projects"
      breadcrumbItems={[
        { label: "Dashboard", href: "/" },
        { label: "Security", href: "/security", isCurrentPage: true }
      ]}
    >
      <SecurityClient projects={projects} initialProjectId={initialProjectId} />
    </PageLayout>
  )
}
