"use client"

import React, { useState, useMemo } from "react"
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Code,
  FileText,
  Image,
  Archive,
  Settings,
  Database,
  Globe,
  Lock,
  Package,
  Terminal,
  FileCode2,
  FileImage,
  FileLock,
  FileX,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Eye,
  Download,
  ExternalLink
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn, formatBytes } from "@/lib/utils"

export interface FileNode {
  id: string
  name: string
  path: string
  type: "file" | "directory"
  size?: number
  language?: string
  content?: string
  children?: FileNode[]
  createdAt?: string
  vulnerabilities?: number
}

interface FileTreeProps {
  files: FileNode[]
  onFileSelect?: (file: FileNode) => void
  onFileView?: (file: FileNode) => void
  onFileDownload?: (file: FileNode) => void
  selectedFile?: string
  className?: string
  showStats?: boolean
  allowSearch?: boolean
  allowSort?: boolean
  viewMode?: "tree" | "grid"
}

function getFileIcon(fileName: string, language?: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()

  // Language-specific icons
  if (language) {
    switch (language.toLowerCase()) {
      case 'javascript': case 'js': return <FileCode2 className="h-4 w-4 text-yellow-500" />
      case 'typescript': case 'ts': return <FileCode2 className="h-4 w-4 text-blue-500" />
      case 'python': case 'py': return <FileCode2 className="h-4 w-4 text-green-500" />
      case 'java': return <FileCode2 className="h-4 w-4 text-red-500" />
      case 'go': return <FileCode2 className="h-4 w-4 text-cyan-500" />
      case 'rust': case 'rs': return <FileCode2 className="h-4 w-4 text-orange-500" />
      case 'php': return <FileCode2 className="h-4 w-4 text-purple-500" />
      case 'ruby': case 'rb': return <FileCode2 className="h-4 w-4 text-red-600" />
      case 'c': case 'cpp': case 'c++': return <FileCode2 className="h-4 w-4 text-blue-600" />
      case 'csharp': case 'cs': return <FileCode2 className="h-4 w-4 text-purple-600" />
    }
  }

  // Extension-based icons
  switch (ext) {
    case 'js': case 'jsx': case 'mjs': return <FileCode2 className="h-4 w-4 text-yellow-500" />
    case 'ts': case 'tsx': return <FileCode2 className="h-4 w-4 text-blue-500" />
    case 'py': case 'pyw': return <FileCode2 className="h-4 w-4 text-green-500" />
    case 'java': case 'jar': return <FileCode2 className="h-4 w-4 text-red-500" />
    case 'go': return <FileCode2 className="h-4 w-4 text-cyan-500" />
    case 'rs': return <FileCode2 className="h-4 w-4 text-orange-500" />
    case 'php': case 'phtml': return <FileCode2 className="h-4 w-4 text-purple-500" />
    case 'rb': case 'rbw': return <FileCode2 className="h-4 w-4 text-red-600" />
    case 'c': case 'cpp': case 'cc': case 'cxx': case 'h': case 'hpp': return <FileCode2 className="h-4 w-4 text-blue-600" />
    case 'cs': return <FileCode2 className="h-4 w-4 text-purple-600" />
    case 'html': case 'htm': return <Globe className="h-4 w-4 text-orange-500" />
    case 'css': case 'scss': case 'sass': case 'less': return <FileCode2 className="h-4 w-4 text-blue-400" />
    case 'json': case 'jsonc': return <Settings className="h-4 w-4 text-yellow-600" />
    case 'xml': case 'xaml': return <Code className="h-4 w-4 text-green-600" />
    case 'yml': case 'yaml': return <Settings className="h-4 w-4 text-red-400" />
    case 'toml': case 'ini': case 'cfg': case 'conf': return <Settings className="h-4 w-4 text-gray-500" />
    case 'sql': case 'db': case 'sqlite': return <Database className="h-4 w-4 text-blue-700" />
    case 'md': case 'mdx': case 'txt': case 'rtf': return <FileText className="h-4 w-4 text-gray-600" />
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp': case 'ico': return <FileImage className="h-4 w-4 text-pink-500" />
    case 'zip': case 'rar': case 'tar': case 'gz': case '7z': return <Archive className="h-4 w-4 text-amber-600" />
    case 'pdf': return <FileText className="h-4 w-4 text-red-600" />
    case 'doc': case 'docx': case 'odt': return <FileText className="h-4 w-4 text-blue-700" />
    case 'xls': case 'xlsx': case 'ods': return <FileText className="h-4 w-4 text-green-700" />
    case 'ppt': case 'pptx': case 'odp': return <FileText className="h-4 w-4 text-orange-700" />
    case 'lock': return <FileLock className="h-4 w-4 text-yellow-700" />
    case 'env': case 'gitignore': case 'dockerignore': return <FileLock className="h-4 w-4 text-gray-500" />
    case 'dockerfile': return <Package className="h-4 w-4 text-blue-500" />
    case 'sh': case 'bash': case 'zsh': case 'fish': case 'ps1': case 'bat': case 'cmd': return <Terminal className="h-4 w-4 text-green-600" />
    default: return <File className="h-4 w-4 text-gray-500" />
  }
}

function FileTreeNode({
  node,
  level = 0,
  onFileSelect,
  onFileView,
  onFileDownload,
  selectedFile,
  expandedNodes,
  toggleNode
}: {
  node: FileNode
  level?: number
  onFileSelect?: (file: FileNode) => void
  onFileView?: (file: FileNode) => void
  onFileDownload?: (file: FileNode) => void
  selectedFile?: string
  expandedNodes: Set<string>
  toggleNode: (nodeId: string) => void
}) {
  const isExpanded = expandedNodes.has(node.id)
  const isSelected = selectedFile === node.id
  const hasVulnerabilities = node.vulnerabilities && node.vulnerabilities > 0

  const handleClick = () => {
    if (node.type === "directory") {
      toggleNode(node.id)
    } else {
      onFileSelect?.(node)
    }
  }

  return (
    <div className="select-none">
      <div
        className={cn(
          "group flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all duration-200",
          "hover:bg-accent/50",
          isSelected && "bg-accent",
          hasVulnerabilities && "border-l-2 border-red-500"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "directory" ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )}
          </>
        ) : (
          <>
            <div className="w-4" /> {/* Spacer for alignment */}
            {getFileIcon(node.name, node.language)}
          </>
        )}

        <span className={cn(
          "flex-1 text-sm truncate",
          node.type === "directory" ? "font-medium" : "font-normal"
        )}>
          {node.name}
        </span>

        {node.type === "file" && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {hasVulnerabilities && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                {node.vulnerabilities}
              </Badge>
            )}
            {node.size && (
              <span className="text-xs text-muted-foreground">
                {formatBytes(node.size)}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onFileView?.(node)
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onFileDownload?.(node)
              }}
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        )}

        {node.type === "directory" && node.children && (
          <span className="text-xs text-muted-foreground">
            {node.children.length} items
          </span>
        )}
      </div>

      {node.type === "directory" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              onFileView={onFileView}
              onFileDownload={onFileDownload}
              selectedFile={selectedFile}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FileGrid({
  files,
  onFileSelect,
  onFileView,
  onFileDownload,
  selectedFile
}: {
  files: FileNode[]
  onFileSelect?: (file: FileNode) => void
  onFileView?: (file: FileNode) => void
  onFileDownload?: (file: FileNode) => void
  selectedFile?: string
}) {
  const flatFiles = useMemo(() => {
    const flatten = (nodes: FileNode[], parentPath = ""): FileNode[] => {
      return nodes.flatMap(node => {
        const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name
        if (node.type === "file") {
          return [{ ...node, path: fullPath }]
        } else if (node.children) {
          return flatten(node.children, fullPath)
        }
        return []
      })
    }
    return flatten(files)
  }, [files])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {flatFiles.map((file) => {
        const isSelected = selectedFile === file.id
        const hasVulnerabilities = file.vulnerabilities && file.vulnerabilities > 0

        return (
          <Card
            key={file.id}
            className={cn(
              "group cursor-pointer transition-all duration-200 hover:shadow-md",
              isSelected && "ring-2 ring-primary",
              hasVulnerabilities && "border-red-200 dark:border-red-800"
            )}
            onClick={() => onFileSelect?.(file)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getFileIcon(file.name, file.language)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1" title={file.path}>
                    {file.path}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {file.size && (
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                    )}
                    {file.language && (
                      <Badge variant="outline" className="text-xs">
                        {file.language}
                      </Badge>
                    )}
                    {hasVulnerabilities && (
                      <Badge variant="destructive" className="text-xs">
                        {file.vulnerabilities} issues
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFileView?.(file)
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFileDownload?.(file)
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function FileTree({
  files,
  onFileSelect,
  onFileView,
  onFileDownload,
  selectedFile,
  className,
  showStats = true,
  allowSearch = true,
  allowSort = true,
  viewMode = "tree"
}: FileTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentViewMode, setCurrentViewMode] = useState(viewMode)

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files

    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce((acc: FileNode[], node) => {
        const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase())

        if (node.type === "file" && matchesSearch) {
          acc.push(node)
        } else if (node.type === "directory") {
          const filteredChildren = node.children ? filterNodes(node.children) : []
          if (filteredChildren.length > 0 || matchesSearch) {
            acc.push({
              ...node,
              children: filteredChildren
            })
          }
        }

        return acc
      }, [])
    }

    return filterNodes(files)
  }, [files, searchQuery])

  const sortedFiles = useMemo(() => {
    const sortNodes = (nodes: FileNode[]): FileNode[] => {
      return [...nodes]
        .sort((a, b) => {
          // Directories first
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1
          }

          const compare = a.name.localeCompare(b.name)
          return sortOrder === "asc" ? compare : -compare
        })
        .map(node => ({
          ...node,
          children: node.children ? sortNodes(node.children) : undefined
        }))
    }

    return sortNodes(filteredFiles)
  }, [filteredFiles, sortOrder])

  const stats = useMemo(() => {
    const calculateStats = (nodes: FileNode[]): {
      totalFiles: number
      totalDirectories: number
      totalSize: number
      languages: Set<string>
      vulnerabilities: number
    } => {
      let totalFiles = 0
      let totalDirectories = 0
      let totalSize = 0
      const languages = new Set<string>()
      let vulnerabilities = 0

      const traverse = (nodeList: FileNode[]) => {
        for (const node of nodeList) {
          if (node.type === "file") {
            totalFiles++
            totalSize += node.size || 0
            if (node.language) languages.add(node.language)
            vulnerabilities += node.vulnerabilities || 0
          } else {
            totalDirectories++
            if (node.children) traverse(node.children)
          }
        }
      }

      traverse(nodes)
      return { totalFiles, totalDirectories, totalSize, languages, vulnerabilities }
    }

    return calculateStats(files)
  }, [files])

  const expandAll = () => {
    const getAllNodeIds = (nodes: FileNode[]): string[] => {
      return nodes.flatMap(node => [
        node.id,
        ...(node.children ? getAllNodeIds(node.children) : [])
      ])
    }
    setExpandedNodes(new Set(getAllNodeIds(files)))
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalFiles}</div>
              <div className="text-sm text-muted-foreground">Files</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.totalDirectories}</div>
              <div className="text-sm text-muted-foreground">Directories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{formatBytes(stats.totalSize)}</div>
              <div className="text-sm text-muted-foreground">Total Size</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.languages.size}</div>
              <div className="text-sm text-muted-foreground">Languages</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.vulnerabilities}</div>
              <div className="text-sm text-muted-foreground">Issues</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Project Files</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentViewMode(currentViewMode === "tree" ? "grid" : "tree")}
              >
                {currentViewMode === "tree" ? (
                  <Grid3X3 className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
              </Button>
              {currentViewMode === "tree" && (
                <>
                  <Button variant="outline" size="sm" onClick={expandAll}>
                    Expand All
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAll}>
                    Collapse All
                  </Button>
                </>
              )}
            </div>
          </div>

          {(allowSearch || allowSort) && (
            <div className="flex items-center gap-4">
              {allowSearch && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files and directories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {allowSort && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          {currentViewMode === "tree" ? (
            <div className="max-h-[70vh] overflow-auto p-4">
              {sortedFiles.length > 0 ? (
                sortedFiles.map((node) => (
                  <FileTreeNode
                    key={node.id}
                    node={node}
                    onFileSelect={onFileSelect}
                    onFileView={onFileView}
                    onFileDownload={onFileDownload}
                    selectedFile={selectedFile}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No files match your search" : "No files found"}
                </div>
              )}
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto p-4">
              <FileGrid
                files={sortedFiles}
                onFileSelect={onFileSelect}
                onFileView={onFileView}
                onFileDownload={onFileDownload}
                selectedFile={selectedFile}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
