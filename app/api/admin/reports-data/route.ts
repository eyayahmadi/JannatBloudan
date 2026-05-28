/**
 * Agrégats réels pour Rapports admin (commandes + produits + stock).
 * ADMIN + service role.
 */
import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { aggregateProductLines } from "@/lib/insights/ops-rules"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Period = "today" | "week" | "month"

function parsePeriod(raw: string | null): Period {
  if (raw === "today" || raw === "month") return raw
  return "week"
}

function rangeForPeriod(period: Period): { start: Date; end: Date } {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  if (period === "today") {
    start.setHours(0, 0, 0, 0)
  } else if (period === "month") {
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(start.getDate() - 7)
    start.setHours(0, 0, 0, 0)
  }
  return { start, end }
}

function isExcludedStatus(status: string): boolean {
  const s = status.toLowerCase()
  return s === "cancelled" || s === "refunded" || s === "annulée" || s === "annulee"
}

function rnd2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Regroupe paiements réussis + caisse depuis la facturation (invoices récentes uniquement dans la fenêtre temporelle). */
async function supplementaryCommercialAggregates(supabase: ReturnType<typeof createServiceRoleClient>, startIso: string, endIso: string): Promise<
  Record<string, unknown> | undefined
> {
  type PayBucket = Record<string, { count: number; amount: number }>
  try {
    const { data: payRows, error: payErr } = await supabase
      .from("payments")
      .select("method,amount,status,created_at")
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .limit(20000)

    if (payErr) console.warn("[reports-data] payments aggregate", payErr)

    let paymentsSucceededTotal = 0
    const paymentsByMethod: PayBucket = {}
    let cashSucceeded = 0
    let onlineSucceeded = 0 // online + carte + wallet / hors espèces
    for (const row of payRows ?? []) {
      const st = String((row as { status?: string }).status ?? "").toLowerCase()
      if (st !== "succeeded") continue
      const methodRaw = String((row as { method?: string }).method ?? "unknown").toLowerCase()
      const amt = Math.max(0, Number((row as { amount?: unknown }).amount) || 0)
      paymentsSucceededTotal += amt
      const slot = paymentsByMethod[methodRaw] ?? { count: 0, amount: 0 }
      slot.count++
      slot.amount += amt
      paymentsByMethod[methodRaw] = slot

      const isCash = methodRaw === "cash" || methodRaw === "espèces" || methodRaw === "especes"
      if (isCash) cashSucceeded += amt
      else onlineSucceeded += amt
    }

    const { data: invRows, error: invErr } = await supabase
      .from("invoices")
      .select(
        "id,status,total,discount_amount,billing_type,revenue_exclude,created_at",
      )
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .limit(20000)

    if (invErr) console.warn("[reports-data] invoices aggregate", invErr)

    let invoicesCancelledCount = 0
    let invoicePaidTotal = 0
    let invoicePaidCount = 0
    let invoicesDiscountSum = 0
    let hospitalityInvoicesTotal = 0
    let hospitalityInvoicesCount = 0
    let invoiceValidatedTotal = 0
    let invoiceValidatedCount = 0

    const invoiceIdsForItems: string[] = []
    for (const inv of invRows ?? []) {
      const row = inv as {
        id: string
        status?: string | null
        total?: unknown
        discount_amount?: unknown
        billing_type?: string | null
        revenue_exclude?: boolean | null
      }
      const status = String(row.status ?? "").toLowerCase()
      const total = Math.max(0, Number(row.total) || 0)
      const disc = Math.max(0, Number(row.discount_amount) || 0)

      if (status === "cancelled") {
        invoicesCancelledCount++
        continue
      }

      invoiceIdsForItems.push(row.id)

      const bt = String(row.billing_type ?? "normal").toLowerCase()
      const rex = row.revenue_exclude === true
      if (bt === "hospitality" || bt === "complimentary" || rex) {
        hospitalityInvoicesTotal += total
        hospitalityInvoicesCount++
        continue
      }

      invoicesDiscountSum += disc

      if (status === "paid") {
        invoicePaidTotal += total
        invoicePaidCount++
      }
      if (status === "validated") {
        invoiceValidatedTotal += total
        invoiceValidatedCount++
      }
    }

    let lineCancelledLines = 0
    let lineCancelledSubtotal = 0
    let wasteLines = 0
    let wasteSubtotal = 0

    const chunkSize = 500
    for (let i = 0; i < invoiceIdsForItems.length; i += chunkSize) {
      const chunk = invoiceIdsForItems.slice(i, i + chunkSize)
      if (!chunk.length) break
      const { data: li, error: liErr } = await supabase
        .from("invoice_items")
        .select("line_status,waste_loss,subtotal")
        .in("invoice_id", chunk)
        .limit(20000)

      if (liErr) {
        console.warn("[reports-data] invoice_items aggregate", liErr)
        continue
      }
      for (const it of li ?? []) {
        const ls = String((it as { line_status?: string }).line_status ?? "").toLowerCase()
        const subt = Math.max(0, Number((it as { subtotal?: unknown }).subtotal) || 0)
        if (ls === "cancelled") {
          lineCancelledLines++
          lineCancelledSubtotal += subt
        }
        if ((it as { waste_loss?: boolean }).waste_loss === true) {
          wasteLines++
          wasteSubtotal += subt
        }
      }
    }

    let offerRedemptionCount = 0
    let offerAmountSaved = 0
    const { data: redRows, error: redErr } = await supabase
      .from("invoice_offer_redemptions")
      .select("amount_saved")
      .gte("created_at", startIso)
      .lte("created_at", endIso)

    if (redErr) console.warn("[reports-data] offer redemptions", redErr)
    for (const r of redRows ?? []) {
      offerRedemptionCount++
      offerAmountSaved += Math.max(0, Number((r as { amount_saved?: unknown }).amount_saved) || 0)
    }

    let expensesTotal = 0
    let expenseCount = 0
    const startDate = startIso.slice(0, 10)
    const endDate = endIso.slice(0, 10)
    const { data: exRows, error: exErr } = await supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
      .limit(20000)

    if (exErr) console.warn("[reports-data] expenses", exErr)
    for (const e of exRows ?? []) {
      expenseCount++
      expensesTotal += Math.max(0, Number((e as { amount?: unknown }).amount) || 0)
    }

    const stockMovementByType: Record<string, { movements: number; quantity: number }> = {}
    const { data: smRows, error: smErr } = await supabase
      .from("stock_movements")
      .select("movement_type,quantity")
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .limit(50000)

    if (smErr) console.warn("[reports-data] stock_movements", smErr)
    for (const sm of smRows ?? []) {
      const t = String((sm as { movement_type?: string }).movement_type ?? "unknown").toLowerCase()
      const q = Number((sm as { quantity?: unknown }).quantity)
      const qtyAbs = Number.isFinite(q) ? Math.abs(q) : 0
      const bucket = stockMovementByType[t] ?? { movements: 0, quantity: 0 }
      bucket.movements++
      bucket.quantity += qtyAbs
      stockMovementByType[t] = bucket
    }

    type CashBucket = Record<string, { count: number; amount: number }>
    const cashMovementByKind: CashBucket = {}
    let employeeAdvanceTotal = 0
    let employeeAdvanceCount = 0
    const { data: crRows, error: crErr } = await supabase
      .from("cash_register_movements")
      .select("kind,amount")
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .limit(20000)

    if (crErr) console.warn("[reports-data] cash_register_movements", crErr)
    for (const c of crRows ?? []) {
      const kind = String((c as { kind?: string }).kind ?? "unknown").toLowerCase()
      const amt = Math.max(0, Number((c as { amount?: unknown }).amount) || 0)
      const slot = cashMovementByKind[kind] ?? { count: 0, amount: 0 }
      slot.count++
      slot.amount += amt
      cashMovementByKind[kind] = slot
      if (kind === "avance_salaire") {
        employeeAdvanceTotal += amt
        employeeAdvanceCount++
      }
    }

    const normalizedPayments: PayBucket = {}
    for (const [k, v] of Object.entries(paymentsByMethod)) {
      normalizedPayments[k.toLowerCase()] = { count: v.count, amount: rnd2(v.amount) }
    }

    const normalizedCashKinds: CashBucket = {}
    for (const [k, v] of Object.entries(cashMovementByKind)) {
      normalizedCashKinds[k] = { count: v.count, amount: rnd2(v.amount) }
    }

    const normalizedStock: typeof stockMovementByType = {}
    for (const [k, v] of Object.entries(stockMovementByType)) {
      normalizedStock[k] = { movements: v.movements, quantity: rnd2(v.quantity) }
    }

    return {
      payments: {
        succeededTotal: rnd2(paymentsSucceededTotal),
        byMethod: normalizedPayments,
        cashSucceeded: rnd2(cashSucceeded),
        nonCashSucceeded: rnd2(onlineSucceeded),
      },
      invoices: {
        paidTotal: rnd2(invoicePaidTotal),
        paidCount: invoicePaidCount,
        validatedTotal: rnd2(invoiceValidatedTotal),
        validatedCount: invoiceValidatedCount,
        cancelledCount: invoicesCancelledCount,
        discountSum: rnd2(invoicesDiscountSum),
        hospitalityTotal: rnd2(hospitalityInvoicesTotal),
        hospitalityCount: hospitalityInvoicesCount,
      },
      invoiceLines: {
        cancelledLines: lineCancelledLines,
        cancelledLinesSubtotal: rnd2(lineCancelledSubtotal),
        wasteLines,
        wasteSubtotal: rnd2(wasteSubtotal),
      },
      offers: {
        redemptionCount: offerRedemptionCount,
        amountSaved: rnd2(offerAmountSaved),
      },
      expenses: {
        total: rnd2(expensesTotal),
        count: expenseCount,
      },
      stockMovements: normalizedStock,
      cashRegister: {
        byKind: normalizedCashKinds,
        employeeAdvances: {
          total: rnd2(employeeAdvanceTotal),
          count: employeeAdvanceCount,
        },
      },
    }
  } catch (e) {
    console.warn("[reports-data] supplementary aggregates", e)
    return undefined
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const period = parsePeriod(new URL(req.url).searchParams.get("period"))

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      ok: false,
      source: "disabled",
      period,
      message: "Supabase requis",
      salesByDay: [],
      topProducts: [],
      staffPerformance: [],
      stockSnapshot: null,
      commercial: null,
    })
  }

  const { start, end } = rangeForPeriod(period)
  const supabase = createServiceRoleClient()

  try {
    const { data: ordersRaw, error: oErr } = await supabase
      .from("orders")
      .select("id, total, created_at, status, assigned_to, order_items(product_name, quantity, subtotal)")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: true })
      .limit(8000)

    if (oErr) {
      console.error("[reports-data]", oErr)
      return NextResponse.json({ ok: false, source: "error", error: oErr.message, period }, { status: 500 })
    }

    const orders = (ordersRaw ?? []) as Array<{
      id: string
      total: number | string
      created_at: string
      status?: string
      assigned_to?: string | null
      order_items?: unknown
    }>

    const active = orders.filter((o) => !isExcludedStatus(String(o.status ?? "")))

    const dayMap = new Map<string, { revenue: number; count: number }>()
    for (const o of active) {
      const d = new Date(o.created_at)
      if (Number.isNaN(d.getTime())) continue
      const key = d.toISOString().slice(0, 10)
      const prev = dayMap.get(key) ?? { revenue: 0, count: 0 }
      prev.revenue += Math.max(0, Number(o.total) || 0)
      prev.count += 1
      dayMap.set(key, prev)
    }

    const salesByDay = [...dayMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        revenue: Math.round(v.revenue * 100) / 100,
        orders: v.count,
        avgOrder: v.count > 0 ? Math.round((v.revenue / v.count) * 100) / 100 : 0,
      }))

    const lines: Array<{ product_name?: string | null; quantity?: number | null; subtotal?: number | null }> = []
    for (const o of active) {
      const items = o.order_items
      if (!Array.isArray(items)) continue
      for (const it of items) {
        lines.push(it as { product_name?: string | null; quantity?: number | null; subtotal?: number | null })
      }
    }

    const aggs = aggregateProductLines(lines)
    const topProducts = aggs.slice(0, 20).map((p) => ({
      name: p.name,
      category: "—",
      sold: Math.round(p.qty),
      revenue: p.revenue,
      profit: 0,
    }))

    const byAssignee = new Map<string, { revenue: number; orders: number }>()
    for (const o of active) {
      const aid = o.assigned_to
      if (!aid) continue
      const prev = byAssignee.get(aid) ?? { revenue: 0, orders: 0 }
      prev.revenue += Math.max(0, Number(o.total) || 0)
      prev.orders += 1
      byAssignee.set(aid, prev)
    }

    let staffPerformance: Array<{ userId: string; name: string; orders: number; sales: number; rating: number }> =
      []
    if (byAssignee.size) {
      const ids = [...byAssignee.keys()]
      const { data: users } = await supabase.from("users").select("id, full_name, email").in("id", ids)
      const nameById = new Map<string, string>()
      for (const u of users ?? []) {
        const row = u as { id?: string; full_name?: string | null; email?: string | null }
        if (row.id) {
          nameById.set(
            row.id,
            String(row.full_name || row.email || row.id).slice(0, 80),
          )
        }
      }
      staffPerformance = [...byAssignee.entries()].map(([uid, v]) => ({
        userId: uid,
        name: nameById.get(uid) ?? uid.slice(0, 8) + "…",
        orders: v.orders,
        sales: Math.round(v.revenue * 100) / 100,
        rating: 0,
      }))
      staffPerformance.sort((a, b) => b.sales - a.sales)
    }

    let stockSnapshot: {
      inventoryValueApprox: number
      lowStockCount: number
      outOfStockCount: number
    } | null = null

    const { data: products } = await supabase
      .from("products")
      .select("price, stock_quantity, is_available")
      .limit(5000)

    if (products?.length) {
      let value = 0
      let out = 0
      for (const p of products) {
        const price = Number((p as { price?: unknown }).price ?? 0)
        const qty = Number((p as { stock_quantity?: unknown }).stock_quantity ?? 0)
        value += Math.max(0, price) * Math.max(0, qty)
        if (qty === 0 && (p as { is_available?: boolean }).is_available !== false) out += 1
      }
      let lowStockCount = 0
      try {
        const { count } = await supabase.from("v_low_stock").select("id", { count: "exact", head: true })
        lowStockCount = count ?? 0
      } catch {
        lowStockCount = 0
      }

      stockSnapshot = {
        inventoryValueApprox: Math.round(value * 100) / 100,
        lowStockCount,
        outOfStockCount: out,
      }
    }

    const totalRevenue = active.reduce((s, o) => s + Math.max(0, Number(o.total) || 0), 0)
    const totalOrders = active.length

    const commercialAggregate = await supplementaryCommercialAggregates(
      supabase,
      start.toISOString(),
      end.toISOString(),
    )

    return NextResponse.json({
      ok: true,
      source: "supabase",
      period,
      range: { start: start.toISOString(), end: end.toISOString() },
      kpis: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgBasket: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
      },
      salesByDay,
      topProducts,
      staffPerformance,
      stockSnapshot,
      commercial: commercialAggregate ?? null,
    })
  } catch (e) {
    console.error("[reports-data]", e)
    return NextResponse.json(
      { ok: false, source: "error", error: String(e), period },
      { status: 500 },
    )
  }
}
