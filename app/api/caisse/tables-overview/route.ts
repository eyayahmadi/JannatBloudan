import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const ROLES = ["ADMIN", "CASHIER", "SERVER"] as const

/**
 * Vue tables + session ouverte + total + statut paiement (quand données Supabase dispo).
 */
export async function GET() {
  const guard = await requireRoles(ROLES)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv())
    return NextResponse.json({ tables: [], message: "Pas de base" })

  try {
    const supabase = createServiceRoleClient()
    const { data: tables, error: tErr } = await supabase
      .from("restaurant_tables")
      .select("id, table_number, zone, status, capacity, current_session_id")
      .order("table_number")

    if (tErr) return NextResponse.json({ tables: [], error: tErr.message })

    const { data: openSessions } = await supabase
      .from("table_sessions")
      .select("id, table_id, total, paid, payment_method, opened_at")
      .is("closed_at", null)

    const out = (tables ?? []).map((t) => {
      const sess = (openSessions ?? []).find(
        (s) => Number(s.table_id) === Number((t as { id?: number }).id),
      )
      const pm = String(sess?.payment_method ?? "").toLowerCase()
      const paid = Boolean(sess?.paid)
      let payment_stage = "non payé"
      if (sess) {
        if (paid && pm === "cash") payment_stage = "payé cash"
        else if (paid && (pm === "online" || pm === "card")) payment_stage = pm === "online" ? "payé online" : "payé carte"
        else if (!paid && pm) payment_stage = "paiement demandé"
        else if (!paid) payment_stage = "non payé"
      }
      return {
        table_id: t.id,
        table_number: t.table_number,
        zone: t.zone,
        restaurant_status: (t as { status?: string }).status,
        session: sess
          ? {
              id: sess.id,
              total: Number(sess.total ?? 0),
              paid,
              payment_method: sess.payment_method ?? null,
              payment_stage,
            }
          : null,
      }
    })

    return NextResponse.json({ tables: out, role: guard.role })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
