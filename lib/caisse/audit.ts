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
  const { error } = await supabase.from("audit_logs").insert({
    user_id: params.userId,
    user_email: params.userEmail ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    old_values: params.oldValues ?? null,
    new_values: params.newValues ?? null,
    metadata: params.metadata ?? null,
  })
  if (error) console.warn("[caisse/audit]", error.message)
}
