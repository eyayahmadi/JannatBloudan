import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { processInvoicePayment } from "@/lib/caisse/process-payment"
import { recomputeTotalsFromSubtotal, sumActiveSubtotal, type InvoiceItemRow } from "@/lib/caisse/recalc-invoice"
import { friendlyPaymentError } from "@/lib/caisse/friendly-payment-error"
import { staffPaymentCtxFromAuth } from "@/lib/caisse/resolve-staff-user-id"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Passe une facture en hospitalité/offert maison — total 0, hors CA net, lignes conservées, encaissement hospitality. */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : ""
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""
  const billingTypeRaw = typeof body.billing_type === "string" ? body.billing_type.trim().toLowerCase() : "hospitality"
  const billingType = billingTypeRaw === "complimentary" ? "complimentary" : "hospitality"

  if (!invoiceId || reason.length < 3) {
    return NextResponse.json({ error: "invoice_id et reason (≥3) requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  const { data: inv, error: invErr } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle()
  if (invErr || !inv) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  const st = String((inv as { status?: string }).status ?? "").toLowerCase()
  if (st === "cancelled" || st === "refunded") return NextResponse.json({ error: "Facture fermée définitivement" }, { status: 409 })
  if (st === "paid") return NextResponse.json({ error: "Facture déjà payée" }, { status: 409 })

  const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId)
  const itemRows = (items ?? []) as InvoiceItemRow[]
  const activeHt = sumActiveSubtotal(itemRows)
  const storedGross = Number((inv as { gross_before_discount?: unknown }).gross_before_discount)
  const grossBefore = Number.isFinite(storedGross) ? storedGross : activeHt

  const tvaRate = Number((inv as { tva_rate?: unknown }).tva_rate ?? 0.19)

  const fullWaiveHt = activeHt
  const totals = recomputeTotalsFromSubtotal(activeHt, fullWaiveHt, tvaRate)

  const now = new Date().toISOString()
  const prevSnap =
    typeof (inv as { offer_snapshot?: unknown }).offer_snapshot === "object" &&
    (inv as { offer_snapshot?: Record<string, unknown> }).offer_snapshot
      ? (inv as { offer_snapshot: Record<string, unknown> }).offer_snapshot
      : {}
  const snapshot = {
    ...prevSnap,
    maison_offert: {
      label: "Offert par la maison",
      billing_type: billingType,
      at: now,
    },
  }

  const oldSnap = inv as Record<string, unknown>

  for (const row of items ?? []) {
    const id = String((row as { id?: string }).id ?? "")
    if (!id) continue
    const lineSt = String((row as { line_status?: string }).line_status ?? "").toLowerCase()
    if (lineSt === "cancelled" || lineSt === "waste") continue
    await supabase
      .from("invoice_items")
      .update({
        line_status: "offered",
        offered_by_maison: true,
      })
      .eq("id", id)
  }

  const { data: after, error: upErr } = await supabase
    .from("invoices")
    .update({
      billing_type: billingType,
      hospitality_reason: reason,
      revenue_exclude: true,
      gross_before_discount: grossBefore,
      subtotal: totals.subtotalHt,
      discount_amount: totals.discount_amount,
      tva_amount: totals.tva_amount,
      total: totals.total,
      status: st === "draft" ? "validated" : inv.status,
      offer_snapshot: snapshot,
      updated_at: now,
    })
    .eq("id", invoiceId)
    .select("*")
    .maybeSingle()

  if (upErr || !after) return NextResponse.json({ error: upErr?.message ?? "MàJ impossible" }, { status: 500 })

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "invoice_hospitality",
    entityType: "invoices",
    entityId: invoiceId,
    oldValues: oldSnap,
    newValues: after as Record<string, unknown>,
    metadata: { reason, billing_type: billingType },
  })

  const payResult = await processInvoicePayment(
    supabase,
    staffPaymentCtxFromAuth(guard.user, guard.role),
    invoiceId,
    [{ method: "hospitality", amount: 0 }],
  )

  if (!payResult.ok) {
    return NextResponse.json(
      {
        error: friendlyPaymentError(payResult.error),
        warning: "Facture marquée hospitalité mais encaissement à compléter",
        invoice: after,
      },
      { status: payResult.status },
    )
  }

  return NextResponse.json({ ok: true, invoice: payResult.invoice })
}
