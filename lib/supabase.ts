import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr"

// Browser singleton
let browserClient: ReturnType<typeof createBrowserClient> | null = null
export function getSupabaseBrowser() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )
  return browserClient
}

// Server singleton
let serverClient: ReturnType<typeof createServerClient> | null = null
export function getSupabaseServer(cookies: {
  get(name: string): { value: string } | undefined
  set(name: string, value: string, options: CookieOptions): void
}) {
  if (serverClient) return serverClient
  // Prefer server-only vars; fall back to NEXT_PUBLIC_* if needed
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  serverClient = createServerClient(url, anon, { cookies })
  return serverClient
}
