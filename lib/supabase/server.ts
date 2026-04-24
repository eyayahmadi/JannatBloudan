import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getServerSupabaseEnv } from "@/lib/supabase/config"

export async function createClient() {
  const cookieStore = await cookies()
  const env = getServerSupabaseEnv()

  if (!env) {
    throw new Error(
      "Missing Supabase server environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in pfe-main/.env.local.",
    )
  }

  return createServerClient(env.url, env.serviceRoleKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignorer les erreurs de cookies (peut arriver en Server Components)
        }
      },
    },
  })
}
