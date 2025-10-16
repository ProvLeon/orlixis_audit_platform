"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  Search,
  Bell,
  User,
  BarChart3,
  Shield,
  Menu,
  X,
  LogOut,
  Folder,
  Home,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Security", href: "/security", icon: Shield },
]

export function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const getUserInitials = (name: string | null | undefined): string => {
    if (!name) return "U"
    const names = name.trim().split(" ")
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
  }

  // Loading state
  if (status === "loading") {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
              <div className="space-y-1">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Unauthenticated state
  if (!session) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center">
                <Image
                  src="/orlixis_logomark.png"
                  alt="Orlixis Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-orlixis-teal font-lora">Orlixis</span>
                <span className="text-xs text-muted-foreground -mt-1">Audit Platform</span>
              </div>
            </Link>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Authenticated state
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-[1580px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center">
                <Image
                  src="/orlixis_logomark.png"
                  alt="Orlixis Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-orlixis-teal font-lora">Orlixis</span>
                <span className="text-xs text-muted-foreground -mt-1">Audit Platform</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href ||
                (item.href === "/projects" && pathname.startsWith("/projects"))

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orlixis-teal/10 text-orlixis-teal-light"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search projects, scans..."
                className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative" title="Notifications">
              <Bell className="h-4 w-4" />
              <Badge
                variant="orlixis-subtle"
                size="sm"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-1 text-xs"
              >
                3
              </Badge>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full p-0 hover:bg-accent"
                  aria-label="Open user menu"
                >
                  {session.user?.image && !imageError ? (
                    <Image
                      src={session.user.image}
                      alt={session.user?.name || "User"}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={() => setImageError(true)}
                      unoptimized
                      priority
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orlixis-teal/20 to-orlixis-purple/20 flex items-center justify-center">
                      <span className="text-xs font-semibold text-orlixis-teal">
                        {getUserInitials(session.user?.name)}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 bg-background"
                align="end"
                forceMount
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {session.user?.image && !imageError ? (
                        <Image
                          src={session.user.image}
                          alt={session.user?.name || "User"}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full border-2 border-orlixis-teal/20 object-cover"
                          onError={() => setImageError(true)}
                          unoptimized
                          priority
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orlixis-teal/20 to-orlixis-purple/20 flex items-center justify-center border-2 border-orlixis-teal/20">
                          <span className="text-sm font-semibold text-orlixis-teal">
                            {getUserInitials(session.user?.name)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {session.user?.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center w-full cursor-pointer"
                  >
                    <User className="mr-3 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="flex items-center w-full text-red-600 dark:text-red-400 cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              {/* Mobile Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search projects, scans..."
                    className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href ||
                    (item.href === "/projects" && pathname.startsWith("/projects"))

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-orlixis-teal/10 text-orlixis-teal"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Mobile User Section */}
              <div className="mt-6 pt-4 border-t">
                <Link
                  href="/profile"
                  className="flex items-center space-x-3 rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="flex items-center space-x-3 rounded-md px-3 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
