/**
 * Daily revenue breakdown
 * -----------------------
 * Aggrège pour un jour donné :
 *   - revenu par station (KITCHEN / BAR / SHISHA)
 *   - revenu par méthode de paiement (cash / card / online / wallet / hospitality)
 *   - revenu par plateforme externe (Lieferando / Wolt / Uber Eats / …)
 *   - top produits / boissons / chichas
 *   - dette client (crédit non recouvert) + factures annulées / waste
 *
 * Source unique : Supabase (service role) — utilisé par `/api/caisse/revenue/daily`.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { round2 } from "@/lib/credit/types"
import { STATIONS, type Station } from "@/lib/stations/config"

export type StationKey = Station

export type TopItem = {
  product_id: string | null
  product_name: string
  units_sold: number
  revenue: number
  station: StationKey
  refused_count: number
}

export type StationRevenue = {
  revenue: number
  units_sold: number
  items_count: number
  cancelled_amount: number
  waste_count: number
  top: TopItem[]
}

export type DailyBreakdown = {
  date: string
  totals: {
    revenue: number
    revenue_paid: number
    revenue_unpaid: number
    revenue_credit: number
    discounts: number
    hospitality: number
    refunds: number
    cancelled: number
  }
  by_station: Record<StationKey, StationRevenue>
  by_payment: Record<string, number>
  by_platform: Record<string, number>
  platform_cash: number
  platform_non_cash: number
  credit: {
    open_invoices: number
    overdue_invoices: number
    total_remaining: number
  }
  caisse: {
    total_in_drawer_expected: number
    cash_in: number
    cash_out: number
    employee_advances: number
  }
  best_station: { station: StationKey | null; revenue: number }
}

type InvoiceRow = {
  id: string
  status?: string | null
  total?: number | null
  subtotal?: number | null
  tva_amount?: number | null
  discount_amount?: number | null
  billing_type?: string | null
  payment_state?: string | null
  credit_remaining?: number | null
  paid_at?: string | null
  created_at?: string | null
}

type InvoiceItemRow = {
  id: string
  invoice_id: string
  product_id?: string | null
  product_name?: string | null
  quantity?: number | null
  unit_price?: number | null
  subtotal?: number | null
  line_status?: string | null
  station?: string | null
}

type PaymentRow = {
  invoice_id?: string | null
  amount?: number | null
  method?: string | null
  status?: string | null
}

const EXCLUDED_INVOICE_STATUS = new Set(["cancelled", "refunded", "draft"])
const NON_BILLABLE = new Set(["cancelled", "refused", "replaced", "waste"])

function emptyStation(): StationRevenue {
  return {
    revenue: 0,
    units_sold: 0,
    items_count: 0,
    cancelled_amount: 0,
    waste_count: 0,
    top: [],
  }
}

function emptyByStation(): Record<StationKey, StationRevenue> {
  return {
    KITCHEN: emptyStation(),
    BAR: emptyStation(),
    SHISHA: emptyStation(),
  }
}

/**
 * Calcule le breakdown complet pour une date YYYY-MM-DD.
 */
export async function buildDailyBreakdown(
  supabase: SupabaseClient,
  date: string,
): Promise<DailyBreakdown> {
  const start = `${date}T00:00:00.000Z`
  const end = `${date}T23:59:59.999Z`

  const [{ data: invoicesRaw }, { data: externalRaw }, { data: movsRaw }, { data: empAdvRaw }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select(
          "id, status, total, subtotal, tva_amount, discount_amount, billing_type, payment_state, credit_remaining, paid_at, created_at",
        )
        .gte("created_at", start)
        .lte("created_at", end),
      supabase
        .from("external_cash_incomes")
        .select("source, payment_method, amount, source_label")
        .eq("business_date", date),
      supabase
        .from("cash_register_movements")
        .select("kind, amount")
        .gte("movement_at", start)
        .lte("movement_at", end),
      supabase.from("employee_advances").select("amount").eq("advance_date", date),
    ])

  const invoices: InvoiceRow[] = (invoicesRaw ?? []) as InvoiceRow[]
  const validInvoices = invoices.filter(
    (i) => !EXCLUDED_INVOICE_STATUS.has(String(i.status ?? "").toLowerCase()),
  )

  const invoiceIds = invoices.map((i) => i.id).filter(Boolean)
  let items: InvoiceItemRow[] = []
  let payments: PaymentRow[] = []
  if (invoiceIds.length > 0) {
    const [{ data: itemsData }, { data: paymentsData }] = await Promise.all([
      supabase
        .from("invoice_items")
        .select("id, invoice_id, product_id, product_name, quantity, unit_price, subtotal, line_status, station")
        .in("invoice_id", invoiceIds),
      supabase
        .from("payments")
        .select("invoice_id, amount, method, status")
        .in("invoice_id", invoiceIds)
        .eq("status", "succeeded"),
    ])
    items = (itemsData ?? []) as InvoiceItemRow[]
    payments = (paymentsData ?? []) as PaymentRow[]
  }

  const validInvoiceIds = new Set(validInvoices.map((i) => i.id))

  const byStation = emptyByStation()
  const topMap = new Map<string, Map<string, TopItem>>()
  for (const s of STATIONS) topMap.set(s, new Map<string, TopItem>())

  let cancelledTotal = 0

  for (const it of items) {
    if (!validInvoiceIds.has(String(it.invoice_id))) continue
    const rawStation = String(it.station ?? "KITCHEN").toUpperCase() as StationKey
    const station: StationKey = STATIONS.includes(rawStation) ? rawStation : "KITCHEN"
    const status = String(it.line_status ?? "active").toLowerCase()
    const quantity = Number(it.quantity ?? 0)
    const subtotal = Number(it.subtotal ?? (Number(it.unit_price ?? 0) * quantity))
    const slot = byStation[station]
    slot.items_count += 1
    if (NON_BILLABLE.has(status)) {
      slot.cancelled_amount = round2(slot.cancelled_amount + subtotal)
      cancelledTotal = round2(cancelledTotal + subtotal)
      if (status === "waste") slot.waste_count += 1
      if (status === "refused") {
        const tm = topMap.get(station)!
        const key = `${it.product_id ?? "noid"}::${it.product_name ?? "?"}`
        const existing = tm.get(key)
        if (existing) existing.refused_count += 1
      }
      continue
    }
    slot.revenue = round2(slot.revenue + subtotal)
    slot.units_sold += quantity

    const tm = topMap.get(station)!
    const key = `${it.product_id ?? "noid"}::${it.product_name ?? "?"}`
    const existing = tm.get(key)
    if (existing) {
      existing.units_sold += quantity
      existing.revenue = round2(existing.revenue + subtotal)
    } else {
      tm.set(key, {
        product_id: (it.product_id as string | null) ?? null,
        product_name: String(it.product_name ?? "?"),
        units_sold: quantity,
        revenue: round2(subtotal),
        station,
        refused_count: 0,
      })
    }
  }

  for (const s of STATIONS) {
    const arr = Array.from(topMap.get(s)!.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    byStation[s].top = arr
  }

  const byPayment: Record<string, number> = {}
  for (const p of payments) {
    const method = String(p.method ?? "other").toLowerCase()
    const amount = Number(p.amount ?? 0)
    if (!Number.isFinite(amount) || amount <= 0) continue
    byPayment[method] = round2((byPayment[method] ?? 0) + amount)
  }

  let revenuePaid = 0
  let revenueUnpaid = 0
  let revenueCredit = 0
  let discountsSum = 0
  let hospitalitySum = 0
  let refundsSum = 0

  for (const inv of validInvoices) {
    const total = Number(inv.total ?? 0)
    const discount = Number(inv.discount_amount ?? 0)
    const billing = String(inv.billing_type ?? "").toLowerCase()
    const state = String(inv.payment_state ?? inv.status ?? "").toUpperCase()
    const status = String(inv.status ?? "").toLowerCase()

    discountsSum = round2(discountsSum + discount)
    if (billing === "hospitality" || billing === "complimentary") {
      hospitalitySum = round2(hospitalitySum + total)
    }
    if (status === "paid") {
      revenuePaid = round2(revenuePaid + total)
    } else if (state === "CREDIT" || state === "OVERDUE") {
      revenueCredit = round2(revenueCredit + Number(inv.credit_remaining ?? total))
    } else if (state === "PARTIALLY_PAID") {
      revenuePaid = round2(revenuePaid + (total - Number(inv.credit_remaining ?? 0)))
      revenueCredit = round2(revenueCredit + Number(inv.credit_remaining ?? 0))
    } else {
      revenueUnpaid = round2(revenueUnpaid + total)
    }
  }

  for (const inv of invoices) {
    if (String(inv.status ?? "").toLowerCase() === "refunded") {
      refundsSum = round2(refundsSum + Number(inv.total ?? 0))
    }
  }

  const byPlatform: Record<string, number> = {}
  let platformCash = 0
  let platformNonCash = 0
  for (const r of (externalRaw ?? []) as Array<{ source?: string; payment_method?: string; amount?: number }>) {
    const src = String(r.source ?? "other")
    const meth = String(r.payment_method ?? "")
    const amt = Number(r.amount ?? 0)
    if (!Number.isFinite(amt) || amt <= 0) continue
    byPlatform[src] = round2((byPlatform[src] ?? 0) + amt)
    if (meth === "cash") platformCash = round2(platformCash + amt)
    else platformNonCash = round2(platformNonCash + amt)
  }

  let cashIn = byPayment.cash ?? 0
  cashIn = round2(cashIn + platformCash)

  let cashOut = 0
  let employeeAdvancesFromMov = 0
  for (const m of (movsRaw ?? []) as Array<{ kind?: string; amount?: number }>) {
    const k = String(m.kind ?? "")
    const a = Number(m.amount ?? 0)
    if (!Number.isFinite(a)) continue
    if (k === "sortie_caisse") cashOut += a
    else if (k === "annulation_sortie") cashOut -= a
    else if (k === "avance_salaire") employeeAdvancesFromMov += a
  }

  const advancesFromTable = (empAdvRaw ?? []).reduce(
    (s, r) => s + Number((r as { amount?: number }).amount ?? 0),
    0,
  )

  const employeeAdvances = round2(Math.max(employeeAdvancesFromMov, advancesFromTable))
  cashOut = round2(cashOut)

  const drawerExpected = round2(cashIn - cashOut - employeeAdvances)

  const totalRevenue = round2(revenuePaid + revenueCredit + revenueUnpaid)

  const { data: creditAgg } = await supabase
    .from("v_client_credit_summary")
    .select("open_invoices, overdue_invoices, total_remaining")

  let creditOpen = 0
  let creditOverdue = 0
  let creditRemaining = 0
  for (const r of (creditAgg ?? []) as Array<{
    open_invoices?: number
    overdue_invoices?: number
    total_remaining?: number
  }>) {
    creditOpen += Number(r.open_invoices ?? 0)
    creditOverdue += Number(r.overdue_invoices ?? 0)
    creditRemaining += Number(r.total_remaining ?? 0)
  }

  let bestStation: StationKey | null = null
  let bestRevenue = -1
  for (const s of STATIONS) {
    if (byStation[s].revenue > bestRevenue) {
      bestStation = s
      bestRevenue = byStation[s].revenue
    }
  }

  return {
    date,
    totals: {
      revenue: totalRevenue,
      revenue_paid: revenuePaid,
      revenue_unpaid: revenueUnpaid,
      revenue_credit: revenueCredit,
      discounts: discountsSum,
      hospitality: hospitalitySum,
      refunds: refundsSum,
      cancelled: cancelledTotal,
    },
    by_station: byStation,
    by_payment: byPayment,
    by_platform: byPlatform,
    platform_cash: platformCash,
    platform_non_cash: platformNonCash,
    credit: {
      open_invoices: creditOpen,
      overdue_invoices: creditOverdue,
      total_remaining: round2(creditRemaining),
    },
    caisse: {
      total_in_drawer_expected: drawerExpected,
      cash_in: cashIn,
      cash_out: cashOut,
      employee_advances: employeeAdvances,
    },
    best_station: { station: bestStation, revenue: bestRevenue < 0 ? 0 : bestRevenue },
  }
}

/**
 * Sérialise un breakdown en CSV (compatible Excel).
 */
export function breakdownToCsv(b: DailyBreakdown): string {
  const eur = (n: number) => n.toFixed(2).replace(".", ",")
  const lines: string[] = []
  lines.push(`Rapport journalier;${b.date}`)
  lines.push("")
  lines.push("SECTION;Libellé;Montant (EUR)")
  lines.push(`Total;Chiffre d'affaires;${eur(b.totals.revenue)}`)
  lines.push(`Total;Payé;${eur(b.totals.revenue_paid)}`)
  lines.push(`Total;Impayé;${eur(b.totals.revenue_unpaid)}`)
  lines.push(`Total;Crédit (kridi);${eur(b.totals.revenue_credit)}`)
  lines.push(`Total;Remises;${eur(b.totals.discounts)}`)
  lines.push(`Total;Hospitalité;${eur(b.totals.hospitality)}`)
  lines.push(`Total;Remboursements;${eur(b.totals.refunds)}`)
  lines.push(`Total;Annulations;${eur(b.totals.cancelled)}`)
  lines.push("")
  lines.push("Stations;Station;Revenu;Unités;Annulé;Waste")
  for (const s of STATIONS) {
    const r = b.by_station[s]
    lines.push(`Stations;${s};${eur(r.revenue)};${r.units_sold};${eur(r.cancelled_amount)};${r.waste_count}`)
  }
  lines.push("")
  lines.push("Paiements;Méthode;Montant")
  for (const [m, v] of Object.entries(b.by_payment)) {
    lines.push(`Paiements;${m};${eur(v)}`)
  }
  lines.push("")
  lines.push("Plateformes;Source;Montant")
  for (const [src, v] of Object.entries(b.by_platform)) {
    lines.push(`Plateformes;${src};${eur(v)}`)
  }
  lines.push("")
  lines.push("Caisse;Libellé;Montant")
  lines.push(`Caisse;Cash entrant (table + plateformes);${eur(b.caisse.cash_in)}`)
  lines.push(`Caisse;Sorties caisse;${eur(b.caisse.cash_out)}`)
  lines.push(`Caisse;Avances employés;${eur(b.caisse.employee_advances)}`)
  lines.push(`Caisse;Tiroir attendu;${eur(b.caisse.total_in_drawer_expected)}`)
  lines.push("")
  lines.push("Crédit clients;Libellé;Valeur")
  lines.push(`Crédit clients;Factures ouvertes;${b.credit.open_invoices}`)
  lines.push(`Crédit clients;Factures en retard;${b.credit.overdue_invoices}`)
  lines.push(`Crédit clients;Total restant dû;${eur(b.credit.total_remaining)}`)
  return lines.join("\n")
}
