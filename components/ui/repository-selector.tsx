"use client"

import React, { useState, useMemo } from "react"
import {
  Search,
  Star,
  GitFork,
  Calendar,
  Code,
  Lock,
  Globe,
  Check,
  ChevronDown,
  Github,
  AlertCircle
} from "lucide-react"
import { Badge } from "./badge"
import { Button } from "./button"
import { Card, CardContent } from "./card"
import { LanguageIcon } from "./language-icon"
import { cn } from "@/lib/utils"

interface Repository {
  id: string | number
  name?: string
  full_name?: string
  url?: string
  clone_url?: string
  description?: string
  private?: boolean
  language?: string | null
  stargazers_count?: number
  forks_count?: number
  updated_at?: string
  default_branch?: string
  owner?: {
    login?: string
    avatar_url?: string
  }
}

interface RepositorySelectorProps {
  repositories?: Repository[]
  selectedRepository?: Repository
  onSelect: (repository: Repository) => void
  loading?: boolean
  error?: string
  className?: string
  placeholder?: string
}

export function RepositorySelector({
  repositories = [],
  selectedRepository,
  onSelect,
  loading = false,
  error,
  className = "",
  placeholder = "Search and select a repository..."
}: RepositorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter and sort repositories
  const filteredRepositories = useMemo(() => {
    if (!repositories.length) return []

    let filtered = repositories

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = repositories.filter(repo =>
        repo.name?.toLowerCase().includes(query) ||
        repo.full_name?.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query)
      )
    }

    // Sort by updated date (most recent first), then by stars
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updated_at || 0).getTime()
      const dateB = new Date(b.updated_at || 0).getTime()
      if (dateA !== dateB) return dateB - dateA

      const starsA = a.stargazers_count || 0
      const starsB = b.stargazers_count || 0
      return starsB - starsA
    })
  }, [repositories, searchQuery])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`
    return `${Math.ceil(diffDays / 365)} years ago`
  }

  const formatNumber = (num?: number) => {
    if (!num) return "0"
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  const handleSelect = (repo: Repository) => {
    onSelect(repo)
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleToggle = () => {
    if (!loading) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <label className="text-sm font-medium text-foreground mb-2 block">
        Select Repository
      </label>

      {/* Selected Repository Display / Trigger */}
      <Button
        variant="outline"
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          "w-full justify-between h-auto p-3 text-left",
          isOpen && "ring-2 ring-orlixis-teal ring-offset-2",
          selectedRepository && "border-orlixis-teal/50"
        )}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {selectedRepository ? (
            <>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orlixis-teal to-orlixis-teal-dark flex items-center justify-center">
                  <Github className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-foreground truncate">
                    {selectedRepository.full_name || selectedRepository.name}
                  </span>
                  {selectedRepository.private && (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                  {selectedRepository.language && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedRepository.language}
                    </Badge>
                  )}
                </div>
                {selectedRepository.description && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {selectedRepository.description}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                {loading ? "Loading repositories..." : placeholder}
              </span>
            </>
          )}
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-orlixis-teal"
                autoFocus
              />
            </div>
          </div>

          {/* Repository List */}
          <div className="max-h-80 overflow-y-auto">
            {error ? (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-orlixis-teal border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading repositories...</p>
              </div>
            ) : filteredRepositories.length === 0 ? (
              <div className="p-4 text-center">
                <Github className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No repositories match your search" : "No repositories found"}
                </p>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-1">
                {filteredRepositories.map((repo) => {
                  const isSelected = selectedRepository?.id === repo.id

                  return (
                    <div
                      key={repo.id}
                      onClick={() => handleSelect(repo)}
                      className={cn(
                        "relative p-3 rounded-md cursor-pointer transition-all duration-200 hover:bg-muted/50",
                        isSelected && "bg-orlixis-teal/10 border border-orlixis-teal/30"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Repository Icon/Avatar */}
                        <div className="flex-shrink-0 mt-0.5">
                          {repo.owner?.avatar_url ? (
                            <img
                              src={repo.owner.avatar_url}
                              alt={repo.owner.login}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orlixis-teal to-orlixis-teal-dark flex items-center justify-center">
                              <Github className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Repository Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-foreground text-sm truncate">
                              {repo.full_name || repo.name}
                            </span>
                            {repo.private ? (
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            ) : (
                              <Globe className="w-3 h-3 text-muted-foreground" />
                            )}
                            {isSelected && (
                              <Check className="w-4 h-4 text-orlixis-teal ml-auto" />
                            )}
                          </div>

                          {repo.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {repo.description}
                            </p>
                          )}

                          {/* Repository Metadata */}
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            {repo.language && (
                              <div className="flex items-center space-x-1">
                                <LanguageIcon language={repo.language.toLowerCase()} size={12} />
                                <span>{repo.language}</span>
                              </div>
                            )}

                            {(repo.stargazers_count ?? 0) > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3" />
                                <span>{formatNumber(repo.stargazers_count)}</span>
                              </div>
                            )}

                            {(repo.forks_count ?? 0) > 0 && (
                              <div className="flex items-center space-x-1">
                                <GitFork className="w-3 h-3" />
                                <span>{formatNumber(repo.forks_count)}</span>
                              </div>
                            )}

                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(repo.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredRepositories.length > 0 && (
            <div className="border-t p-2 bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                {filteredRepositories.length} of {repositories.length} repositories
                {searchQuery && " (filtered)"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
