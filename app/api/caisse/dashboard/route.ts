import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { htFromTtcInclusive, vatFromHt } from "@/lib/caisse/vat"
import type { VatScope } from "@/lib/caisse/vat"
import { aggregateElectronicVatFromPaidInvoiceRows, type PayLine } from "@/lib/caisse/split-vat"
import { netSortieCaisseFromRows } from "@/lib/caisse/cash-movements"

const ROLES = ["ADMIN", "CASHIER"] as const

/** Agrégés jour pour le module Gestion de caisse intelligente. */
export async function GET(request: Request) {
  const guard = await requireRoles(ROLES)
  if (!guard.ok) return guard.response
  const { searchParams } = new URL(request.url)
  const day =
    searchParams.get("date")?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      disabled: true,
      date: day,
      summary: {},
      alerts: [
        {
          code: "no_db",
          severity: "info",
          message: "Configurez Supabase pour les données live.",
        },
      ],
    })
  }

  const supabase = createServiceRoleClient()
  const start = `${day}T00:00:00`
  const endIso = `${day}T23:59:59.999Z`

  try {
    const { data: settings } = await supabase
      .from("finance_tax_settings")
      .select("vat_rate, vat_scope")
      .eq("id", 1)
      .maybeSingle()

    const vatRate = Number((settings as { vat_rate?: number } | null)?.vat_rate ?? 0.19)
    const vatScope =
      ((settings as { vat_scope?: string } | null)?.vat_scope as VatScope | undefined) ?? "online_only"

    const { data: paymentsRows } = await supabase
      .from("payments")
      .select("amount, method, status")
      .gte("created_at", start)
      .lte("created_at", endIso)

    const invoiceStats = {
      draft: 0,
      validated_open: 0,
      paid: 0,
      cancelled: 0,
      refunded: 0,
    }

    const { data: invRowsAll } = await supabase
      .from("invoices")
      .select("id, status")
      .gte("created_at", start)
      .lte("created_at", endIso)

    for (const row of invRowsAll ?? []) {
      const st = String((row as { status?: string }).status ?? "").toLowerCase()
      if (st === "draft") invoiceStats.draft++
      else if (st === "validated") invoiceStats.validated_open++
      else if (st === "paid") invoiceStats.paid++
      else if (st === "cancelled") invoiceStats.cancelled++
      else if (st === "refunded") invoiceStats.refunded++
    }

    const { data: invPaidDay } = await supabase
      .from("invoices")
      .select(
        "id, status, payment_method, subtotal, tva_amount, total, paid_at, created_at",
      )
      .eq("status", "paid")
      .gte("paid_at", start)
      .lte("paid_at", endIso)

    const invIds = (invPaidDay ?? [])
      .map((i) => String((i as { id?: string }).id ?? ""))
      .filter(Boolean)
    const paymentsByInvoiceId: Record<string, PayLine[]> = {}
    if (invIds.length) {
      const { data: payLines } = await supabase
        .from("payments")
        .select("invoice_id, amount, method, status")
        .in("invoice_id", invIds)
        .eq("status", "succeeded")

      for (const pl of payLines ?? []) {
        const bid = String((pl as { invoice_id?: string }).invoice_id ?? "")
        if (!bid) continue
        if (!paymentsByInvoiceId[bid]) paymentsByInvoiceId[bid] = []
        paymentsByInvoiceId[bid].push({
          amount: (pl as { amount?: unknown }).amount,
          method: (pl as { method?: unknown }).method,
        })
      }
    }

    let totalsTtcCash = 0
    let totalsTtcElectronic = 0
    let totalInvoicesPaid = 0

    for (const inv of invPaidDay ?? []) {
      const invId = String((inv as { id?: string }).id ?? "")
      const t = Number((inv as { total?: unknown }).total ?? 0)
      totalInvoicesPaid += t
      const pm = String((inv as { payment_method?: string }).payment_method ?? "").toLowerCase()
      const lines = paymentsByInvoiceId[invId] ?? []
      if (pm === "split" || lines.length > 1) {
        let cashPart = 0
        let electro = 0
        const useLines = lines.length > 0 ? lines : [{ method: pm, amount: t }]
        for (const p of useLines) {
          const a = Number((p as { amount?: unknown }).amount ?? 0)
          const m = String((p as { method?: unknown }).method ?? "").toLowerCase()
          if (m === "cash") cashPart += a
          else electro += a
        }
        totalsTtcCash += cashPart
        totalsTtcElectronic += electro
      } else if (pm === "cash") {
        totalsTtcCash += t
      } else {
        totalsTtcElectronic += t
      }
    }

    totalInvoicesPaid = Math.round(totalInvoicesPaid * 100) / 100

    const payList = paymentsRows ?? []
    const succeeded = payList.filter((p) => String(p.status ?? "").toLowerCase() === "succeeded")

    let cashPaid =
      succeeded
        .filter((p) => String(p.method ?? "").toLowerCase() === "cash")
        .reduce((s, p) => s + Number(p.amount ?? 0), 0) ?? 0
    let cardPaid =
      succeeded
        .filter((p) => String(p.method ?? "").toLowerCase() === "card")
        .reduce((s, p) => s + Number(p.amount ?? 0), 0) ?? 0
    let onlinePaid =
      succeeded
        .filter((p) => String(p.method ?? "").toLowerCase() === "online")
        .reduce((s, p) => s + Number(p.amount ?? 0), 0) ?? 0

    cashPaid = Math.round(cashPaid * 100) / 100
    cardPaid = Math.round(cardPaid * 100) / 100
    onlinePaid = Math.round(onlinePaid * 100) / 100

    const paymentsSum = Math.round(succeeded.reduce((s, p) => s + Number(p.amount ?? 0), 0) * 100) / 100

    const totalVenturesToday = paymentsSum > 0 ? paymentsSum : totalInvoicesPaid

    if (cashPaid === 0 && totalsTtcCash > 0) cashPaid = totalsTtcCash

    let sortiesSum = 0
    let avancesEmpSum = 0
    let avancesClientSum = 0

    const { data: movs } = await supabase
      .from("cash_register_movements")
      .select("kind, amount")
      .gte("movement_at", start)
      .lte("movement_at", endIso)

    sortiesSum = netSortieCaisseFromRows(movs ?? [])

    for (const m of movs ?? []) {
      const k = String((m as { kind?: string }).kind)
      const a = Number((m as { amount?: unknown }).amount ?? 0)
      if (k === "avance_salaire") avancesEmpSum += a
      else if (k === "avance_client") avancesClientSum += a
    }
    avancesEmpSum = Math.round(avancesEmpSum * 100) / 100
    avancesClientSum = Math.round(avancesClientSum * 100) / 100

    let employeeAdvancesFromTable = 0
    try {
      const { data: advData } = await supabase.from("employee_advances").select("amount").eq("advance_date", day)
      employeeAdvancesFromTable = Math.round(
        (advData ?? []).reduce((s, r: { amount?: unknown }) => s + Number(r.amount ?? 0), 0) * 100,
      ) / 100
    } catch {
      /* table absente avant migration */
    }

    const employeeAdvancesTotal = Math.max(avancesEmpSum, employeeAdvancesFromTable)

    // Entrées caisse externes (Lieferando, Wolt, Uber Eats, virements, ...)
    let externalIncomesTotal = 0
    let externalCashIncome = 0
    let externalNonCashIncome = 0
    const externalBySource: Record<string, number> = {}
    const externalByMethod: Record<string, number> = {}
    try {
      const { data: extRows } = await supabase
        .from("external_cash_incomes")
        .select("source, payment_method, amount")
        .eq("business_date", day)

      for (const r of extRows ?? []) {
        const a = Number((r as { amount?: unknown }).amount ?? 0)
        if (!Number.isFinite(a) || a <= 0) continue
        externalIncomesTotal += a
        const src = String((r as { source?: string }).source ?? "other")
        const meth = String((r as { payment_method?: string }).payment_method ?? "")
        externalBySource[src] = (externalBySource[src] ?? 0) + a
        if (meth) externalByMethod[meth] = (externalByMethod[meth] ?? 0) + a
        if (meth === "cash") externalCashIncome += a
        else externalNonCashIncome += a
      }

      externalIncomesTotal = Math.round(externalIncomesTotal * 100) / 100
      externalCashIncome = Math.round(externalCashIncome * 100) / 100
      externalNonCashIncome = Math.round(externalNonCashIncome * 100) / 100
      for (const k of Object.keys(externalBySource)) {
        externalBySource[k] = Math.round(externalBySource[k] * 100) / 100
      }
      for (const k of Object.keys(externalByMethod)) {
        externalByMethod[k] = Math.round(externalByMethod[k] * 100) / 100
      }
    } catch {
      /* table absente avant migration 28 */
    }

    const { data: closingRow } = await supabase.from("cash_day_closings").select("*").eq("business_date", day).maybeSingle()

    const closing = closingRow as Record<string, unknown> | null

    let cashDeclaredHtForTax: number | undefined

    const declaredOfficial = closing ? Number(closing.cash_declared_official ?? 0) : 0

    if (vatScope === "online_plus_cash_declared" && declaredOfficial > 0) {
      cashDeclaredHtForTax = htFromTtcInclusive(declaredOfficial, vatRate)
    }

    const electronicVat = aggregateElectronicVatFromPaidInvoiceRows(invPaidDay ?? [], paymentsByInvoiceId)

    const extraDeclaredCashTaxEur =
      vatScope === "online_plus_cash_declared" && cashDeclaredHtForTax && cashDeclaredHtForTax > 0
        ? vatFromHt(cashDeclaredHtForTax, vatRate)
        : 0

    const totalTaxDue = Math.round((electronicVat + extraDeclaredCashTaxEur) * 100) / 100

    const alerts: Array<{ code: string; severity: "info" | "warning" | "critical"; message: string }> = []

    if ((invPaidDay ?? []).length === 0) {
      alerts.push({
        code: "no_paid_invoice",
        severity: "info",
        message: "Aucune facture marquée payée pour cette date.",
      })
    }

    if (sortiesSum >= 700) {
      alerts.push({
        code: "high_cash_outflows",
        severity: "warning",
        message: `Sorties caisse élevées (${sortiesSum.toFixed(2)} EUR) sur la période.`,
      })
    }

    if (invoiceStats.cancelled >= 3) {
      alerts.push({
        code: "repeated_cancellations",
        severity: "warning",
        message: `${invoiceStats.cancelled} factures annulées dans la journée (vérifier motifs).`,
      })
    }

    const { data: dbAlerts } = await supabase
      .from("caisse_intelligence_alerts")
      .select("code, severity, message")
      .eq("business_date", day)
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(12)

    const ecartPotential =
      closing && closing.cash_counted_physical != null && closing.cash_expected_system != null
        ? Number(closing.cash_counted_physical) - Number(closing.cash_expected_system)
        : null

    if (ecartPotential != null && Math.abs(ecartPotential) >= 50) {
      alerts.push({
        code: "ecart_physique_eleve",
        severity: "warning",
        message: `Écart tiroir (compté − système): ${ecartPotential.toFixed(2)} EUR`,
      })
    }

    for (const a of dbAlerts ?? []) {
      const sev = String((a as { severity?: string }).severity ?? "info").toLowerCase()
      const severity = sev === "critical" ? "critical" : sev === "warning" ? "warning" : "info"
      alerts.push({
        code: String((a as { code?: string }).code ?? "db_alert"),
        severity,
        message: String((a as { message?: string }).message ?? ""),
      })
    }

    const expectedCashDrawer =
      Math.round((cashPaid + externalCashIncome - sortiesSum - employeeAdvancesTotal) * 100) / 100
    const invoicesTotalCount = (invRowsAll ?? []).length

    let creditTotalRemaining = 0
    let creditOpenInvoices = 0
    let creditOverdueInvoices = 0
    let creditClientsCount = 0
    try {
      const { data: creditRows } = await supabase
        .from("v_client_credit_summary")
        .select("open_invoices, overdue_invoices, total_remaining")
      for (const r of (creditRows ?? []) as Array<{
        open_invoices?: number
        overdue_invoices?: number
        total_remaining?: number
      }>) {
        creditTotalRemaining += Number(r.total_remaining ?? 0)
        creditOpenInvoices += Number(r.open_invoices ?? 0)
        creditOverdueInvoices += Number(r.overdue_invoices ?? 0)
        creditClientsCount += 1
      }
      creditTotalRemaining = Math.round(creditTotalRemaining * 100) / 100
    } catch {
      /* vue absente avant migration 31 */
    }

    if (creditOverdueInvoices > 0) {
      alerts.push({
        code: "credit_overdue",
        severity: creditOverdueInvoices > 5 ? "critical" : "warning",
        message: `${creditOverdueInvoices} facture(s) crédit en retard — ${creditTotalRemaining.toFixed(2)} € à recouvrer.`,
      })
    }

    return NextResponse.json({
      ok: true,
      date: day,
      summary: {
        totalSalesToday: totalVenturesToday,
        paymentsSumFromTable: paymentsSum,
        totalPaidInvoicesTtc: totalInvoicesPaid,
        cashPaid,
        cardPaid,
        onlinePaid,
        cardAndElectronic: Math.round((cardPaid + onlinePaid) * 100) / 100,
        totalsTtcFromInvoices: {
          cash: Math.round(totalsTtcCash * 100) / 100,
          electronic: Math.round(totalsTtcElectronic * 100) / 100,
        },
        sortiesCaisse: sortiesSum,
        employeeAdvances: Math.round(employeeAdvancesTotal * 100) / 100,
        advancesClient: avancesClientSum,
        externalIncomesTotal,
        externalCashIncome,
        externalNonCashIncome,
        externalBySource,
        externalByMethod,
        invoicesCounts: invoiceStats,
        invoicesTotalCount,
        creditTotalRemaining,
        creditOpenInvoices,
        creditOverdueInvoices,
        creditClientsCount,
        expectedCashDrawerAfterMovements: expectedCashDrawer,
        cashGapAtClosing:
          closing && closing.counted_vs_expected_gap != null ? Number(closing.counted_vs_expected_gap) : null,
        closingLocked: Boolean(closing?.id),
      },
      fiscal: {
        vat_rate: vatRate,
        vat_scope: vatScope,
        electronic_vat_from_invoices_eur: electronicVat,
        extra_declared_cash_tax_eur: extraDeclaredCashTaxEur,
        total_tax_due_estimate_eur: totalTaxDue,
      },
      closing,
      alerts,
      role: guard.role,
    })
  } catch (e) {
    console.error("[caisse/dashboard]", e)
    return NextResponse.json({ error: String(e), date: day }, { status: 500 })
  }
}
