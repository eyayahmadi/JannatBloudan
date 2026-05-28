/**
 * POST /api/admin/purchases/recommendations/generate
 *
 * Lance la détection automatique des achats à prévoir.
 *  - Tente d'abord la fonction PostgreSQL `generate_purchase_recommendations`.
 *  - Si la RPC n'est pas disponible (migration 30 non appliquée), on retombe
 *    sur une exécution équivalente côté serveur (lecture ingredients + insert).
 *
 * Body (optionnel) :
 *   { window_days?: number = 7 }
 *
 * Réponse :
 *   { ok: true, generated: number, openTotal: number, source: "rpc" | "fallback" }
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { computeRecommendation, type IngredientSnapshot } from "@/lib/purchases/rules"

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    /* body optionnel */
  }
  const windowDays = Math.max(1, Math.min(30, Number(body.window_days ?? 7)))

  const supabase = createServiceRoleClient()

  // 1) Tentative RPC (chemin canonique)
  try {
    const { data, error } = await supabase
      .rpc("generate_purchase_recommendations", { p_window_days: windowDays })
    if (!error && data) {
      const rows = Array.isArray(data) ? data : [data]
      const openTotal = Number(
        (rows[0] as { created_count?: unknown })?.created_count ?? 0,
      )
      await insertCaisseAudit(supabase, {
        userId: guard.user.id,
        userEmail: guard.user.email,
        action: "purchase_recommendations_generate",
        entityType: "reorder_requests",
        entityId: "bulk",
        metadata: { window_days: windowDays, source: "rpc", open_total: openTotal },
      })
      return NextResponse.json({
        ok: true,
        generated: openTotal,
        openTotal,
        source: "rpc",
      })
    }
    // sinon on bascule sur le fallback
  } catch {
    /* fallback */
  }

  // 2) Fallback : SELECT ingredients + insert dédupliqué côté API
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()
  const [{ data: ingredients }, { data: movements }] = await Promise.all([
    supabase
      .from("ingredients")
      .select(
        "id,name,unit,stock_quantity,threshold_low,threshold_critical,cost_per_unit,supplier_name",
      ),
    supabase
      .from("stock_movements")
      .select("ingredient_id,movement_type,quantity,created_at")
      .gte("created_at", since)
      .in("movement_type", ["out", "loss"]),
  ])

  const usageById = new Map<string, number>()
  for (const m of movements ?? []) {
    const id = String((m as { ingredient_id?: string }).ingredient_id ?? "")
    if (!id) continue
    const q = Math.abs(Number((m as { quantity?: unknown }).quantity ?? 0))
    if (!Number.isFinite(q)) continue
    usageById.set(id, (usageById.get(id) ?? 0) + q)
  }

  let inserted = 0
  for (const ing of ingredients ?? []) {
    const snap: IngredientSnapshot = {
      id: String((ing as { id?: string }).id ?? ""),
      name: String((ing as { name?: string }).name ?? ""),
      unit: (ing as { unit?: string }).unit ?? null,
      stock_quantity: Number((ing as { stock_quantity?: unknown }).stock_quantity ?? 0),
      threshold_low: Number((ing as { threshold_low?: unknown }).threshold_low ?? 0),
      threshold_critical: (ing as { threshold_critical?: number | null }).threshold_critical ?? null,
      cost_per_unit: (ing as { cost_per_unit?: number | null }).cost_per_unit ?? null,
      supplier_name: (ing as { supplier_name?: string | null }).supplier_name ?? null,
      avg_daily_usage: (usageById.get(String((ing as { id?: string }).id ?? "")) ?? 0) / windowDays,
    }
    if (!snap.id) continue
    const reco = computeRecommendation(snap)
    if (!reco) continue

    // Vérifier qu'on n'a pas déjà une reco active avec le même dedup_key
    const { data: existing } = await supabase
      .from("reorder_requests")
      .select("id")
      .eq("dedup_key", reco.dedup_key)
      .in("status", ["pending", "validated", "assigned", "ordered"])
      .limit(1)
    if (existing && existing.length > 0) continue

    const { data: ins, error: errIns } = await supabase
      .from("reorder_requests")
      .insert({
        ingredient_id: reco.ingredient_id,
        suggested_qty: reco.suggested_qty,
        estimated_cost: reco.estimated_cost,
        status: "pending",
        generated_by: "auto",
        supplier_name: reco.supplier_name,
        urgency: reco.urgency,
        reason_code: reco.reason_code,
        reason_detail: reco.reason_detail,
        unit: reco.unit,
        current_stock: reco.current_stock,
        threshold_low: reco.threshold_low,
        dedup_key: reco.dedup_key,
      })
      .select("id")
      .single()

    if (!errIns && ins?.id) {
      inserted += 1
      await supabase.from("purchase_recommendation_log").insert({
        recommendation_id: ins.id,
        action: "generated",
        actor_id: guard.user.id,
        payload: { ...reco, source: "fallback" },
      })
    }
  }

  const { count } = await supabase
    .from("reorder_requests")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "validated", "assigned", "ordered"])

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email,
    action: "purchase_recommendations_generate",
    entityType: "reorder_requests",
    entityId: "bulk",
    metadata: {
      window_days: windowDays,
      source: "fallback",
      inserted,
      open_total: count ?? 0,
    },
  })

  return NextResponse.json({
    ok: true,
    generated: inserted,
    openTotal: count ?? 0,
    source: "fallback",
  })
}
