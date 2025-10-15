"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  Download,
  Copy,
  ExternalLink,
  FileText,
  Code,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn, formatBytes } from "@/lib/utils"

interface FileViewerProps {
  isOpen: boolean
  onClose: () => void
  file: {
    id: string
    name: string
    path: string
    content?: string
    language?: string
    size?: number
    vulnerabilities?: Array<{
      id: string
      title: string
      severity: string
      line?: number
      description: string
    }>
  } | null
  onDownload?: (file: any) => void
  onCopy?: (content: string) => void
}

// Simple syntax highlighting for common languages
function highlightSyntax(code: string, language: string): string {
  if (!language) return code

  const keywords: Record<string, string[]> = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export'],
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'interface', 'type'],
    python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except'],
    java: ['public', 'private', 'protected', 'class', 'interface', 'return', 'if', 'else', 'for', 'while', 'try', 'catch'],
    go: ['func', 'var', 'const', 'type', 'struct', 'interface', 'return', 'if', 'else', 'for', 'range'],
    rust: ['fn', 'let', 'mut', 'const', 'struct', 'enum', 'impl', 'trait', 'return', 'if', 'else', 'for', 'while'],
    php: ['function', 'class', 'public', 'private', 'protected', 'return', 'if', 'else', 'for', 'while', 'try', 'catch'],
    ruby: ['def', 'class', 'module', 'return', 'if', 'else', 'elsif', 'for', 'while', 'begin', 'rescue'],
    cpp: ['int', 'char', 'bool', 'void', 'class', 'struct', 'return', 'if', 'else', 'for', 'while', 'try', 'catch']
  }

  let highlighted = code
  const langKeywords = keywords[language.toLowerCase()] || []

  // Highlight keywords
  langKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g')
    highlighted = highlighted.replace(regex, `<span class="text-purple-600 dark:text-purple-400 font-semibold">${keyword}</span>`)
  })

  // Highlight strings
  highlighted = highlighted.replace(
    /(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
    '<span class="text-green-600 dark:text-green-400">$1$2$1</span>'
  )

  // Highlight comments
  highlighted = highlighted.replace(
    /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
    '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>'
  )

  // Highlight numbers
  highlighted = highlighted.replace(
    /\b\d+(\.\d+)?\b/g,
    '<span class="text-blue-600 dark:text-blue-400">$&</span>'
  )

  return highlighted
}

function getSeverityColor(severity: string) {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'low':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

export function FileViewer({
  isOpen,
  onClose,
  file,
  onDownload,
  onCopy
}: FileViewerProps) {
  const [fontSize, setFontSize] = useState(14)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentMatch, setCurrentMatch] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)
  const [showVulnerabilities, setShowVulnerabilities] = useState(true)

  const lines = file?.content?.split('\n') || []
  const hasVulnerabilities = file?.vulnerabilities && file.vulnerabilities.length > 0

  // Search functionality
  useEffect(() => {
    if (searchQuery && file?.content) {
      const matches = file.content.toLowerCase().split(searchQuery.toLowerCase()).length - 1
      setTotalMatches(matches)
      setCurrentMatch(matches > 0 ? 1 : 0)
    } else {
      setTotalMatches(0)
      setCurrentMatch(0)
    }
  }, [searchQuery, file?.content])

  const handleCopy = () => {
    if (file?.content) {
      navigator.clipboard.writeText(file.content)
      onCopy?.(file.content)
    }
  }

  const handleDownload = () => {
    if (file) {
      onDownload?.(file)
    }
  }

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24))
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 10))
  const resetFontSize = () => setFontSize(14)

  if (!isOpen || !file) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {file.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {file.path} • {file.size ? formatBytes(file.size) : 'Unknown size'}
              </p>
            </div>
            {file.language && (
              <Badge variant="secondary" className="ml-2">
                {file.language}
              </Badge>
            )}
            {hasVulnerabilities && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {file.vulnerabilities!.length} issues
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search in file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
              {totalMatches > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                  {currentMatch}/{totalMatches}
                </div>
              )}
            </div>

            {/* Font controls */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button variant="ghost" size="sm" onClick={decreaseFontSize}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs px-2">{fontSize}px</span>
              <Button variant="ghost" size="sm" onClick={increaseFontSize}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={resetFontSize}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* View options */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLineNumbers(!showLineNumbers)}
            >
              {showLineNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>

            {hasVulnerabilities && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVulnerabilities(!showVulnerabilities)}
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                {showVulnerabilities ? 'Hide' : 'Show'} Issues
              </Button>
            )}

            {/* Actions */}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Vulnerabilities panel */}
            {hasVulnerabilities && showVulnerabilities && (
              <div className="border-b dark:border-slate-700 bg-red-50 dark:bg-red-900/10">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Security Issues Found ({file.vulnerabilities!.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {file.vulnerabilities!.map((vuln) => (
                      <div
                        key={vuln.id}
                        className="flex items-start gap-2 p-2 bg-white dark:bg-slate-800 rounded border"
                      >
                        <Badge className={cn("text-xs", getSeverityColor(vuln.severity))}>
                          {vuln.severity}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {vuln.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {vuln.line && `Line ${vuln.line} • `}{vuln.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Code viewer */}
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-800">
              <div className="flex">
                {/* Line numbers */}
                {showLineNumbers && (
                  <div className="bg-gray-100 dark:bg-slate-700 border-r dark:border-slate-600 select-none">
                    <div className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {lines.map((_, index) => (
                        <div
                          key={index}
                          className="h-5 flex items-center justify-end pr-2"
                          style={{ fontSize: `${fontSize}px` }}
                        >
                          {index + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code content */}
                <div className="flex-1 p-4">
                  <pre
                    className="font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words"
                    style={{ fontSize: `${fontSize}px`, lineHeight: '1.4' }}
                  >
                    {file.language ? (
                      <code
                        dangerouslySetInnerHTML={{
                          __html: highlightSyntax(file.content || '', file.language)
                        }}
                      />
                    ) : (
                      <code>{file.content}</code>
                    )}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-4">
              <span>{lines.length} lines</span>
              <span>{file.content?.length || 0} characters</span>
              {file.language && <span>Language: {file.language}</span>}
            </div>
            <div className="flex items-center gap-2">
              {searchQuery && totalMatches > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs">
                    {currentMatch} of {totalMatches}
                  </span>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <span>Encoding: UTF-8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
