"use client"

import React, { useState } from "react"
import { ChevronDown, GitBranch, Check } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface BranchSelectorProps {
  branches: string[]
  selectedBranch: string
  onSelect: (branch: string) => void
  defaultBranch?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  placeholder?: string
}

export function BranchSelector({
  branches = [],
  selectedBranch,
  onSelect,
  defaultBranch,
  disabled = false,
  loading = false,
  className = "",
  placeholder = "Select a branch..."
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (branch: string) => {
    onSelect(branch)
    setIsOpen(false)
  }

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen)
    }
  }

  const getDisplayText = () => {
    if (loading) return "Loading branches..."
    if (!selectedBranch && defaultBranch) return `${defaultBranch} (default)`
    if (!selectedBranch) return placeholder
    return selectedBranch === defaultBranch ? `${selectedBranch} (default)` : selectedBranch
  }

  return (
    <div className={cn("relative", className)}>
      <label className="text-sm font-medium text-foreground mb-2 block">
        Select Branch
      </label>

      {/* Selected Branch Display / Trigger */}
      <Button
        variant="outline"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={cn(
          "w-full justify-between h-auto p-3 text-left",
          isOpen && "ring-2 ring-orlixis-teal ring-offset-2",
          selectedBranch && "border-orlixis-teal/50"
        )}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <GitBranch className="w-4 h-4 text-orlixis-teal flex-shrink-0" />
          <span className={cn(
            "truncate",
            selectedBranch ? "text-foreground" : "text-muted-foreground"
          )}>
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180",
          loading && "animate-spin"
        )} />
      </Button>

      {/* Dropdown Content */}
      {isOpen && !loading && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Branch List */}
          <div className="max-h-64 overflow-y-auto">
            {branches.length === 0 ? (
              <div className="p-4 text-center">
                <GitBranch className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No branches found</p>
              </div>
            ) : (
              <div className="p-1">
                {/* Default branch option if not in branches list */}
                {defaultBranch && !branches.includes(defaultBranch) && (
                  <div
                    onClick={() => handleSelect(defaultBranch)}
                    className={cn(
                      "relative p-3 rounded-md cursor-pointer transition-all duration-200 hover:bg-orlixis-teal/10 flex items-center justify-between",
                      selectedBranch === defaultBranch && "bg-orlixis-teal/20 border border-orlixis-teal/30"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <GitBranch className="w-4 h-4 text-orlixis-teal" />
                      <div>
                        <span className="font-medium text-foreground text-sm">
                          {defaultBranch}
                        </span>
                        <span className="text-xs text-orlixis-teal ml-2 font-medium">
                          (default)
                        </span>
                      </div>
                    </div>
                    {selectedBranch === defaultBranch && (
                      <Check className="w-4 h-4 text-orlixis-teal" />
                    )}
                  </div>
                )}

                {/* Regular branches */}
                {branches.map((branch) => {
                  const isSelected = selectedBranch === branch
                  const isDefault = branch === defaultBranch

                  return (
                    <div
                      key={branch}
                      onClick={() => handleSelect(branch)}
                      className={cn(
                        "relative p-3 rounded-md cursor-pointer transition-all duration-200 hover:bg-orlixis-teal/10 flex items-center justify-between",
                        isSelected && "bg-orlixis-teal/20 border border-orlixis-teal/30"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <GitBranch className={cn(
                          "w-4 h-4",
                          isDefault ? "text-orlixis-teal" : "text-muted-foreground"
                        )} />
                        <div>
                          <span className="font-medium text-foreground text-sm">
                            {branch}
                          </span>
                          {isDefault && (
                            <span className="text-xs text-orlixis-teal ml-2 font-medium">
                              (default)
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-orlixis-teal" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {branches.length > 0 && (
            <div className="border-t p-2 bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                {branches.length} branch{branches.length !== 1 ? "es" : ""} available
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-orlixis-teal border-t-transparent rounded-full"></div>
            <p className="text-sm text-muted-foreground">Loading branches...</p>
          </div>
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
