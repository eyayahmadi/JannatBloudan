import type { SupabaseClient } from "@supabase/supabase-js"

export type PaymentRefInput = {
  session_id?: string | null
  order_id?: string | null
  guest_session_id?: string | null
}

export type SanitizedPaymentRefs = {
  session_id: string | null
  order_id: string | null
  guest_session_id: string | null
}

async function resolveExistingId(
  supabase: SupabaseClient,
  table: "table_sessions" | "orders" | "guest_sessions",
  raw: string | null | undefined,
): Promise<string | null> {
  const id = typeof raw === "string" ? raw.trim() : ""
  if (!id) return null
  const { data } = await supabase.from(table).select("id").eq("id", id).maybeSingle()
  return data?.id ? String(data.id) : null
}

/** Drops FK targets that no longer exist — prevents payments insert violations. */
export async function sanitizePaymentRefs(
  supabase: SupabaseClient,
  refs: PaymentRefInput,
): Promise<SanitizedPaymentRefs> {
  const [session_id, order_id, guest_session_id] = await Promise.all([
    resolveExistingId(supabase, "table_sessions", refs.session_id),
    resolveExistingId(supabase, "orders", refs.order_id),
    resolveExistingId(supabase, "guest_sessions", refs.guest_session_id),
  ])
  return { session_id, order_id, guest_session_id }
}
