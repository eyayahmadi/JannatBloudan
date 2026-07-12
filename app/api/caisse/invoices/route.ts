import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import {
  deriveInvoiceTotalsFromItems,
  invoiceTotalsNeedRefresh,
  type InvoiceItemRow,
} from "@/lib/caisse/recalc-invoice"

const ROLES = ["ADMIN", "CASHIER"] as const

const SKIP_RECALC_STATUSES = new Set(["cancelled", "refunded"])

/** Factures journée (+ lignes) pour caisse — centralisé sécurité service role */
export async function GET(request: Request) {
  const guard = await requireRoles(ROLES)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ invoices: [], disabled: true })
  }

  const { searchParams } = new URL(request.url)
  const day = searchParams.get("date")?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 200)
  const start = `${day}T00:00:00`
  const endIso = `${day}T23:59:59.999Z`

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, order_id, session_id, guest_session_id, customer_name, subtotal, tva_rate, tva_amount, discount_amount, total, billing_type, hospitality_reason, revenue_exclude, gross_before_discount, offer_snapshot, status, payment_method, payment_stage, paid_at, cashier_id, notes, cancel_reason, payment_split, created_at, invoice_items(*)",
      )
      .gte("created_at", start)
      .lte("created_at", endIso)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[caisse/invoices]", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = data ?? []
    const refreshed: typeof rows = []

    for (const inv of rows) {
      const status = String((inv as { status?: string }).status ?? "").toLowerCase()
      const items = ((inv as { invoice_items?: InvoiceItemRow[] }).invoice_items ?? []) as InvoiceItemRow[]
      const vatRate = Number((inv as { tva_rate?: unknown }).tva_rate ?? 0.19)

      if (
        !SKIP_RECALC_STATUSES.has(status) &&
        items.length > 0 &&
        invoiceTotalsNeedRefresh(inv, items, vatRate)
      ) {
        const disc = Number((inv as { discount_amount?: unknown }).discount_amount ?? 0)
        const totals = deriveInvoiceTotalsFromItems(items, disc, vatRate)
        const { data: updated, error: upErr } = await supabase
          .from("invoices")
          .update({
            subtotal: totals.subtotalHt,
            discount_amount: totals.discount_amount,
            tva_amount: totals.tva_amount,
            total: totals.total,
            gross_before_discount: totals.grossTtc,
            updated_at: new Date().toISOString(),
          })
          .eq("id", (inv as { id: string }).id)
          .select(
            "id, order_id, session_id, guest_session_id, customer_name, subtotal, tva_rate, tva_amount, discount_amount, total, billing_type, hospitality_reason, revenue_exclude, gross_before_discount, offer_snapshot, status, payment_method, payment_stage, paid_at, cashier_id, notes, cancel_reason, payment_split, created_at, invoice_items(*)",
          )
          .maybeSingle()

        if (!upErr && updated) {
          refreshed.push(updated)
          continue
        }
      }

      refreshed.push(inv)
    }

    return NextResponse.json({ invoices: refreshed, date: day, role: guard.role })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
