import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import {
  aggregateProductLines,
  buildCopilotSuggestions,
  buildWeekdayStats,
  insightsFromWeekdays,
  insightSlowProducts,
  ingredientInsights,
} from "@/lib/insights/ops-rules"

const DAYS = 42

/**
 * Insights opérationnels (règles + stats) — pas de LLM.
 * ADMIN uniquement.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      ok: false,
      disabled: true,
      message: "Supabase requis",
      insights: [],
      copilot_suggestions: [],
    })
  }

  const supabase = createServiceRoleClient()
  const since = new Date()
  since.setDate(since.getDate() - DAYS)

  try {
    const { data: ordersRaw, error: oErr } = await supabase
      .from("orders")
      .select("total, created_at, status, order_items(product_name, quantity, subtotal)")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(4000)

    if (oErr) {
      console.error("[ops-insights]", oErr)
    }

    const orders = (ordersRaw ?? []).filter((o) => {
      const st = String((o as { status?: string }).status ?? "").toLowerCase()
      return st !== "cancelled" && st !== "refunded"
    }) as Array<{ total: number; created_at: string; order_items?: unknown }>

    const flatOrders = orders.map((o) => ({
      total: Number((o as { total?: unknown }).total ?? 0),
      created_at: String((o as { created_at?: string }).created_at),
    }))

    const { stats: weekdayStats, total: revenueTotal } = buildWeekdayStats(flatOrders)

    const lines: Array<{ product_name?: string | null; quantity?: number | null; subtotal?: number | null }> = []
    for (const o of orders) {
      const items = (o as { order_items?: unknown }).order_items
      if (!Array.isArray(items)) continue
      for (const it of items) {
        lines.push(it as { product_name?: string | null; quantity?: number | null; subtotal?: number | null })
      }
    }

    const products = aggregateProductLines(lines)
    const slow = insightSlowProducts(products)
    const aggInsights = [
      ...insightsFromWeekdays(weekdayStats, revenueTotal),
      ...(slow ? [slow] : []),
    ]

    const { data: ingRows } = await supabase
      .from("ingredients")
      .select("name, stock_quantity, threshold_low, threshold_critical, unit")
      .limit(500)

    const stockInsights = ingredientInsights(
      (ingRows ?? []).map((r) => ({
        name: String((r as { name?: string }).name ?? ""),
        stock_quantity: Number((r as { stock_quantity?: unknown }).stock_quantity ?? 0),
        threshold_low: Number((r as { threshold_low?: unknown }).threshold_low ?? 0),
        threshold_critical: (r as { threshold_critical?: unknown }).threshold_critical as number | null | undefined,
        unit: (r as { unit?: string }).unit,
      })),
    )

    let caisseOpen = 0
    try {
      const { count } = await supabase
        .from("caisse_intelligence_alerts")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false)
        .gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString())
      caisseOpen = count ?? 0
    } catch {
      caisseOpen = 0
    }

    const bestDay = [...weekdayStats].sort((a, b) => b.revenue - a.revenue)[0]
    const hasCrit = stockInsights.some((i) => i.id === "stock_critical")

    const copilot = buildCopilotSuggestions({
      bestWeekdayLabel: bestDay?.revenue ? bestDay.label : undefined,
      hasStockCritical: hasCrit,
      hasCaisseAlerts: caisseOpen > 0,
    })

    const topProducts = products.slice(0, 8)

    return NextResponse.json({
      ok: true,
      period_days: DAYS,
      generated_at: new Date().toISOString(),
      kpis: {
        orders_in_period: orders.length,
        revenue_sum_approx: revenueTotal,
        avg_basket_approx:
          orders.length > 0 ? Math.round((revenueTotal / orders.length) * 100) / 100 : 0,
      },
      weekday_stats: weekdayStats,
      top_products: topProducts,
      insights: [...aggInsights, ...stockInsights],
      copilot_suggestions: copilot,
      meta: {
        unresolved_caisse_alerts_week: caisseOpen,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
