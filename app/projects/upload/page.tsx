"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Upload,
  FileText,
  Folder,
  Github,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Code,
  Link as LinkIcon,
  Zap,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PageLayout } from "@/components/layout/authenticated-layout"
import { RepositorySelector } from "@/components/ui/repository-selector"
import { LanguageIcon } from "@/components/ui/language-icon"
import { GitHubQuickConnect } from "@/components/ui/github-quick-connect"
import { BranchSelector } from "@/components/ui/branch-selector"
import { cn } from "@/lib/utils"

interface Repository {
  id: string | number
  name?: string
  full_name?: string
  url?: string
  clone_url?: string
  description?: string
  owner?: {
    login?: string
  }
}

type UploadMethod = "file" | "folder" | "git" | "url"

interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  status: "pending" | "uploading" | "completed" | "error"
  progress: number
  error?: string
}

const uploadMethods = [
  {
    id: "file" as UploadMethod,
    title: "Upload Files",
    description: "Select individual source code files",
    icon: FileText,
    color: "bg-blue-600",
    features: ["Multiple file selection", "Drag & drop support", "Preview files"]
  },
  {
    id: "folder" as UploadMethod,
    title: "Upload Folder",
    description: "Upload entire project directory",
    icon: Folder,
    color: "bg-green-600",
    features: ["Maintain folder structure", "Automatic file filtering", "Batch processing"]
  },
  {
    id: "git" as UploadMethod,
    title: "Git Repository",
    description: "Import from Git repository URL",
    icon: Github,
    color: "bg-purple-600",
    features: ["Clone from URL", "Branch selection", "Private repo support"]
  },
  {
    id: "url" as UploadMethod,
    title: "Direct URL",
    description: "Import from web-accessible archive",
    icon: LinkIcon,
    color: "bg-orange-600",
    features: ["ZIP/TAR support", "Direct download", "URL validation"]
  }
]

const supportedFormats = [
  { ext: ".js", name: "JavaScript", language: "javascript" },
  { ext: ".ts", name: "TypeScript", language: "typescript" },
  { ext: ".jsx", name: "React JSX", language: "react" },
  { ext: ".tsx", name: "React TSX", language: "react" },
  { ext: ".py", name: "Python", language: "python" },
  { ext: ".java", name: "Java", language: "java" },
  { ext: ".php", name: "PHP", language: "php" },
  { ext: ".rb", name: "Ruby", language: "ruby" },
  { ext: ".go", name: "Go", language: "go" },
  { ext: ".rs", name: "Rust", language: "rust" },
  { ext: ".cpp", name: "C++", language: "c++" },
  { ext: ".cs", name: "C#", language: "c#" },
]

const analysisFeatures = [
  "Security vulnerability scanning",
  "Code quality assessment",
  "Performance profiling",
  "Dependency analysis",
  "License compliance check",
  "Detailed reporting"
]

export default function UploadPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [selectedMethod, setSelectedMethod] = useState<UploadMethod>("file")
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [gitUrl, setGitUrl] = useState("")
  const [directUrl, setDirectUrl] = useState("")
  const [projectName, setProjectName] = useState("")
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [isGithubConnected, setIsGithubConnected] = useState(false)

  const checkGitHubConnection = useCallback(async () => {
    if (!session?.user) return

    try {
      const res = await fetch("/api/profile/accounts")
      if (res.ok) {
        const data = await res.json()
        const hasGithub = data.accounts?.some((acc: { provider: string }) => acc.provider === "github")
        console.log("GitHub connection check:", { hasGithub, accounts: data.accounts })
        setIsGithubConnected(hasGithub)
      } else {
        console.error("Failed to check GitHub connection:", res.status, res.statusText)
      }
    } catch (error) {
      console.error("Error checking GitHub connection:", error)
    }
  }, [session?.user])

  useEffect(() => {
    async function loadRepos() {
      if (!isGithubConnected) {
        console.log("GitHub not connected, skipping repository load")
        return
      }
      setLoadingRepos(true)
      try {
        console.log("Loading repositories...")
        const res = await fetch(`/api/github/repositories`)
        const json = await res.json()
        console.log("Repository API response:", { status: res.status, data: json })
        if (res.ok) {
          const fetched = json.repositories || []
          console.log("Fetched repositories:", fetched.length)
          setRepositories(fetched)
        } else {
          console.error("Failed to load repositories:", json?.error || res.status)
          setRepositories([])
        }
      } catch (e) {
        console.error("Error loading repositories:", e)
        setRepositories([])
      } finally {
        setLoadingRepos(false)
      }
    }
    loadRepos()
  }, [isGithubConnected])

  useEffect(() => {
    checkGitHubConnection()
  }, [session, checkGitHubConnection])

  // Check for GitHub linking success from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('github_linked') === 'success') {
      console.log("GitHub linking detected, refreshing connection status")
      // Clear the parameter from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('github_linked')
      window.history.replaceState({}, '', newUrl.toString())

      // Refresh GitHub connection status
      setTimeout(() => {
        checkGitHubConnection()
      }, 1000)
    }
  }, [checkGitHubConnection])

  useEffect(() => {
    if (!selectedRepository) return
    setRepositories(prev => {
      const exists = prev.some((r: Repository) => String(r.id) === String(selectedRepository.id))
      return exists ? prev : [...prev, selectedRepository]
    })
  }, [selectedRepository])

  const fetchBranches = async (repo: Repository) => {
    const owner = repo.owner
    const full = repo.full_name || `${owner?.login}/${repo.name}`
    if (!full) return
    try {
      const res = await fetch(`/api/github/branches?full_name=${encodeURIComponent(full)}`)
      const json = await res.json()
      if (res.ok) {
        const names = (json.branches || []).map((b: { name: string }) => b.name)
        setBranches(names)
        setSelectedBranch(names[0] || "")
      } else {
        console.error("Failed to load branches:", json?.error || res.status)
        setBranches([])
      }
    } catch (e) {
      console.error("Error loading branches:", e)
      setBranches([])
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFiles = (files: FileList) => {
    const newFiles: UploadFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending",
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id))
  }

  const startUpload = async () => {
    if (selectedMethod !== "git" && uploadedFiles.length === 0 && !directUrl) return

    setIsUploading(true)

    try {
      // Helper to derive a project name from a URL when not provided
      const deriveNameFromUrl = (url: string) => {
        try {
          const u = new URL(url)
          const last = u.pathname.split("/").filter(Boolean).pop() || "project"
          return last.replace(/\.git$/i, "")
        } catch {
          const last = url.split("/").filter(Boolean).pop() || "project"
          return last.replace(/\.git$/i, "")
        }
      }

      if (selectedMethod === "git") {
        if (!gitUrl) return
        const name = projectName.trim() || deriveNameFromUrl(gitUrl)

        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            repositoryUrl: gitUrl,
            branch: selectedBranch || "main",
            status: "UPLOADING"
          })
        })
        if (!res.ok) {
          try {
            const { toast } = await import("sonner")
            toast.error("Failed to create project")
          } catch { }
          throw new Error("Failed to create project")
        }
        const created = await res.json().catch(() => null)
        const projectId = created?.project?.id
        if (!projectId) {
          try {
            const { toast } = await import("sonner")
            toast.error("Project created but ID missing; redirecting to Projects")
          } catch { }
          router.push("/projects")
          return
        }
        try {
          const { toast } = await import("sonner")
          toast("Creating project…")
        } catch { }
        // Attempt to fetch repository files immediately
        try {
          const fetchRes = await fetch(`/api/projects/${projectId}/fetch-files`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          })
          if (fetchRes.ok) {
            const data = await fetchRes.json().catch(() => ({}))
            try {
              const { toast } = await import("sonner")
              toast.success(`Imported ${data?.filesImported ?? "repository"} files`)
            } catch { }
          } else {
            const err = await fetchRes.json().catch(() => ({}))
            try {
              const { toast } = await import("sonner")
              toast.error(err?.error || "Failed to import repository files")
            } catch { }
          }
        } catch (e) {
          try {
            const { toast } = await import("sonner")
            toast.error("Failed to import repository files")
          } catch { }
        }
        router.push(`/projects/${projectId}/files`)
        return
      }

      if (selectedMethod === "url") {
        if (!directUrl) return
        const name = projectName.trim() || deriveNameFromUrl(directUrl)

        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            repositoryUrl: directUrl,
            status: "UPLOADING"
          })
        })
        if (!res.ok) {
          try {
            const { toast } = await import("sonner")
            toast.error("Failed to create project")
          } catch { }
          throw new Error("Failed to create project")
        }
        const created = await res.json().catch(() => null)
        const projectId = created?.project?.id
        if (!projectId) {
          try {
            const { toast } = await import("sonner")
            toast.error("Project created but ID missing; redirecting to Projects")
          } catch { }
          router.push("/projects")
          return
        }
        // If the direct URL is a GitHub repo, fetch files and go to Files page
        if (directUrl.toLowerCase().includes("github.com")) {
          try {
            const fetchRes = await fetch(`/api/projects/${projectId}/fetch-files`, {
              method: "POST",
              headers: { "Content-Type": "application/json" }
            })
            if (fetchRes.ok) {
              const data = await fetchRes.json().catch(() => ({}))
              try {
                const { toast } = await import("sonner")
                toast.success(`Imported ${data?.filesImported ?? "repository"} files`)
              } catch { }
            } else {
              const err = await fetchRes.json().catch(() => ({}))
              try {
                const { toast } = await import("sonner")
                toast.error(err?.error || "Failed to import repository files")
              } catch { }
            }
          } catch {
            try {
              const { toast } = await import("sonner")
              toast.error("Failed to import repository files")
            } catch { }
          }
          router.push(`/projects/${projectId}/files`)
          return
        }
        // Non-GitHub direct URL: go to project details
        try {
          const { toast } = await import("sonner")
          toast.success("Project created")
        } catch { }
        router.push(`/projects/${projectId}`)
        return
      }

      // file/folder path
      if (uploadedFiles.length === 0) return
      const name = projectName.trim() || "Project"
      const totalSize = uploadedFiles.reduce((sum, f) => sum + (f.size || 0), 0)

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          size: totalSize,
          status: "UPLOADING"
        })
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => "Failed to create project")
        console.error("Failed to create project:", errText)
        return
      }
      router.push("/projects")
    } catch (e) {
      console.error(e)
    } finally {
      setIsUploading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <PageLayout
      title="Upload Project"
      description="Upload your codebase for comprehensive security and quality analysis"
      breadcrumbItems={[
        { label: "Dashboard", href: "/", icon: Upload },
        { label: "Projects", href: "/projects", icon: Folder },
        { label: "Upload", href: "/projects/upload", icon: Upload, isCurrentPage: true }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {supportedFormats.length}+ formats supported
          </Badge>
          {isUploading && (
            <Badge variant="info" className="text-xs animate-pulse">
              <Upload className="h-3 w-3 mr-1" />
              Uploading...
            </Badge>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Upload Method</CardTitle>
              <CardDescription>Select how you want to upload your project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadMethods.map((method) => {
                  const Icon = method.icon
                  const isSelected = selectedMethod === method.id

                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
                        isSelected
                          ? "border-orlixis-teal bg-orlixis-teal/5 shadow-orlixis"
                          : "border-border hover:border-orlixis-teal/50"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          // method.color
                        )}>
                          <Icon className={`h-5 w-5 text-${method.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{method.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {method.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" size="sm">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-orlixis-teal" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upload Interface */}
          {selectedMethod === "file" || selectedMethod === "folder" ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload {selectedMethod === "file" ? "Files" : "Folder"}</CardTitle>
                <CardDescription>
                  Drag and drop your {selectedMethod === "file" ? "files" : "project folder"} here or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    dragActive
                      ? "border-orlixis-teal bg-orlixis-teal/5"
                      : "border-muted-foreground/25 hover:border-orlixis-teal/50"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Drop your {selectedMethod === "file" ? "files" : "folder"} here
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    or click to browse from your computer
                  </p>
                  <Button
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.multiple = selectedMethod === "file"
                      if (selectedMethod === "folder") {
                        input.webkitdirectory = true
                      }
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        if (target.files) {
                          handleFiles(target.files)
                        }
                      }
                      input.click()
                    }}
                  >
                    Browse {selectedMethod === "file" ? "Files" : "Folder"}
                  </Button>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-foreground mb-3">Uploaded Files ({uploadedFiles.length})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <Code className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <Badge variant="outline" size="sm">{formatBytes(file.size)}</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            {file.status === "uploading" && (
                              <Progress value={file.progress} className="w-16" />
                            )}
                            {file.status === "completed" && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {file.status === "error" && (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              disabled={isUploading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : selectedMethod === "git" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Github className="w-5 h-5 mr-2" />
                  GitHub Repository
                </CardTitle>
                <CardDescription>
                  Import code directly from your GitHub repositories with full branch support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isGithubConnected ? (
                  <div className="text-center py-8">
                    <Github className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Connect GitHub Account</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Link your GitHub account to access your repositories and import code seamlessly
                    </p>
                    <GitHubQuickConnect
                      onConnected={() => {
                        checkGitHubConnection()
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-orlixis-teal-light/10 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-orlixis-teal-light" />
                        <span className="text-sm font-medium text-green-700 dark:text-orlixis-teal-light">
                          GitHub Connected
                        </span>
                      </div>
                      <span className="text-xs text-green-600 dark:text-orlixis-teal-light">
                        {repositories.length} repositories available
                      </span>
                    </div>

                    <RepositorySelector
                      repositories={repositories}
                      loading={loadingRepos}
                      error={!loadingRepos && repositories.length === 0 ? "No repositories found. Check your GitHub permissions or try refreshing." : undefined}
                      onSelect={(repo) => {
                        console.log("Repository selected:", repo)
                        setSelectedRepository(repo)
                        setGitUrl(repo.clone_url || repo.url || '')
                        setProjectName(repo.name || '')
                        if (repo) fetchBranches(repo)
                      }}
                      selectedRepository={selectedRepository || undefined}
                      placeholder="Search and select a repository from your GitHub account..."
                    />

                    {selectedRepository && (
                      <div className="bg-gradient-to-r from-orlixis-teal/5 to-orlixis-teal-dark/5 border border-orlixis-teal/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-foreground flex items-center">
                            <GitBranch className="w-4 h-4 mr-2 text-orlixis-teal" />
                            Branch Configuration
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {branches.length} branches available
                          </span>
                        </div>

                        <div className="space-y-3">
                          <BranchSelector
                            branches={branches}
                            selectedBranch={selectedBranch}
                            onSelect={setSelectedBranch}
                            defaultBranch={selectedRepository.default_branch}
                            loading={branches.length === 0}
                            placeholder="Select a branch..."
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Choose the branch you want to analyze from {selectedRepository.full_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Direct URL</CardTitle>
                <CardDescription>Import from a web-accessible archive</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Archive URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/project.zip"
                      value={directUrl}
                      onChange={(e) => setDirectUrl(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Supported formats: ZIP, TAR, TAR.GZ, RAR</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>Configure your project analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Project Name</label>
                  <input
                    type="text"
                    placeholder="My Awesome Project"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orlixis-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="security"
                      defaultChecked
                      className="checkbox-orlixis"
                    />
                    <label htmlFor="security" className="text-sm font-medium">Security Analysis</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="quality"
                      defaultChecked
                      className="checkbox-orlixis"
                    />
                    <label htmlFor="quality" className="text-sm font-medium">Code Quality</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="performance"
                      defaultChecked
                      className="checkbox-orlixis"
                    />
                    <label htmlFor="performance" className="text-sm font-medium">Performance</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              size="lg"
              onClick={startUpload}
              disabled={
                isUploading ||
                (selectedMethod === "git"
                  ? !gitUrl
                  : selectedMethod === "url"
                    ? !directUrl
                    : uploadedFiles.length === 0)
              }
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <div className="loading-spinner h-4 w-4 mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push("/")}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supported Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Supported Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {supportedFormats.map((format, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <LanguageIcon language={format.language} size={16} />
                    <span>{format.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Analysis Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisFeatures.map((feature, index) => (
                  <div className="flex items-center space-x-2" key={index}>
                    <CheckCircle className="h-4 w-4 text-orlixis-teal-light" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Upload Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Maximum file size: 500MB</p>
                <p>• Supported archives: ZIP, TAR, RAR</p>
                <p>• Private repos require access tokens</p>
                <p>• Large projects may take longer to analyze</p>
                <p>• Exclude node_modules and build folders</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
