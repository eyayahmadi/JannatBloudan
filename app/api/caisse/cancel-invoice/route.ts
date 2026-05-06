import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Annulation avec raison — données conservées (pas DELETE) */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : ""
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""

  if (!invoiceId || reason.length < 3) {
    return NextResponse.json({ error: "invoice_id et reason (≥3 caractères)" }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data: inv } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle()
    if (!inv) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

    const st = String((inv as { status?: string }).status ?? "").toLowerCase()
    if (st === "paid") {
      if (guard.role !== "ADMIN") {
        return NextResponse.json({ error: "Annulation facture payée réservée admin (remboursement à traiter)." }, { status: 403 })
      }
    }
    if (st === "cancelled") {
      return NextResponse.json({ ok: true, idempotent: true })
    }

    const now = new Date().toISOString()
    const { data: after, error } = await supabase
      .from("invoices")
      .update({
        status: "cancelled",
        payment_stage: "cancelled",
        cancel_reason: reason,
        updated_at: now,
      })
      .eq("id", invoiceId)
      .select("*")
      .maybeSingle()

    if (error || !after) return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 })

    await insertCaisseAudit(supabase, {
      userId: guard.user.id,
      userEmail: guard.user.email ?? null,
      action: "invoice_cancelled",
      entityType: "invoices",
      entityId: invoiceId,
      oldValues: inv as Record<string, unknown>,
      newValues: after as Record<string, unknown>,
      metadata: { reason },
    })

    const todayStart = `${now.slice(0, 10)}T00:00:00`
    const { count: cancelCount } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("updated_at", todayStart)

    if ((cancelCount ?? 0) > 5) {
      await supabase.from("caisse_intelligence_alerts").insert({
        severity: "warning",
        code: "MULTIPLE_CANCELS_DAY",
        message: "Nombre d’annulations élevée aujourd’hui.",
        payload: { approximate_count: cancelCount },
        business_date: now.slice(0, 10),
      })
    }

    return NextResponse.json({ ok: true, invoice: after })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
