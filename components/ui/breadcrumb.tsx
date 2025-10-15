"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home, Folder, FileText, Shield, BarChart3, Upload, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  isCurrentPage?: boolean
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
  showHome?: boolean
  maxItems?: number
}

// Icon mapping for common routes
const routeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/": Home,
  "/projects": Folder,
  "/reports": FileText,
  "/security": Shield,
  "/upload": Upload,
  "/settings": Settings,
  "/profile": User,
  "/dashboard": BarChart3,
}

// Route labels for common paths
const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/projects/upload": "Upload",
  "/reports": "Reports",
  "/security": "Security",
  "/upload": "Upload",
  "/settings": "Settings",
  "/profile": "Profile",
  "/dashboard": "Dashboard",
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Always include home/dashboard
  breadcrumbs.push({
    label: "Dashboard",
    href: "/",
    icon: Home,
  })

  // Build breadcrumbs from path segments
  let currentPath = ""
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`

    // Skip if this is the current page and it's the last segment
    const isCurrentPage = i === segments.length - 1

    // Try to get a nice label for this segment
    let label = routeLabels[currentPath] || segment

    // Handle dynamic routes (IDs, etc.)
    if (!routeLabels[currentPath] && segment.length > 10) {
      // Likely a UUID or long ID, truncate it
      label = `${segment.slice(0, 8)}...`
    } else if (!routeLabels[currentPath]) {
      // Capitalize and clean up the segment
      label = segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    // Get icon for this route
    const icon = routeIcons[currentPath]

    breadcrumbs.push({
      label,
      href: currentPath,
      icon,
      isCurrentPage,
    })
  }

  return breadcrumbs
}

export function Breadcrumb({
  items,
  className,
  showHome = true,
  maxItems = 4
}: BreadcrumbProps) {
  const pathname = usePathname()

  // Use provided items or generate from current path
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname)

  // Filter out home if showHome is false
  const filteredItems = showHome ? breadcrumbItems : breadcrumbItems.slice(1)

  // Truncate items if too many
  const displayItems = filteredItems.length > maxItems
    ? [
      filteredItems[0],
      { label: "...", href: "#", icon: undefined },
      ...filteredItems.slice(-2)
    ]
    : filteredItems

  if (displayItems.length <= 1) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm", className)}
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1
          const Icon = item.icon
          const isEllipsis = item.label === "..."

          return (
            <li key={`${item.href}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              )}

              {isEllipsis ? (
                <span className="text-muted-foreground px-2 py-1">...</span>
              ) : isLast ? (
                <span
                  className="flex items-center space-x-1.5 px-2 py-1 text-orlixis-teal font-medium bg-orlixis-teal/10 border border-orlixis-teal/30 rounded-md"
                  aria-current="page"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="truncate max-w-[200px]">{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center space-x-1.5 px-2 py-1 text-muted-foreground hover:text-orlixis-teal hover:bg-orlixis-teal/10 rounded-md transition-all duration-200 group"
                >
                  {Icon && (
                    <Icon className="h-4 w-4 group-hover:text-orlixis-teal transition-colors" />
                  )}
                  <span className="truncate max-w-[200px] group-hover:text-orlixis-teal">
                    {item.label}
                  </span>
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Convenience component for common usage
export function PageBreadcrumb({
  title,
  description,
  items,
  actions,
  className
}: {
  title?: string
  description?: string
  items?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}) {
  const pathname = usePathname()

  // Auto-generate title from breadcrumbs if not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname)
  const pageTitle = title || breadcrumbItems[breadcrumbItems.length - 1]?.label || "Page"

  return (
    <div className={cn("space-y-4 pb-6 border-b border-border/60", className)}>
      <Breadcrumb items={items} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {pageTitle}
          </h1>
          {description && (
            <p className="text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for accessing current breadcrumb items
export function useBreadcrumbs() {
  const pathname = usePathname()
  return generateBreadcrumbsFromPath(pathname)
}
