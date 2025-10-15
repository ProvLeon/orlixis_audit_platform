"use client"

import React from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb and actions */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Project Header Banner */}
        <div className="mb-8 relative overflow-hidden rounded-xl bg-gradient-to-r from-orlixis-teal/10 via-blue-500/5 to-indigo-500/10 border border-orlixis-teal/20 backdrop-blur-sm">
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orlixis-teal/10 border border-orlixis-teal/20">
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <div>
                  <Skeleton className="h-10 w-80 md:w-96 mb-2" />
                  <Skeleton className="h-6 w-64 md:w-[480px]" />
                </div>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <Card key={`stat-${i}`} className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>
                </div>
                <Skeleton className="h-3 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Enhanced Overview */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orlixis-teal/10">
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>
                  <Skeleton className="h-6 w-40" />
                </div>
                <div>
                  <Skeleton className="mt-2 h-4 w-80" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="group p-4 rounded-xl border">
                      <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-4">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-36" />
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Scan Manager */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>
                  <Skeleton className="h-6 w-36" />
                </div>
                <div>
                  <Skeleton className="mt-2 h-4 w-72" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-28" />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-4 w-4 rounded" />
                          <div>
                            <Skeleton className="h-4 w-40 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Recent Reports */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orlixis-teal/10">
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>
                  <Skeleton className="h-6 w-44" />
                </div>
                <div>
                  <Skeleton className="mt-2 h-4 w-64" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 p-4 rounded-xl border">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-orlixis-teal/10">
                          <Skeleton className="h-4 w-4 rounded" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Languages & Technologies */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div>
                  <Skeleton className="mt-1 h-4 w-40" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-6 w-16 rounded-full" />
                    ))}
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-6 w-20 rounded-full" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Repository Info */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div>
                  <Skeleton className="mt-1 h-4 w-36" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg border">
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Security Overview */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div>
                  <Skeleton className="mt-1 h-4 w-44" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div>
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-5 w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Files Preview */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div>
                  <Skeleton className="mt-1 h-4 w-40" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  ))}
                  <div className="pt-3">
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
