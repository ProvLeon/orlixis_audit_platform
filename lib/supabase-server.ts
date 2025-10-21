/* eslint-disable @typescript-eslint/no-explicit-any */
// server-only Supabase helper for Storage uploads (PDF persistence)
"use server"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Env helpers
function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v || v.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return v
}

// Choose which key to use:
// - Prefer SERVICE_ROLE for server-side Storage operations (create bucket, upload, upsert)
// - Fall back to ANON if you only need read access (NOT recommended here)
const SUPABASE_URL = requiredEnv("NEXT_PUBLIC_SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
  throw new Error("Provide SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY in env.")
}

// Bucket configuration
export const REPORTS_BUCKET = process.env.SUPABASE_REPORTS_BUCKET?.trim() || "reports"
const STORAGE_IS_PUBLIC = (process.env.SUPABASE_STORAGE_PUBLIC || "true").toLowerCase() === "true"

// Lazily instantiated singleton clients
let adminClient: SupabaseClient | null = null
let publicClient: SupabaseClient | null = null

export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  if (!adminClient) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations (Storage write).")
    }
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: { fetch },
    })
  }
  return adminClient
}

export async function getSupabasePublic(): Promise<SupabaseClient> {
  if (!publicClient) {
    const key = SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY!
    publicClient = createClient(SUPABASE_URL, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: { fetch },
    })
  }
  return publicClient
}

function sanitizeFilename(input: string, fallback = "file"): string {
  const base = (input || fallback).replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "")
  return base.length > 0 ? base : fallback
}

async function ensureBucketExists(bucket: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets()
  if (listErr) {
    // If listing fails due to permissions, assume bucket exists and proceed
    return
  }
  const exists = buckets?.some((b) => b.name === bucket)
  if (!exists) {
    // Create bucket (requires service role key)
    await supabase.storage.createBucket(bucket, {
      public: STORAGE_IS_PUBLIC,
      fileSizeLimit: "100MB",
    })
  }
}

export type StorePdfResult = {
  path: string
  publicUrl?: string
  signedUrl?: string
}

/**
 * Persist a generated PDF to Supabase Storage and return a stable URL.
 * - If the bucket is public, returns a publicUrl.
 * - If private, returns a time-limited signedUrl (default 7 days).
 */
export async function storeReportPdf(options: {
  reportId: string
  projectName: string
  pdf: Buffer | ArrayBuffer | Uint8Array
  filename?: string
  bucket?: string
  signedUrlTTLSeconds?: number // only used when bucket is private
}): Promise<StorePdfResult> {
  const {
    reportId,
    projectName,
    pdf,
    filename = "security-audit-report.pdf",
    bucket = REPORTS_BUCKET,
    signedUrlTTLSeconds = 60 * 60 * 24 * 7, // 7 days
  } = options

  const supabase = getSupabaseAdmin()
  await ensureBucketExists(bucket)

  const name = sanitizeFilename(filename)
  const projectSafe = sanitizeFilename(projectName, "project")
  const ts = new Date().toISOString().replace(/[:.]/g, "-")
  const objectPath = `${reportId}/${projectSafe}-${ts}-${name}`

  // Normalize data to Node Buffer
  let data: Buffer
  if (pdf instanceof Buffer) data = pdf
  else if (pdf instanceof Uint8Array) data = Buffer.from(pdf)
  else data = Buffer.from(pdf as ArrayBuffer)

  const { error: uploadErr } = await supabase.storage.from(bucket).upload(objectPath, data, {
    contentType: "application/pdf",
    cacheControl: "max-age=31536000, immutable",
    upsert: true,
  })

  if (uploadErr) {
    throw new Error(`Failed to upload PDF to Supabase Storage: ${uploadErr.message}`)
  }

  const storage = supabase.storage.from(bucket)

  if (STORAGE_IS_PUBLIC) {
    const { data: pub } = storage.getPublicUrl(objectPath)
    return { path: objectPath, publicUrl: pub.publicUrl }
  }

  const { data: signed, error: signedErr } = await storage.createSignedUrl(objectPath, signedUrlTTLSeconds)
  if (signedErr) {
    throw new Error(`Failed to create signed URL for PDF: ${signedErr.message}`)
  }
  return { path: objectPath, signedUrl: signed.signedUrl }
}

/**
 * Get a URL for an already stored PDF.
 * - Returns public URL if bucket is public.
 * - Returns signed URL if bucket is private.
 */
export async function getReportPdfUrl(options: {
  path: string
  bucket?: string
  signedUrlTTLSeconds?: number
}): Promise<{ url: string }> {
  const { path, bucket = REPORTS_BUCKET, signedUrlTTLSeconds = 60 * 60 * 24 * 7 } = options
  const supabase = getSupabaseAdmin()
  const storage = supabase.storage.from(bucket)

  if (STORAGE_IS_PUBLIC) {
    const { data } = storage.getPublicUrl(path)
    return { url: data.publicUrl }
  }

  const { data, error } = await storage.createSignedUrl(path, signedUrlTTLSeconds)
  if (error) throw new Error(`Failed to create signed URL: ${error.message}`)
  return { url: data.signedUrl }
}
