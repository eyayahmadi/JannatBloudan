import type { SupabaseClient } from "@supabase/supabase-js"

/** Journal applicatif (service role) — complète les triggers DB si auth.uid() est NULL. */
export async function insertCaisseAudit(
  supabase: SupabaseClient,
  params: {
    userId: string | null
    userEmail?: string | null
    action: string
    entityType: string
    entityId: string
    oldValues?: Record<string, unknown> | null
    newValues?: Record<string, unknown> | null
    metadata?: Record<string, unknown> | null
  },
) {
  const row = {
    user_id: params.userId,
    user_email: params.userEmail ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    old_values: params.oldValues ?? null,
    new_values: params.newValues ?? null,
    metadata: params.metadata ?? null,
  }

  const { error } = await supabase.from("audit_logs").insert(row)
  if (!error) return

  const fkBroken = error.code === "23503"
  if (fkBroken && params.userId != null && params.userId !== "") {
    const { error: err2 } = await supabase.from("audit_logs").insert({
      ...row,
      user_id: null,
    })
    if (err2) console.warn("[caisse/audit]", err2.message)
    return
  }

  console.warn("[caisse/audit]", error.message)
}
