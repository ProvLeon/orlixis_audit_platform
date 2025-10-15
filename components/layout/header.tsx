"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  Search,
  Bell,
  Settings,
  User,
  FileText,
  Upload,
  BarChart3,
  Shield,
  Menu,
  X,
  LogOut,
  FolderPlus,
  Folder
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
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Reports", href: "/projects/reports", icon: FileText },
  { name: "Security", href: "/security", icon: Shield },
]

export function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [imageError, setImageError] = useState(false)

  // Debug logging for image URL
  React.useEffect(() => {
    if (session?.user?.image) {
      console.log("Header: User image URL:", session.user.image)
    } else {
      console.log("Header: No user image found")
    }
  }, [session?.user?.image])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" })
  }

  const getUserInitials = (name: string | null | undefined): string => {
    if (!name) return "U"
    const names = name.trim().split(" ")
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
  }

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
              const isActive = pathname === item.href

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
                placeholder="Search projects, reports..."
                className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
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
                <button
                  className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-orlixis-teal transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orlixis-teal focus:ring-offset-2 bg-transparent p-0 hover:shadow-lg hover:scale-105 active:scale-95"
                  aria-label="Open user menu"
                  type="button"
                >
                  {session.user?.image && !imageError ? (
                    <Image
                      src={session.user.image}
                      alt={session.user?.name || "User"}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(e) => {
                        console.log("Header: Image load error for URL:", session.user?.image)
                        setImageError(true)
                      }}
                      onLoad={() => console.log("Header: Image loaded successfully:", session.user?.image)}
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
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg p-2"
                align="end"
                forceMount
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-normal px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {session.user?.image && !imageError ? (
                        <Image
                          src={session.user.image}
                          alt={session.user?.name || "User"}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full border-2 border-orlixis-teal/20 object-cover"
                          onError={(e) => {
                            console.log("Header dropdown: Image load error for URL:", session.user?.image)
                            setImageError(true)
                          }}
                          onLoad={() => console.log("Header dropdown: Image loaded successfully:", session.user?.image)}
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
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {session.user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <div className="space-y-1">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer group"
                    >
                      <User className="mr-3 h-4 w-4 text-gray-500 group-hover:text-orlixis-teal transition-colors" />
                      <span className="font-medium">Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer group"
                    >
                      <Settings className="mr-3 h-4 w-4 text-gray-500 group-hover:text-orlixis-teal transition-colors" />
                      <span className="font-medium">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-2 border-gray-200 dark:border-gray-700" />

                <DropdownMenuItem
                  className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors cursor-pointer group"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-3 h-4 w-4 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors" />
                  <span className="font-medium">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
                    placeholder="Search projects, reports..."
                    className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

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
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
