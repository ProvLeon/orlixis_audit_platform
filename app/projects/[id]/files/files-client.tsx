"use client"

import React, { useState, useCallback, useEffect } from "react"
import { FileTree, FileNode } from "@/components/ui/file-tree"
import { FileViewer } from "@/components/ui/file-viewer"
import { FetchGitHubFilesButton } from "@/components/fetch-github-files-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen, GitBranch } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface FilesClientProps {
  files: FileNode[]
  projectId: string
  projectName: string
  repositoryUrl?: string | null
  initialViewerFile?: {
    id: string
    name: string
    path?: string | null
    content?: string | null
    language?: string | null
    size?: number | null
    vulnerabilities?: any[]
  } | null
}

export function FilesClient({ files, projectId, projectName, repositoryUrl, initialViewerFile }: FilesClientProps) {
  const [selectedFile, setSelectedFile] = useState<string | undefined>()
  const [viewerFile, setViewerFile] = useState<any>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  // Helpers to find a file node by id in the tree
  const flattenNodes = (nodes: FileNode[]): FileNode[] => {
    const out: FileNode[] = []
    const walk = (list: FileNode[]) => {
      for (const n of list) {
        out.push(n)
        if (n.children) walk(n.children)
      }
    }
    walk(nodes)
    return out
  }

  const findNodeById = (nodes: FileNode[], id: string): FileNode | undefined => {
    const all = flattenNodes(nodes)
    return all.find(n => n.id === id && n.type === "file")
  }

  // Open initial viewer file on mount (from prop or URL ?open=FILE_ID)
  useEffect(() => {
    const openFromInitial = async () => {
      if (initialViewerFile) {
        setViewerFile(initialViewerFile)
        setIsViewerOpen(true)
        setSelectedFile(initialViewerFile.id)
        return
      }

      try {
        const params = new URLSearchParams(window.location.search)
        const openId = params.get("open")
        if (!openId) return

        const node = findNodeById(files, openId)
        if (node) {
          await handleFileView(node)
          setSelectedFile(node.id)
          return
        }

        // Fallback: fetch by id if node isn't present in the current tree
        const res = await fetch(`/api/projects/${projectId}/files/${openId}`)
        if (res.ok) {
          const data = await res.json()
          setViewerFile({
            id: data.id,
            name: data.filename || "file",
            path: data.path,
            content: data.content,
            language: data.language,
            size: data.size,
            vulnerabilities: []
          })
          setIsViewerOpen(true)
          setSelectedFile(data.id)
        }
      } catch (e) {
        console.error("Failed to open initial file:", e)
      }
    }

    openFromInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelect = useCallback((file: FileNode) => {
    setSelectedFile(file.id)

    // If it's a text file, we can show it in the viewer
    if (file.type === "file" && file.content) {
      setViewerFile({
        id: file.id,
        name: file.name,
        path: file.path,
        content: file.content,
        language: file.language,
        size: file.size,
        vulnerabilities: [] // TODO: Add actual vulnerabilities data
      })
    }
  }, [])

  const handleFileView = useCallback(async (file: FileNode) => {
    if (file.type !== "file") return

    try {
      // If content is not loaded, fetch it
      let content = file.content
      if (!content) {
        const response = await fetch(`/api/projects/${projectId}/files/${file.id}`)
        if (response.ok) {
          const data = await response.json()
          content = data.content
        } else {
          throw new Error('Failed to load file content')
        }
      }

      // Fetch vulnerabilities for this file
      const vulnResponse = await fetch(`/api/projects/${projectId}/files/${file.id}/vulnerabilities`)
      let vulnerabilities = []
      if (vulnResponse.ok) {
        vulnerabilities = await vulnResponse.json()
      }

      setViewerFile({
        id: file.id,
        name: file.name,
        path: file.path,
        content: content,
        language: file.language,
        size: file.size,
        vulnerabilities: vulnerabilities
      })
      setIsViewerOpen(true)
    } catch (error) {
      console.error('Error loading file:', error)
      toast.error('Failed to load file content')
    }
  }, [projectId])

  const handleFileDownload = useCallback(async (file: FileNode) => {
    if (file.type !== "file") return

    try {
      let content = file.content
      if (!content) {
        const response = await fetch(`/api/projects/${projectId}/files/${file.id}`)
        if (response.ok) {
          const data = await response.json()
          content = data.content
        } else {
          throw new Error('Failed to load file content')
        }
      }

      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }, [projectId])

  const handleViewerClose = useCallback(() => {
    setIsViewerOpen(false)
    setViewerFile(null)
  }, [])

  const handleFileCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('File content copied to clipboard')
    } catch {
      toast.error('Failed to copy content')
    }
  }, [])

  const handleViewerDownload = useCallback((file: any) => {
    try {
      const blob = new Blob([file.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }, [])

  return (
    <>
      {files.length === 0 ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Project Files</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No files found</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  This project doesn’t have any files yet. Connect your GitHub repository to import files automatically, or upload your code to get started.
                </p>
              </div>
              {repositoryUrl && repositoryUrl.includes('github.com') ? (
                <FetchGitHubFilesButton
                  projectId={projectId}
                  repositoryUrl={repositoryUrl}
                  hasFiles={false}
                  variant="default"
                  size="default"
                  onSuccess={() => window.location.reload()}
                />
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/projects/upload">
                    Upload Files
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <FileTree
          files={files}
          onFileSelect={handleFileSelect}
          onFileView={handleFileView}
          onFileDownload={handleFileDownload}
          selectedFile={selectedFile}
          showStats={false}
          allowSearch={true}
          allowSort={true}
          viewMode="tree"
          className="p-0"
        />
      )}

      <FileViewer
        isOpen={isViewerOpen}
        onClose={handleViewerClose}
        file={viewerFile}
        onDownload={handleViewerDownload}
        onCopy={handleFileCopy}
      />
    </>
  )
}
