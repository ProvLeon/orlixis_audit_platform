import React from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function FilesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section Skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-32" />

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-5 w-80" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Quick Stats Row Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Language Distribution Skeleton */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-24 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Overview Skeleton */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-8 w-32 ml-auto" />
            </div>
          </CardContent>
        </Card>

        {/* File Tree Skeleton */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border-0 shadow-lg">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="max-h-[70vh] overflow-auto p-4">
                {/* File tree items skeleton */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-md">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 16 + 8}px` }}>
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      {Math.random() > 0.7 && <Skeleton className="h-4 w-8" />}
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-6 w-6" />
                      <Skeleton className="h-6 w-6" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Information Footer Skeleton */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-48" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>

              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              <div>
                <Skeleton className="h-5 w-28 mb-2" />
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-5 w-16 rounded-full" />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-5 w-20 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
