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
  serverClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies,
    },
  )
  return serverClient
}
