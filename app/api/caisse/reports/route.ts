import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { htFromTtcInclusive, vatFromHt } from "@/lib/caisse/vat"
import type { VatScope } from "@/lib/caisse/vat"
import { aggregateElectronicVatFromPaidInvoiceRows, type PayLine } from "@/lib/caisse/split-vat"

const ADMIN = ["ADMIN"] as const
const CASHIER_ADMIN = ["ADMIN", "CASHIER"] as const

/** Rapport journalier (caisse/admin) ou mensuel (admin) — JSON agrégés */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = (searchParams.get("period") ?? "daily").toLowerCase()
  const yearMonth = searchParams.get("month")?.slice(0, 7) // YYYY-MM
  const dayRef = searchParams.get("date")?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)

  if (period === "daily") {
    const guard = await requireRoles(CASHIER_ADMIN)
    if (!guard.ok) return guard.response
    if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
    const supabase = createServiceRoleClient()
    const start = `${dayRef}T00:00:00`
    const endIso = `${dayRef}T23:59:59.999Z`

    const [{ data: settings }, paymentsAgg] = await Promise.all([
      supabase.from("finance_tax_settings").select("vat_rate, vat_scope").eq("id", 1).maybeSingle(),
      supabase.from("payments").select("amount, method, status").gte("created_at", start).lte("created_at", endIso),
    ])

    const vatRate = Number((settings as { vat_rate?: number } | null)?.vat_rate ?? 0.19)
    const vatScope =
      ((settings as { vat_scope?: string } | null)?.vat_scope as VatScope | undefined) ?? "online_only"

    const succeeded = (paymentsAgg.data ?? []).filter((p) => String(p.status).toLowerCase() === "succeeded")
    let cash = 0
    let card = 0
    let online = 0
    for (const p of succeeded) {
      const m = String(p.method ?? "").toLowerCase()
      const a = Number(p.amount ?? 0)
      if (m === "cash") cash += a
      else if (m === "card") card += a
      else if (m === "online") online += a
    }

    const { data: invPaid } = await supabase
      .from("invoices")
      .select("id, status, payment_method, subtotal, tva_amount, total, paid_at")
      .eq("status", "paid")
      .gte("paid_at", start)
      .lte("paid_at", endIso)

    const ids = (invPaid ?? []).map((i) => (i as { id: string }).id).filter(Boolean)
    let payMap: Record<string, PayLine[]> = {}
    if (ids.length) {
      const { data: pl } = await supabase
        .from("payments")
        .select("invoice_id, amount, method")
        .in("invoice_id", ids)
        .eq("status", "succeeded")
      for (const row of pl ?? []) {
        const bid = String((row as { invoice_id?: string }).invoice_id ?? "")
        if (!bid) continue
        if (!payMap[bid]) payMap[bid] = []
        payMap[bid].push({ amount: (row as { amount?: unknown }).amount, method: (row as { method?: unknown }).method })
      }
    }

    const electronicVat = aggregateElectronicVatFromPaidInvoiceRows(invPaid ?? [], payMap)

    const { data: closing } = await supabase.from("cash_day_closings").select("*").eq("business_date", dayRef).maybeSingle()

    let extraCash = 0
    const decl = closing ? Number((closing as { cash_declared_official?: number }).cash_declared_official ?? 0) : 0
    if (vatScope === "online_plus_cash_declared" && decl > 0) {
      extraCash = vatFromHt(htFromTtcInclusive(decl, vatRate), vatRate)
    }

    const sortiesSum = (
      (
        await supabase
          .from("cash_register_movements")
          .select("amount")
          .eq("kind", "sortie_caisse")
          .gte("created_at", start)
          .lte("created_at", endIso)
      ).data ?? []
    ).reduce((s, x) => s + Number((x as { amount?: unknown }).amount ?? 0), 0)

    let advEmp = 0
    try {
      const { data: ad } = await supabase.from("employee_advances").select("amount").eq("advance_date", dayRef)
      advEmp = Math.round(((ad ?? []).reduce((s, x) => s + Number((x as { amount?: unknown }).amount ?? 0), 0) * 100)) / 100
    } catch {
      advEmp = 0
    }

    const profitRough = succeeded.reduce((s, p) => s + Number(p.amount ?? 0), 0) - sortiesSum - advEmp

    return NextResponse.json({
      ok: true,
      period: "daily",
      date: dayRef,
      totals: {
        cash,
        card,
        online,
        electronic_total: card + online,
      },
      tax: {
        vat_scope: vatScope,
        estimated_vat_due_eur: Math.round((electronicVat + extraCash) * 100) / 100,
        electronic_only_eur: electronicVat,
        from_declared_cash_eur: extraCash,
      },
      cash_movements: { sorties: sortiesSum, employee_advances: advEmp },
      closing: closing ?? null,
      profit_estimate_gross_minus_ops: Math.round(profitRough * 100) / 100,
      role: guard.role,
    })
  }

  if (period === "monthly") {
    const guard = await requireRoles(ADMIN)
    if (!guard.ok) return guard.response
    if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
    const ym = yearMonth ?? new Date().toISOString().slice(0, 7)
    const monthStart = `${ym}-01T00:00:00`
    const [sy, smo] = ym.split("-")
    const last = Number(sy) && Number(smo)
      ? new Date(Number(sy), Number(smo), 0).getDate()
      : 31
    const monthEnd = `${ym}-${String(last)}T23:59:59.999Z`

    const supabase = createServiceRoleClient()
    const { data: payRows } = await supabase
      .from("payments")
      .select("amount, method, status, created_at")
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd)
      .eq("status", "succeeded")

    let cash = 0
    let electronic = 0
    for (const p of payRows ?? []) {
      const a = Number(p.amount ?? 0)
      const m = String(p.method ?? "").toLowerCase()
      if (m === "cash") cash += a
      else electronic += a
    }

    const { data: invPaid } = await supabase
      .from("invoices")
      .select("id, status, total, tva_amount, payment_method")
      .eq("status", "paid")
      .gte("paid_at", monthStart)
      .lte("paid_at", monthEnd)

    const ids = (invPaid ?? []).map((i) => (i as { id: string }).id).filter(Boolean)
    let payMap: Record<string, PayLine[]> = {}
    if (ids.length) {
      const { data: pl } = await supabase.from("payments").select("invoice_id, amount, method").in("invoice_id", ids).eq("status", "succeeded")
      for (const row of pl ?? []) {
        const bid = String((row as { invoice_id?: string }).invoice_id ?? "")
        if (!bid) continue
        if (!payMap[bid]) payMap[bid] = []
        payMap[bid].push({ amount: (row as { amount?: unknown }).amount, method: (row as { method?: unknown }).method })
      }
    }

    const electronicVat = aggregateElectronicVatFromPaidInvoiceRows(invPaid ?? [], payMap)

    return NextResponse.json({
      ok: true,
      period: "monthly",
      month: ym,
      totals: {
        cash,
        electronic,
      },
      tax_estimated_month: electronicVat,
      invoices_paid_count: invPaid?.length ?? 0,
    })
  }

  return NextResponse.json({ error: "period must be daily|monthly" }, { status: 400 })
}
