"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "./header"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import type { BreadcrumbItem } from "@/components/ui/breadcrumb"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
  breadcrumbItems?: BreadcrumbItem[]
  showBreadcrumbs?: boolean
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  className?: string
}

const maxWidthClasses = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-[1580px]",
  full: "max-w-none"
}

export function AuthenticatedLayout({
  children,
  breadcrumbItems,
  showBreadcrumbs = true,
  maxWidth = "2xl",
  className = ""
}: AuthenticatedLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to signin if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col min-h-0 ${className}`}>
        {showBreadcrumbs && (
          <div className="mb-6 flex-shrink-0">
            <Breadcrumb
              items={breadcrumbItems}
              className="mb-4"
            />
          </div>
        )}

        <div className="flex-1 min-h-0">
          {children}
        </div>
      </main>
    </div>
  )
}

// Convenience wrapper for pages with title and actions
export function PageLayout({
  title,
  description,
  actions,
  breadcrumbItems,
  showBreadcrumbs = true,
  maxWidth = "2xl",
  children,
  className = "",
  titleClassName = "",
  descriptionClassName = "",
  headerExtras = null
}: AuthenticatedLayoutProps & {
  title?: string
  description?: string
  actions?: React.ReactNode
  titleClassName?: string
  descriptionClassName?: string
  headerExtras?: React.ReactNode
}) {
  return (
    <AuthenticatedLayout
      breadcrumbItems={breadcrumbItems}
      showBreadcrumbs={showBreadcrumbs}
      maxWidth={maxWidth}
      className={className}
    >
      {(title || description || actions || headerExtras) && (
        <div className="mb-8 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className={`text-3xl font-bold tracking-tight text-foreground ${titleClassName}`}>
                  {title}
                </h1>
              )}
              {description && (
                <p className={`text-muted-foreground max-w-2xl ${descriptionClassName}`}>
                  {description}
                </p>
              )}
              {headerExtras && (
                <div className="pt-2">
                  {headerExtras}
                </div>
              )}
            </div>

            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {children}
      </div>
    </AuthenticatedLayout>
  )
}
