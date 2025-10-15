
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-side Supabase client using the Service Role key.
 * IMPORTANT:
 * - Do NOT import this file from any client-side (browser) code.
 * - The Service Role key bypasses RLS and must only run on the server.
 *
 * Environment variables expected:
 * - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_DB_SCHEMA (optional, defaults to "public")
 */

type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// If you generate typed DB definitions (via Supabase typegen), replace `unknown` with `Database`.
// import type { Database } from "@/lib/supabase/types"
type Database = unknown

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const DB_SCHEMA = process.env.SUPABASE_DB_SCHEMA ?? "public"

declare global {
  // eslint-disable-next-line no-var
  var __supabase_admin__: SupabaseClient<Database> | undefined
}

/**
 * Creates (or returns a cached) Supabase client configured with the Service Role key.
 * Uses a global singleton to avoid re-creating clients during hot reloads in dev.
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (!globalThis.__supabase_admin__) {
    const url = getEnv("SUPABASE_URL", SUPABASE_URL)
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE_KEY ?? ANON_KEY)

    globalThis.__supabase_admin__ = createClient<Database>(
      url,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        db: {
          schema: DB_SCHEMA
        },
        global: {
          headers: {
            "X-Client-Info": "orlixis-audit-platform/server"
          }
        }
      }
    )
  }

  return globalThis.__supabase_admin__
}

/**
 * Singleton instance for convenience.
 * Prefer calling getSupabaseServerClient() in functions for testability,
 * but this export can be used for quick imports in server-only modules.
 */
export const supabaseAdmin = getSupabaseServerClient()
