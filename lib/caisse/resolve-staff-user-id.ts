import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Resolves auth session user id → public.users.id for FK columns (processed_by, cashier_id).
 * Returns null when no matching staff row exists — never pass auth id that isn't in users.
 */
export async function resolveStaffUserId(
  supabase: SupabaseClient,
  authUserId: string | null | undefined,
  email?: string | null,
): Promise<string | null> {
  const id = typeof authUserId === "string" ? authUserId.trim() : ""
  if (id) {
    const { data } = await supabase.from("users").select("id").eq("id", id).maybeSingle()
    if (data?.id) return String(data.id)
  }

  const mail = typeof email === "string" ? email.trim().toLowerCase() : ""
  if (mail) {
    const { data } = await supabase.from("users").select("id").eq("email", mail).maybeSingle()
    if (data?.id) return String(data.id)
  }

  return null
}
