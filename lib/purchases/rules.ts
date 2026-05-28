/**
 * « Achats à prévoir » — règles simples (server-safe, sans dépendance Supabase).
 * --------------------------------------------------------------------------
 * Utilisé en double pour :
 *   1) la fonction PostgreSQL `generate_purchase_recommendations` (logique
 *      authoritative déterministe, exécutée en base)
 *   2) la prévisualisation côté API/UI quand on veut « simuler » sans persister.
 *
 * Heuristiques :
 *   - stock = 0                               → CRITICAL (zero_stock)
 *   - stock ≤ threshold_critical              → CRITICAL (low_stock)
 *   - stock ≤ threshold_low                   → HIGH     (low_stock)
 *   - days_left = stock / avg_daily_usage ≤ 3 → MEDIUM   (predicted_rupture)
 *   - sinon : aucune reco (sauf demande manuelle / event_demand)
 */

import {
  type PurchaseReasonCode,
  type PurchaseUrgency,
} from "./types"

export type IngredientSnapshot = {
  id: string
  name: string
  unit?: string | null
  stock_quantity: number
  threshold_low: number
  threshold_critical?: number | null
  cost_per_unit?: number | null
  supplier_name?: string | null
  /** Conso moyenne / jour (calculée côté API à partir de stock_movements). */
  avg_daily_usage?: number
}

export type ComputedRecommendation = {
  ingredient_id: string
  ingredient_name: string
  urgency: PurchaseUrgency
  reason_code: PurchaseReasonCode
  reason_detail: string
  suggested_qty: number
  estimated_cost: number
  unit?: string | null
  current_stock: number
  threshold_low: number
  supplier_name?: string | null
  avg_daily_usage?: number
  days_left?: number | null
  dedup_key: string
}

export function computeRecommendation(snap: IngredientSnapshot): ComputedRecommendation | null {
  const avg = snap.avg_daily_usage ?? 0
  const daysLeft = avg > 0 ? snap.stock_quantity / avg : null

  let urgency: PurchaseUrgency | null = null
  let reason: PurchaseReasonCode | null = null

  if (snap.stock_quantity === 0) {
    urgency = "CRITICAL"
    reason = "zero_stock"
  } else if (
    snap.threshold_critical &&
    snap.threshold_critical > 0 &&
    snap.stock_quantity <= snap.threshold_critical
  ) {
    urgency = "CRITICAL"
    reason = "low_stock"
  } else if (
    snap.threshold_low &&
    snap.threshold_low > 0 &&
    snap.stock_quantity <= snap.threshold_low
  ) {
    urgency = "HIGH"
    reason = "low_stock"
  } else if (daysLeft !== null && daysLeft <= 3) {
    urgency = "MEDIUM"
    reason = "predicted_rupture"
  } else {
    return null
  }

  // Quantité recommandée : couvrir 7 jours de conso ou viser 2× threshold_low.
  const target7d = avg * 7
  const aboveThreshold = (snap.threshold_low ?? 0) * 2 - snap.stock_quantity
  const suggested_qty = Math.max(
    Number.isFinite(target7d) ? target7d : 0,
    Number.isFinite(aboveThreshold) ? aboveThreshold : 0,
    1,
  )

  const rounded = round3(suggested_qty)
  const estimated_cost = round2(rounded * (snap.cost_per_unit ?? 0))

  let detail: string
  if (reason === "zero_stock") {
    detail = "Stock à 0 — rachat immédiat"
  } else if (reason === "predicted_rupture") {
    detail =
      `Conso moy. ${round2(avg)} / j → ~${daysLeft !== null ? round1(daysLeft) : "?"} j restants`
  } else {
    detail = `Stock ${snap.stock_quantity} ≤ seuil ${snap.threshold_low}`
  }

  return {
    ingredient_id: snap.id,
    ingredient_name: snap.name,
    urgency,
    reason_code: reason,
    reason_detail: detail,
    suggested_qty: rounded,
    estimated_cost,
    unit: snap.unit ?? null,
    current_stock: snap.stock_quantity,
    threshold_low: snap.threshold_low,
    supplier_name: snap.supplier_name ?? null,
    avg_daily_usage: avg || undefined,
    days_left: daysLeft,
    dedup_key: `ingredient:${snap.id}:${reason}`,
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}
function round2(n: number) {
  return Math.round(n * 100) / 100
}
function round3(n: number) {
  return Math.round(n * 1000) / 1000
}

/** Identifiant de digest jour utilisé pour la déduplication des notifications. */
export function todayDigestKey(level: PurchaseUrgency, businessDate?: string): string {
  const d = businessDate ?? new Date().toISOString().slice(0, 10)
  return `purchases-${level}:${d}`
}
