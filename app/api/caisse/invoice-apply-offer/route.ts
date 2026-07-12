import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { discountAmountForOffer } from "@/lib/caisse/offer-math"
import {
  recomputeTotalsFromSubtotal,
  round2,
  sumActiveSubtotal,
  type InvoiceItemRow,
} from "@/lib/caisse/recalc-invoice"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Applique une offre catalogue (pourcent / fixe / promo code selon données offer). Trace dans invoice_offer_redemptions. */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const invoiceId = typeof body.invoice_id === "string" ? body.invoice_id.trim() : ""
  const offerId = typeof body.offer_id === "string" ? body.offer_id.trim() : ""
  const promoCode = typeof body.promo_code === "string" ? body.promo_code.trim() : ""
  const reasonNote = typeof body.reason_note === "string" ? body.reason_note.trim().slice(0, 400) : null

  if (!invoiceId || (!offerId && !promoCode)) {
    return NextResponse.json({ error: "invoice_id et (offer_id ou promo_code) requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  const { data: inv, error: invErr } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle()
  if (invErr || !inv) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })

  const st = String((inv as { status?: string }).status ?? "").toLowerCase()
  if (st === "cancelled" || st === "refunded" || st === "paid") {
    return NextResponse.json({ error: "Statut incompatible" }, { status: 409 })
  }

  const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId)
  const itemRows = (items ?? []) as InvoiceItemRow[]
  const activeHt = sumActiveSubtotal(itemRows)
  if (activeHt <= 0) return NextResponse.json({ error: "Pas de lignes actives" }, { status: 400 })

  let q = supabase.from("promotional_offers").select("*").eq("active", true)
  if (offerId) q = q.eq("id", offerId)
  else q = q.ilike("promo_code", promoCode)

  const { data: offer, error: oErr } = await q.maybeSingle()
  if (oErr || !offer) return NextResponse.json({ error: "Offre introuvable ou inactive" }, { status: 404 })

  const now = Date.now()
  const startsAt = (offer as { starts_at?: string | null }).starts_at
  const endsAt = (offer as { ends_at?: string | null }).ends_at
  if (startsAt && new Date(startsAt).getTime() > now) {
    return NextResponse.json({ error: "Offre pas encore démarrée" }, { status: 400 })
  }
  if (endsAt && new Date(endsAt).getTime() < now) {
    return NextResponse.json({ error: "Offre expirée" }, { status: 400 })
  }

  const minAmt = Number((offer as { min_order_amount?: unknown }).min_order_amount ?? 0)
  if (Number.isFinite(minAmt) && minAmt > 0 && activeHt < minAmt) {
    return NextResponse.json({ error: `Montant minimum non atteint (${minAmt} € TTC)` }, { status: 400 })
  }

  const limit = (offer as { usage_limit?: number | null }).usage_limit
  const used = Number((offer as { usage_count?: unknown }).usage_count ?? 0)
  if (limit != null && Number.isFinite(limit) && limit >= 0 && used >= limit) {
    return NextResponse.json({ error: "Limite d’usage de l’offre atteinte" }, { status: 400 })
  }

  const { data: priorRedeem } = await supabase
    .from("invoice_offer_redemptions")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("offer_id", (offer as { id: string }).id)
    .maybeSingle()

  const amountSaved = discountAmountForOffer(activeHt, offer as Parameters<typeof discountAmountForOffer>[1], new Date())

  const tvaRate = Number((inv as { tva_rate?: unknown }).tva_rate ?? 0.19)

  let grossHt = Number((inv as { gross_before_discount?: unknown }).gross_before_discount)
  if (!Number.isFinite(grossHt) || grossHt <= 0) grossHt = activeHt

  const newDiscountTotal = Math.min(activeHt, amountSaved)
  if (!Number.isFinite(newDiscountTotal) || newDiscountTotal <= 0) {
    return NextResponse.json(
      { error: "Aucune remise applicable (ex. hors happy hour ou pourcentage non renseigné)" },
      { status: 400 },
    )
  }
  const totals = recomputeTotalsFromSubtotal(activeHt, newDiscountTotal, tvaRate)

  const offerName = String((offer as { name?: string }).name ?? "")
  const offerTypeStr = String((offer as { offer_type?: string }).offer_type ?? "")
  const conditionsText =
    (offer as { conditions_text?: string | null }).conditions_text != null
      ? String((offer as { conditions_text?: string | null }).conditions_text).trim()
      : ""
  const reasonReduction = conditionsText ? `${offerName} — ${conditionsText}` : `${offerName} (${offerTypeStr})`

  const snap = {
    ...(typeof (inv as { offer_snapshot?: unknown }).offer_snapshot === "object"
      ? ((inv as { offer_snapshot?: Record<string, unknown> }).offer_snapshot ?? {})
      : {}),
    applied: {
      name: offerName,
      offer_type: offerTypeStr,
      amount_saved: newDiscountTotal,
      original_subtotal_ht: round2(activeHt),
      final_subtotal_ht: round2(Math.max(0, activeHt - newDiscountTotal)),
      reason_reduction: reasonReduction,
      at: new Date().toISOString(),
      by_user: guard.user.id,
    },
  }

  const oldInv = inv as Record<string, unknown>
  const nowIso = new Date().toISOString()

  const { data: updated, error: upInv } = await supabase
    .from("invoices")
    .update({
      gross_before_discount: grossHt,
      discount_amount: totals.discount_amount,
      tva_amount: totals.tva_amount,
      total: totals.total,
      subtotal: totals.subtotalHt,
      offer_snapshot: snap,
      updated_at: nowIso,
    })
    .eq("id", invoiceId)
    .select("*")
    .maybeSingle()

  if (upInv || !updated) return NextResponse.json({ error: upInv?.message ?? "MàJ facture" }, { status: 500 })

  const { error: redErr } = await supabase.from("invoice_offer_redemptions").upsert(
    {
      invoice_id: invoiceId,
      offer_id: (offer as { id: string }).id,
      amount_saved: newDiscountTotal,
      applied_by: guard.user.id,
      reason_note: reasonNote,
    },
    { onConflict: "invoice_id,offer_id" },
  )

  if (redErr) return NextResponse.json({ error: redErr.message }, { status: 500 })

  if (!priorRedeem) {
    await supabase
      .from("promotional_offers")
      .update({ usage_count: used + 1 })
      .eq("id", (offer as { id: string }).id)
  }

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "offer_applied",
    entityType: "invoices",
    entityId: invoiceId,
    oldValues: oldInv,
    newValues: updated as Record<string, unknown>,
    metadata: {
      offer_id: (offer as { id: string }).id,
      amount_saved: newDiscountTotal,
      reason_note: reasonNote,
    },
  })

  return NextResponse.json({
    ok: true,
    invoice: updated,
    amount_saved: newDiscountTotal,
    offer: { id: (offer as { id: string }).id, name: (offer as { name?: string }).name },
  })
}
