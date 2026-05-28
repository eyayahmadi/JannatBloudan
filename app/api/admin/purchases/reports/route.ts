/**
 * GET /api/admin/purchases/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Statistiques pour la page admin :
 *   - total recommended, completed (received), ignored, cancelled
 *   - total estimated cost vs actual cost
 *   - top 10 ingrédients les plus fréquemment manquants
 *   - distribution par urgence
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import type { PurchaseRecommendation } from "@/lib/purchases/types"

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      total: 0,
      completed: 0,
      ignored: 0,
      cancelled: 0,
      estimated_total: 0,
      actual_total: 0,
      byUrgency: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      topMissing: [],
      source: "default",
    })
  }

  const { searchParams } = new URL(request.url)
  const to = (searchParams.get("to") ?? new Date().toISOString().slice(0, 10)).slice(0, 10)
  const from =
    searchParams.get("from") ??
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const fromIso = `${from}T00:00:00.000Z`
  const toIso = `${to}T23:59:59.999Z`

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("v_purchase_recommendations")
    .select("*")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .limit(2000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as PurchaseRecommendation[]

  const byUrgency = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<string, number>
  const byStatus: Record<string, number> = {}
  let estimated_total = 0
  let actual_total = 0
  const missingCounter = new Map<string, { name: string; count: number; estimated: number }>()

  for (const r of rows) {
    byUrgency[r.urgency] = (byUrgency[r.urgency] ?? 0) + 1
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
    estimated_total += Number(r.estimated_cost ?? 0)
    actual_total += Number(r.actual_cost ?? 0)

    const key = String(r.ingredient_id ?? r.product_id ?? r.id)
    const name = String(r.ingredient_name ?? r.product_name ?? "—")
    const prev = missingCounter.get(key) ?? { name, count: 0, estimated: 0 }
    prev.count += 1
    prev.estimated += Number(r.estimated_cost ?? 0)
    missingCounter.set(key, prev)
  }

  const topMissing = Array.from(missingCounter.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((x) => ({
      name: x.name,
      count: x.count,
      estimated: Math.round(x.estimated * 100) / 100,
    }))

  return NextResponse.json({
    from,
    to,
    total: rows.length,
    completed: byStatus.received ?? 0,
    ignored: byStatus.ignored ?? 0,
    cancelled: byStatus.cancelled ?? 0,
    estimated_total: Math.round(estimated_total * 100) / 100,
    actual_total: Math.round(actual_total * 100) / 100,
    byUrgency,
    byStatus,
    topMissing,
    source: "supabase",
  })
}
