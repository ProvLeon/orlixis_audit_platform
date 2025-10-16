"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  User,
  Mail,
  Github,
  Globe,
  Shield,
  Key,
  Settings,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Building,
  Clock,
  Plus,
  Trash2,
  Edit,
  Save,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageLayout } from "@/components/layout/authenticated-layout"
import { cn } from "@/lib/utils"
import { SiGoogle } from "react-icons/si"

interface LinkedAccount {
  id: string
  provider: string
  providerAccountId: string
  type: string
  scope?: string
  access_token?: string
  expires_at?: number
  refresh_token?: string
  token_type?: string
}

interface GitHubProfile {
  login: string
  id: number
  avatar_url: string
  name: string
  company?: string
  blog?: string
  location?: string
  email: string
  bio?: string
  public_repos: number
  followers: number
  following: number
  created_at: string
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [githubProfile, setGithubProfile] = useState<GitHubProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
  })
  const [connectingGithub, setConnectingGithub] = useState(false)

  useEffect(() => {
    loadProfileData()

    // Check if GitHub was just linked
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('github_linked') === 'true') {
      // Clear the parameter from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('github_linked')
      window.history.replaceState({}, '', newUrl.toString())

      // Show success message or refresh data
      setTimeout(() => {
        loadProfileData()
      }, 1000)
    }
  }, [session])

  const loadProfileData = async () => {
    if (!session?.user?.id) return

    try {
      // Load linked accounts
      const accountsRes = await fetch("/api/profile/accounts")
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json()
        setLinkedAccounts(accountsData.accounts || [])

        // If GitHub is linked, load GitHub profile
        const githubAccount = accountsData.accounts?.find((acc: LinkedAccount) => acc.provider === "github")
        if (githubAccount) {
          const githubRes = await fetch("/api/github/profile")
          if (githubRes.ok) {
            const githubData = await githubRes.json()
            setGithubProfile(githubData.profile)
          }
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        await update({ name: formData.name, email: formData.email })
        setIsEditing(false)
      }
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const connectGithub = async () => {
    setConnectingGithub(true)
    try {
      // Get GitHub OAuth URL from our custom linking endpoint
      const response = await fetch("/api/auth/link-github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          callbackUrl: window.location.href
        })
      })

      if (!response.ok) {
        throw new Error("Failed to generate GitHub auth URL")
      }

      const data = await response.json()

      // Redirect to GitHub OAuth
      window.location.href = data.authUrl
    } catch (error) {
      console.error("Error connecting GitHub:", error)
      setConnectingGithub(false)
    }
  }

  const disconnectGithub = async () => {
    try {
      const res = await fetch("/api/profile/accounts/github", {
        method: "DELETE"
      })

      if (res.ok) {
        setLinkedAccounts(prev => prev.filter(acc => acc.provider !== "github"))
        setGithubProfile(null)
      }
    } catch (error) {
      console.error("Error disconnecting GitHub:", error)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "github":
        return Github
      case "google":
        return Mail
      default:
        return Globe
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "github":
        return "bg-gray-900 text-white"
      case "google":
        return "bg-blue-600 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const isGithubLinked = linkedAccounts.some(acc => acc.provider === "github")
  const isGoogleLinked = linkedAccounts.some(acc => acc.provider === "google")

  if (loading) {
    return (
      <PageLayout
        title="Profile"
        description="Manage your account settings and connected services"
        breadcrumbItems={[
          { label: "Dashboard", href: "/", icon: User },
          { label: "Profile", href: "/profile", icon: User, isCurrentPage: true }
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="loading-spinner h-8 w-8 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Profile"
      description="Manage your account settings and connected services"
      breadcrumbItems={[
        { label: "Dashboard", href: "/", icon: User },
        { label: "Profile", href: "/profile", icon: User, isCurrentPage: true }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {linkedAccounts.length} account{linkedAccounts.length !== 1 ? 's' : ''} linked
          </Badge>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      setFormData({
                        name: session?.user?.name || "",
                        email: session?.user?.email || "",
                      })
                    }
                    setIsEditing(!isEditing)
                  }}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-orlixis-teal/20">
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={80}
                        height={80}
                        className="h-20 w-20 object-cover"
                        onError={(e) => {
                          console.log("Profile: Image load error for URL:", session.user?.image)
                        }}
                        onLoad={() => console.log("Profile: Image loaded successfully:", session.user?.image)}
                        unoptimized
                      />
                    ) : (
                      <div className="h-20 w-20 bg-gradient-to-br from-orlixis-teal/20 to-orlixis-purple/20 flex items-center justify-center">
                        <User className="h-8 w-8 text-orlixis-teal" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">
                          {session?.user?.name || "Not provided"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">
                          {session?.user?.email || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        size="sm"
                      >
                        {saving ? (
                          <>
                            <div className="loading-spinner h-4 w-4 mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Connected Accounts
              </CardTitle>
              <CardDescription>
                Link external services to enhance your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* GitHub Connection */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
                      <Github className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">GitHub</h3>
                      <p className="text-sm text-muted-foreground">
                        {isGithubLinked
                          ? `Connected as ${githubProfile?.login || 'GitHub User'}`
                          : "Connect to access your repositories"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGithubLinked ? (
                      <>
                        <Badge variant="success" size="sm" blurred translucent>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={disconnectGithub}
                        >
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={connectGithub}
                        disabled={connectingGithub}
                        size="sm"
                      >
                        {connectingGithub ? (
                          <>
                            <div className="loading-spinner h-4 w-4 mr-2" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Google Connection (Read-only if primary) */}
                <div className="flex items-center justify-between p-4 border rounded-lg opacity-75">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg ">
                      <SiGoogle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Google</h3>
                      <p className="text-sm text-muted-foreground">
                        {isGoogleLinked
                          ? "Primary authentication provider"
                          : "Not connected"
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant="info" size="sm" blurred translucent>
                    <Shield className="h-3 w-3 mr-1" />
                    Primary
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="text-foreground">
                    {session?.user?.email ? new Date().toLocaleDateString() : "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account type</span>
                  <span className="text-foreground">Free</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="success" size="sm" blurred translucent>Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GitHub Profile (if connected) */}
          {githubProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Image
                      src={githubProfile.avatar_url}
                      alt={githubProfile.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                      unoptimized
                    />
                    <div>
                      <p className="font-medium text-sm">{githubProfile.name}</p>
                      <p className="text-xs text-muted-foreground">@{githubProfile.login}</p>
                    </div>
                  </div>

                  {githubProfile.bio && (
                    <p className="text-xs text-muted-foreground">{githubProfile.bio}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-medium">{githubProfile.public_repos}</p>
                      <p className="text-muted-foreground">Repos</p>
                    </div>
                    <div>
                      <p className="font-medium">{githubProfile.followers}</p>
                      <p className="text-muted-foreground">Followers</p>
                    </div>
                    <div>
                      <p className="font-medium">{githubProfile.following}</p>
                      <p className="text-muted-foreground">Following</p>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a
                      href={`https://github.com/${githubProfile.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Visit Profile
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <a href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <a href="/security">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Center
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <a href="/projects/upload">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Project
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
