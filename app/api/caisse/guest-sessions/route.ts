import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"

const ALLOW = ["ADMIN", "CASHIER", "SERVER"] as const

/** Liste les invités d’une session table (split commande). */
export async function GET(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ guests: [], disabled: true })

  const { searchParams } = new URL(request.url)
  const parent = searchParams.get("parent_session_id")?.trim()
  if (!parent) {
    return NextResponse.json({ error: "parent_session_id requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("guest_sessions")
    .select("id,parent_session_id,label,sort_order,meta,created_at,closed_at")
    .eq("parent_session_id", parent)
    .order("sort_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ guests: data ?? [] })
}

/** Crée un sous-panier invité lié à table_sessions. */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const parentSessionId = typeof body.parent_session_id === "string" ? body.parent_session_id.trim() : ""
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, 120) : "Invité"
  const sortOrder = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0

  if (!parentSessionId) {
    return NextResponse.json({ error: "parent_session_id requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data: sess } = await supabase.from("table_sessions").select("id,closed_at").eq("id", parentSessionId).maybeSingle()
  if (!sess || (sess as { closed_at?: string | null }).closed_at) {
    return NextResponse.json({ error: "Session table introuvable ou fermée" }, { status: 404 })
  }

  const { data: row, error } = await supabase
    .from("guest_sessions")
    .insert({
      parent_session_id: parentSessionId,
      label,
      sort_order: sortOrder,
    })
    .select("*")
    .maybeSingle()

  if (error || !row) return NextResponse.json({ error: error?.message ?? "Erreur insert" }, { status: 500 })

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "guest_session_created",
    entityType: "guest_sessions",
    entityId: (row as { id: string }).id,
    newValues: row as Record<string, unknown>,
    metadata: { parent_session_id: parentSessionId, label },
  })

  return NextResponse.json({ ok: true, guest: row })
}
