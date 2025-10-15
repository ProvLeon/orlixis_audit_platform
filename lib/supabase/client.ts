/**
 * Supabase browser client for authenticated user sessions.
 *
 * Usage:
 * - Import this ONLY from client components or client-side utilities.
 * - It uses the public anon key and persists sessions in localStorage.
 *
 * Required env vars (exposed to the browser):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// If you generate typed DB definitions (via Supabase typegen), replace `unknown` with your `Database` type.
// import type { Database } from "@/lib/supabase/types"
type Database = unknown

function getEnv(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const PUBLIC_SUPABASE_URL = getEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL
)
const PUBLIC_SUPABASE_ANON_KEY = getEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

declare global {
  // eslint-disable-next-line no-var
  var __supabase_browser__: SupabaseClient<Database> | undefined
}

/**
 * Returns a singleton Supabase client instance for the browser.
 * The instance:
 * - Persists sessions in localStorage
 * - Auto-refreshes tokens
 * - Detects session in OAuth callback URLs
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!globalThis.__supabase_browser__) {
    const isBrowser = typeof window !== "undefined"

    globalThis.__supabase_browser__ = createClient<Database>(
      PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: isBrowser ? window.localStorage : undefined
        },
        global: {
          headers: {
            "X-Client-Info": "orlixis-audit-platform/browser"
          }
        }
      }
    )
  }

  return globalThis.__supabase_browser__
}

/**
 * Convenient singleton export.
 * Prefer calling getSupabaseBrowserClient() in tests or when customizing instantiation.
 */
export const supabase = getSupabaseBrowserClient()
