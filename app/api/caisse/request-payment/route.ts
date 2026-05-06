import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"

const ROLES = ["ADMIN", "CASHIER", "SERVER"] as const

/** Serveur / caisse — marque paiement demandé (sans encaisser) */
export async function POST(request: Request) {
  const guard = await requireRoles(ROLES)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : ""

  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_id requis" }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data: inv } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle()
    if (!inv) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

    const st = String((inv as { status?: string }).status ?? "").toLowerCase()
    if (st === "paid" || st === "cancelled" || st === "refunded") {
      return NextResponse.json({ error: "Facture déjà terminée" }, { status: 409 })
    }

    const now = new Date().toISOString()
    const { data: after, error } = await supabase
      .from("invoices")
      .update({ payment_stage: "payment_requested", updated_at: now })
      .eq("id", invoiceId)
      .select("*")
      .maybeSingle()

    if (error || !after) return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 })

    await insertCaisseAudit(supabase, {
      userId: guard.user.id,
      action: "payment_requested",
      entityType: "invoices",
      entityId: invoiceId,
      oldValues: inv as Record<string, unknown>,
      newValues: after as Record<string, unknown>,
      metadata: { role: guard.role },
    })

    return NextResponse.json({ ok: true, invoice: after })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
