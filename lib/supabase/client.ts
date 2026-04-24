import { createBrowserClient } from "@supabase/ssr"
import { getBrowserSupabaseEnv, getSupabaseBrowserSetupMessage } from "@/lib/supabase/config"

export function createClient() {
  const env = getBrowserSupabaseEnv()

  if (!env) {
    throw new Error(getSupabaseBrowserSetupMessage())
  }

  return createBrowserClient(env.url, env.anonKey)
}
