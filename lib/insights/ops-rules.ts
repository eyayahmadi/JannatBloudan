/**
 * Insights opérationnels sans LLM : règles + agrégats simples.
 */

export type InsightSeverity = "info" | "warning"

export type OpsInsight = {
  id: string
  severity: InsightSeverity
  title: string
  detail: string
}

const WD_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]

export type WeekdayStat = { weekday: number; label: string; revenue: number; share_pct: number }

export function buildWeekdayStats(
  orders: Array<{ total: number; created_at: string }>,
): { stats: WeekdayStat[]; total: number } {
  const sums = new Array(7).fill(0) as number[]
  for (const o of orders) {
    const d = new Date(o.created_at)
    if (Number.isNaN(d.getTime())) continue
    sums[d.getDay()] += Math.max(0, Number(o.total) || 0)
  }
  const total = sums.reduce((a, b) => a + b, 0)
  const stats: WeekdayStat[] = sums.map((revenue, weekday) => ({
    weekday,
    label: WD_FR[weekday] ?? `J${weekday}`,
    revenue: Math.round(revenue * 100) / 100,
    share_pct: total > 0 ? Math.round((revenue / total) * 1000) / 10 : 0,
  }))
  return { stats, total: Math.round(total * 100) / 100 }
}

export function insightsFromWeekdays(
  stats: WeekdayStat[],
  totalRevenue: number,
): OpsInsight[] {
  const out: OpsInsight[] = []
  if (totalRevenue <= 0) {
    out.push({
      id: "no_revenue_period",
      severity: "info",
      title: "Pas de chiffre sur la période analysée",
      detail:
        "Vérifiez que les commandes sont bien enregistrées (statuts, dates) pour activer les tendances par jour.",
    })
    return out
  }
  const sorted = [...stats].sort((a, b) => b.revenue - a.revenue)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  if (best && best.revenue > 0) {
    const othersAvg =
      (totalRevenue - best.revenue) / Math.max(1, stats.filter((s) => s.weekday !== best.weekday).length)
    const uplift = othersAvg > 0 ? Math.round(((best.revenue - othersAvg) / othersAvg) * 100) : 0
    out.push({
      id: "best_weekday",
      severity: "info",
      title: `Jour le plus fort : ${best.label}`,
      detail: `${best.label} concentre environ ${best.share_pct}% du CA (${best.revenue.toFixed(2)} EUR). ` +
        (uplift > 5
          ? `En moyenne, ce jour dépasse les autres d’environ ${uplift}% — utile pour renfort serveur / promo ciblée.`
          : "Comparez avec vos promotions et réservations sur ce jour."),
    })
  }
  if (worst && best && worst.revenue < best.revenue * 0.35 && worst.revenue >= 0) {
    out.push({
      id: "weak_weekday",
      severity: "warning",
      title: `Activité plus faible : ${worst.label}`,
      detail: `${worst.label} ne représente que ${worst.share_pct}% du CA. Envisagez une offre mid-week ou un événement pour lisser la charge cuisine.`,
    })
  }
  return out
}

export type ProductAgg = { name: string; qty: number; revenue: number }

export function aggregateProductLines(
  rows: Array<{ product_name?: string | null; quantity?: number | null; subtotal?: number | null }>,
): ProductAgg[] {
  const map = new Map<string, { qty: number; revenue: number }>()
  for (const r of rows) {
    const name = String(r.product_name ?? "").trim() || "Produit inconnu"
    const qty = Math.max(0, Number(r.quantity) || 0)
    const rev = Math.max(0, Number(r.subtotal) || 0)
    const prev = map.get(name) ?? { qty: 0, revenue: 0 }
    map.set(name, { qty: prev.qty + qty, revenue: prev.revenue + rev })
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, qty: v.qty, revenue: Math.round(v.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function insightSlowProducts(aggs: ProductAgg[]): OpsInsight | null {
  if (aggs.length < 3) return null
  const bottom = aggs.slice(-Math.max(1, Math.floor(aggs.length / 10)))
  const weakest = bottom[0]
  if (!weakest || weakest.revenue <= 0) return null
  return {
    id: "slow_skus",
    severity: "info",
    title: "Articles à faible rotation (période récente)",
    detail:
      `Parmi les moins vendus : « ${weakest.name} » (${weakest.qty.toFixed(0)} unités). ` +
      `Envisager mise en avant, menu duo ou adaptation des stocks.`,
  }
}

export type IngredientRow = {
  name: string
  stock_quantity: number
  threshold_low: number
  threshold_critical?: number | null
  unit?: string | null
}

export function ingredientInsights(rows: IngredientRow[]): OpsInsight[] {
  const critical = rows.filter(
    (r) => (r.threshold_critical ?? null) != null && Number(r.threshold_critical) > 0 && r.stock_quantity <= Number(r.threshold_critical),
  )
  const criticalNames = new Set(critical.map((c) => c.name))
  const low = rows.filter(
    (r) =>
      !criticalNames.has(r.name) &&
      r.threshold_low > 0 &&
      r.stock_quantity <= r.threshold_low,
  )

  const out: OpsInsight[] = []
  if (critical.length) {
    out.push({
      id: "stock_critical",
      severity: "warning",
      title: "Stock critique",
      detail: critical
        .slice(0, 5)
        .map((c) => `${c.name} (${c.stock_quantity} ${c.unit ?? "u."})`)
        .join(" · "),
    })
  }
  if (low.length && !critical.length) {
    out.push({
      id: "stock_low",
      severity: "info",
      title: "Seuils bas",
      detail: low
        .slice(0, 5)
        .map((c) => `${c.name} (${c.stock_quantity} ${c.unit ?? "u."})`)
        .join(" · "),
    })
  }
  return out
}

/** Suggestions type « copilot léger » (règles déterministes). */
export function buildCopilotSuggestions(input: {
  bestWeekdayLabel?: string
  hasStockCritical: boolean
  hasCaisseAlerts: boolean
}): string[] {
  const s: string[] = []
  if (input.bestWeekdayLabel) {
    s.push(
      `Renforcer l’équipe salle / cuisine le ${input.bestWeekdayLabel} (pic d’activité observé).`,
    )
  }
  if (input.hasStockCritical) {
    s.push("Passer une commande fournisseur ou ajuster le menu sur les ingrédients en alerte critique.")
  }
  if (input.hasCaisseAlerts) {
    s.push("Consulter la caisse : alertes ouvertes (écarts, annulations ou sorties).")
  }
  if (s.length === 0) {
    s.push("Continuer à alimenter les commandes et factures validées pour affiner les tendances.")
  }
  return s.slice(0, 6)
}
