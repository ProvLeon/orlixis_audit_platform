"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Upload,
  FileText,
  Shield,
  Settings,
  Users,
  Database,
  Activity,
  Folder,
  History,
  Archive,
  Download,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const mainNavigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    description: "Overview and analytics"
  },
  {
    name: "Upload Project",
    href: "/upload",
    icon: Upload,
    description: "Upload new codebase"
  },
  {
    name: "Projects",
    href: "/projects",
    icon: Folder,
    description: "Manage projects",
    badge: "12"
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Audit reports"
  },
  {
    name: "Security",
    href: "/security",
    icon: Shield,
    description: "Security analysis"
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Performance metrics"
  },
]

const secondaryNavigation = [
  {
    name: "History",
    href: "/history",
    icon: History,
    description: "Audit history"
  },
  {
    name: "Archives",
    href: "/archives",
    icon: Archive,
    description: "Archived projects"
  },
  {
    name: "Downloads",
    href: "/downloads",
    icon: Download,
    description: "Export center"
  },
]

const adminNavigation = [
  {
    name: "Team",
    href: "/team",
    icon: Users,
    description: "Team management"
  },
  {
    name: "Database",
    href: "/database",
    icon: Database,
    description: "Database status"
  },
  {
    name: "System",
    href: "/system",
    icon: Activity,
    description: "System monitoring"
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Platform settings"
  },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const NavSection = ({
    title,
    items,
    className
  }: {
    title: string
    items: typeof mainNavigation
    className?: string
  }) => (
    <div className={cn("space-y-1", className)}>
      {!collapsed && (
        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-orlixis-teal/10 text-orlixis-teal shadow-sm"
                  : "text-muted-foreground",
                collapsed ? "justify-center" : "justify-start"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors",
                isActive ? "text-orlixis-teal" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && (
                <>
                  <span className="ml-3 truncate">{item.name}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="ml-auto"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-orlixis-teal rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <div className={cn(
      "relative flex flex-col border-r bg-background/95 backdrop-blur transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed ? (
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-orlixis">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-orlixis-teal">Orlixis</span>
              <span className="text-xs text-muted-foreground -mt-1">Audit Platform</span>
            </div>
          </Link>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-orlixis">
            <Shield className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <NavSection title="Main" items={mainNavigation} />
        <NavSection title="Tools" items={secondaryNavigation} />
        <NavSection title="Admin" items={adminNavigation} />
      </div>

      {/* Toggle Button */}
      {onToggle && (
        <div className="border-t p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "transition-all duration-200",
              collapsed ? "w-8 h-8 p-0" : "w-full"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      )}

      {/* Status Indicator */}
      <div className={cn(
        "border-t p-4",
        collapsed ? "flex justify-center" : ""
      )}>
        <div className={cn(
          "flex items-center space-x-2 text-xs text-muted-foreground",
          collapsed && "flex-col space-x-0 space-y-1"
        )}>
          <div className="h-2 w-2 bg-success rounded-full animate-pulse-orlixis" />
          {!collapsed && <span>System Online</span>}
        </div>
      </div>
    </div>
  )
}
