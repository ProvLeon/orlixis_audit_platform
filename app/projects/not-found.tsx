"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { ArrowLeft, FolderOpen, Plus, Home, Copy, Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type RecentProject = { id: string; name: string }

export default function NotFound() {
  const [currentUrl, setCurrentUrl] = useState<string>("")
  const [referrer, setReferrer] = useState<string>("")
  const [timestamp, setTimestamp] = useState<string>("")
  const [recent, setRecent] = useState<RecentProject[]>([])
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const searchRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href)
      setReferrer(document.referrer || "")
      setTimestamp(new Date().toLocaleString())
      try {
        const raw = localStorage.getItem("orlixis_recent_projects")
        if (raw) {
          const parsed = JSON.parse(raw) as RecentProject[]
          if (Array.isArray(parsed)) setRecent(parsed.slice(0, 5))
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault()
        if (window.history.length > 1) window.history.back()
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault()
        window.location.href = "/projects"
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault()
        window.location.reload()
      } else if (e.key === "/") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl || window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const handleSearch = (e: any) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const q = String(data.get("q") || "").trim()
    if (q) {
      window.location.href = `/projects?q=${encodeURIComponent(q)}`
    }
  }

  return (
    <main className="relative min-h-[80vh] w-full flex items-center justify-center px-6 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 -right-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
      </div>
      <div className="w-full max-w-5xl">
        {/*<header className="mb-6 flex items-center justify-between gap-3" role="banner" aria-label="Project not found header">
          <div className="flex items-center gap-3">
            <div aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white font-semibold">
              404
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Project not found</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">Use the tools below to recover or create a new project.</p>
            </div>
          </div>
          <div className="hidden sm:block h-1.5 w-32 rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700" />
        </header>*/}

        <div className="rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              We can’t find that project
            </h1>
            <p className="mt-2 max-w-prose text-slate-600 dark:text-slate-300">
              It may have been moved, deleted, or you might not have access. Use the shortcuts
              below to continue.
            </p>

            <div className="mt-5 flex w-full flex-col gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" onClick={handleBack} className="h-10">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go back
                </Button>
                <Button variant="outline" onClick={handleCopy} className="h-10">
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? "Link copied" : "Copy link"}
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} className="h-10">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload
                </Button>
              </div>
              <form onSubmit={handleSearch} className="mx-auto flex w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <Search className="h-4 w-4 text-teal-600" />
                <Input ref={searchRef} name="q" placeholder="Search your projects or findings..." className="border-0 bg-transparent focus-visible:ring-0" />
                <Button type="submit" className="h-9 bg-teal-600 hover:bg-teal-700">Search</Button>
              </form>
            </div>

            <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <Button asChild className="h-11 bg-teal-600 hover:bg-teal-700 text-white">
                <Link href="/projects" aria-label="View projects">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  View Projects
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-11">
                <Link href="/projects/upload" aria-label="Create new project">
                  <Plus className="mr-2 h-4 w-4 text-teal-600" />
                  New Project
                </Link>
              </Button>

              <Button asChild variant="ghost" className="h-11">
                <Link href="/" aria-label="Go to Dashboard">
                  <Home className="mr-2 h-4 w-4 text-teal-600" />
                  Dashboard
                </Link>
              </Button>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Shortcuts: <span className="rounded border px-1.5 py-0.5">B</span> Back • <span className="rounded border px-1.5 py-0.5">P</span> Projects • <span className="rounded border px-1.5 py-0.5">R</span> Reload • <span className="rounded border px-1.5 py-0.5">/</span> Search
            </div>
            <div className="mt-6 w-full rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-left dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Tip: Check the URL for typos, or ensure you’re signed into the correct account.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-6 shadow-sm">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Suggested destinations</div>
            {recent.length === 0 ? (
              <div className="text-sm text-slate-500">No recent projects found.</div>
            ) : (
              <ul className="space-y-2">
                {recent.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs text-teal-700">Open</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-6 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Technical details</div>
            <dl className="space-y-2 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">URL</dt>
                <dd className="max-w-[60%] truncate text-right">{currentUrl || "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Referrer</dt>
                <dd className="max-w-[60%] truncate text-right">{referrer || "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Timestamp</dt>
                <dd className="max-w-[60%] truncate text-right">{timestamp || "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Status</dt>
                <dd className="max-w-[60%] truncate text-right">404</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Request ID</dt>
                <dd className="max-w-[60%] truncate text-right">{(() => { try { const s = (currentUrl || "") + "|" + (timestamp || ""); let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0 } return Math.abs(h).toString(16).slice(0,8) } catch { return "—" } })()}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDetailsOpen((v) => !v)}
                aria-expanded={detailsOpen}
              >
                {detailsOpen ? "Hide troubleshooting tips" : "Show troubleshooting tips"}
              </Button>
              {detailsOpen && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  <li>Verify the URL or try reloading the page.</li>
                  <li>Use the search to find your project or report.</li>
                  <li>If this keeps happening, contact support.</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800 underline-offset-4 hover:underline"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>

          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-800 underline-offset-4 hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
