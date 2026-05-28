import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { netSortieCaisseFromRows } from "@/lib/caisse/cash-movements"

const ALLOW = ["ADMIN", "CASHIER"] as const

/**
 * POST clôture journée avec cash déclaré officiel + cash interne résiduel.
 * Historisation immuable côté logique métier — pas DELETE exposé au client.
 */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv())
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const businessDate =
    typeof body.business_date === "string" ? body.business_date.slice(0, 10) : ""

  const cashCounted = Number(body.cash_counted_physical)
  const cashDeclared = Number(body.cash_declared_official)
  const comment =
    typeof body.declaration_comment === "string" ? body.declaration_comment.trim() : null

  if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    return NextResponse.json({ error: "business_date invalide (YYYY-MM-DD)" }, { status: 400 })
  }
  if (!Number.isFinite(cashCounted) || cashCounted < 0) {
    return NextResponse.json({ error: "cash_counted_physical invalide" }, { status: 400 })
  }
  if (!Number.isFinite(cashDeclared) || cashDeclared < 0) {
    return NextResponse.json({ error: "cash_declared_official invalide" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const start = `${businessDate}T00:00:00`
  const endIso = `${businessDate}T23:59:59.999Z`

  const existing = await supabase
    .from("cash_day_closings")
    .select("id")
    .eq("business_date", businessDate)
    .maybeSingle()

  if (existing.error && existing.error.code !== "PGRST116") console.error(existing.error)
  if (existing.data?.id) {
    return NextResponse.json({ error: "Journée déjà clôturée (contact admin pour correction)." }, { status: 409 })
  }

  try {
    const { data: payRows } = await supabase
      .from("payments")
      .select("amount, method")
      .gte("created_at", start)
      .lte("created_at", endIso)
      .eq("status", "succeeded")

    let cashPaid = (payRows ?? [])
      .filter((p: { method?: string }) => (p.method ?? "").toLowerCase() === "cash")
      .reduce((s, p: { amount?: unknown }) => s + Number(p.amount ?? 0), 0)

    let totalSales = (payRows ?? []).reduce((s, p: { amount?: unknown }) => s + Number(p.amount ?? 0), 0)

    let sorties = 0
    let advancesEmp = 0
    const { data: movs } = await supabase
      .from("cash_register_movements")
      .select("kind, amount")
      .gte("movement_at", start)
      .lte("movement_at", endIso)

    sorties = netSortieCaisseFromRows(movs ?? [])

    for (const r of movs ?? []) {
      const k = String((r as { kind?: string }).kind)
      const a = Number((r as { amount?: unknown }).amount ?? 0)
      if (k === "avance_salaire") advancesEmp += a
    }

    const { data: advTab } = await supabase.from("employee_advances").select("amount").eq("advance_date", businessDate)
    advancesEmp = Math.max(
      advancesEmp,
      Math.round((advTab ?? []).reduce((s, x: { amount?: unknown }) => s + Number(x.amount ?? 0), 0) * 100) / 100,
    )

    let cardPaid = (payRows ?? [])
      .filter((p: { method?: string }) => (p.method ?? "").toLowerCase() === "card")
      .reduce((s, p: { amount?: unknown }) => s + Number(p.amount ?? 0), 0)
    let onlinePaid = (payRows ?? [])
      .filter((p: { method?: string }) => (p.method ?? "").toLowerCase() === "online")
      .reduce((s, p: { amount?: unknown }) => s + Number(p.amount ?? 0), 0)
    cardPaid = Math.round(cardPaid * 100) / 100
    onlinePaid = Math.round(onlinePaid * 100) / 100

    cashPaid = Math.round(cashPaid * 100) / 100
    sorties = Math.round(sorties * 100) / 100
    advancesEmp = Math.round(advancesEmp * 100) / 100

    const cashExpectedSystem = Math.max(0, Math.round((cashPaid - sorties - advancesEmp) * 100) / 100)
    totalSales = Math.round(totalSales * 100) / 100

    const cashInternalResidual = Math.round((cashExpectedSystem - cashDeclared) * 100) / 100
    const countedVsGap = Math.round((cashCounted - cashExpectedSystem) * 100) / 100

    const { data: invDay } = await supabase.from("invoices").select("status").gte("created_at", start).lte("created_at", endIso)

    const invoicesToday = {
      draft: 0,
      validated_open: 0,
      paid: 0,
      cancelled: 0,
      refunded: 0,
    }

    if (invDay) {
      for (const row of invDay) {
        const st = String((row as { status?: string }).status ?? "").toLowerCase()
        if (st === "draft") invoicesToday.draft++
        else if (st === "validated") invoicesToday.validated_open++
        else if (st === "paid") invoicesToday.paid++
        else if (st === "cancelled") invoicesToday.cancelled++
        else if (st === "refunded") invoicesToday.refunded++
      }
    }


    const { data: inserted, error: insErr } = await supabase
      .from("cash_day_closings")
      .insert({
        business_date: businessDate,
        total_sales: totalSales,
        total_cash_payments: cashPaid,
        total_card_payments: cardPaid,
        total_online_payments: onlinePaid,
        total_sorties_caisse: sorties,
        total_avances_salaires: advancesEmp,
        open_invoices_count: invoicesToday.draft + invoicesToday.validated_open,
        paid_invoices_count: invoicesToday.paid,
        cancelled_invoices_count: invoicesToday.cancelled + invoicesToday.refunded,
        cash_expected_system: cashExpectedSystem,
        cash_counted_physical: cashCounted,
        cash_declared_official: cashDeclared,
        cash_internal_residual: cashInternalResidual,
        counted_vs_expected_gap: countedVsGap,
        declaration_comment: comment,
        declared_entered_by: guard.user.id,
        declared_entered_at: new Date().toISOString(),
        closed_by: guard.user.id,
        finalized: true,
      })
      .select("*")
      .single()

    if (insErr) {
      console.error("[closing]", insErr)
      return NextResponse.json({ error: insErr.message, hint: "Migration 14 exécutée ?" }, { status: 500 })
    }

    if (Math.abs(countedVsGap) >= 40) {
      await supabase.from("caisse_intelligence_alerts").insert({
        severity: Math.abs(countedVsGap) >= 150 ? "critical" : "warning",
        code: "CLOSING_PHYSICAL_GAP",
        message: `Écart compté vs attendu ${countedVsGap.toFixed(2)} EUR.`,
        payload: {
          date: businessDate,
          countedVsGap,
          cashier: guard.user.id,
        },
        business_date: businessDate,
      })
    }

    return NextResponse.json({ success: true, closing: inserted })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
