/**
 * « Achats à prévoir » — types & métadonnées partagées (client + serveur).
 * --------------------------------------------------------------------
 * Une recommandation d'achat (`PurchaseRecommendation`) est stockée dans
 * `reorder_requests` et consommée via la vue `v_purchase_recommendations`.
 *
 * Cycle de vie :
 *   pending → validated → assigned → ordered → received
 *           ↘ ignored
 *           ↘ cancelled
 *
 * Niveau d'urgence (`PurchaseUrgency`) :
 *   - LOW       : signalement préventif (consommation tendance haute)
 *   - MEDIUM    : rupture prédite sous quelques jours
 *   - HIGH      : stock ≤ seuil bas
 *   - CRITICAL  : stock = 0 ou ≤ seuil critique
 */

export const PURCHASE_URGENCIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const
export type PurchaseUrgency = (typeof PURCHASE_URGENCIES)[number]

export const PURCHASE_STATUSES = [
  "pending",
  "validated",
  "assigned",
  "ordered",
  "received",
  "ignored",
  "cancelled",
] as const
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number]

export const PURCHASE_REASON_CODES = [
  "low_stock",
  "zero_stock",
  "predicted_rupture",
  "high_consumption",
  "event_demand",
  "manual",
  "other",
] as const
export type PurchaseReasonCode = (typeof PURCHASE_REASON_CODES)[number]

/** Ordre d'urgence pour le tri descendant (CRITICAL en premier). */
export const URGENCY_RANK: Record<PurchaseUrgency, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

export const URGENCY_META: Record<
  PurchaseUrgency,
  { i18nKey: string; tone: "muted" | "info" | "warn" | "danger"; label: string }
> = {
  LOW: { i18nKey: "purchases.urgency.low", tone: "muted", label: "Faible" },
  MEDIUM: { i18nKey: "purchases.urgency.medium", tone: "info", label: "Moyenne" },
  HIGH: { i18nKey: "purchases.urgency.high", tone: "warn", label: "Élevée" },
  CRITICAL: { i18nKey: "purchases.urgency.critical", tone: "danger", label: "Critique" },
}

export const REASON_META: Record<
  PurchaseReasonCode,
  { i18nKey: string; defaultUrgency: PurchaseUrgency }
> = {
  zero_stock: { i18nKey: "purchases.reason.zeroStock", defaultUrgency: "CRITICAL" },
  low_stock: { i18nKey: "purchases.reason.lowStock", defaultUrgency: "HIGH" },
  predicted_rupture: { i18nKey: "purchases.reason.predictedRupture", defaultUrgency: "MEDIUM" },
  high_consumption: { i18nKey: "purchases.reason.highConsumption", defaultUrgency: "LOW" },
  event_demand: { i18nKey: "purchases.reason.eventDemand", defaultUrgency: "HIGH" },
  manual: { i18nKey: "purchases.reason.manual", defaultUrgency: "MEDIUM" },
  other: { i18nKey: "purchases.reason.other", defaultUrgency: "MEDIUM" },
}

export const STATUS_META: Record<
  PurchaseStatus,
  { i18nKey: string; tone: "info" | "warn" | "ok" | "danger" | "muted"; isOpen: boolean }
> = {
  pending: { i18nKey: "purchases.status.pending", tone: "info", isOpen: true },
  validated: { i18nKey: "purchases.status.validated", tone: "info", isOpen: true },
  assigned: { i18nKey: "purchases.status.assigned", tone: "info", isOpen: true },
  ordered: { i18nKey: "purchases.status.ordered", tone: "warn", isOpen: true },
  received: { i18nKey: "purchases.status.received", tone: "ok", isOpen: false },
  ignored: { i18nKey: "purchases.status.ignored", tone: "muted", isOpen: false },
  cancelled: { i18nKey: "purchases.status.cancelled", tone: "muted", isOpen: false },
}

/** Forme alignée sur la vue `v_purchase_recommendations`. */
export type PurchaseRecommendation = {
  id: string
  urgency: PurchaseUrgency
  status: PurchaseStatus
  reason_code: PurchaseReasonCode
  reason_detail?: string | null
  suggested_qty: number
  unit?: string | null
  effective_unit?: string | null
  estimated_cost?: number | null
  actual_cost?: number | null
  current_stock?: number | null
  effective_current_stock?: number | null
  threshold_low?: number | null
  effective_threshold_low?: number | null
  threshold_critical?: number | null
  cost_per_unit?: number | null
  deadline?: string | null
  expected_at?: string | null
  notes?: string | null
  supplier_name?: string | null
  effective_supplier?: string | null
  generated_by?: string | null
  ingredient_id?: string | null
  ingredient_name?: string | null
  product_id?: string | null
  product_name?: string | null
  assigned_to?: string | null
  validated_at?: string | null
  validated_by?: string | null
  ignored_at?: string | null
  ignored_by?: string | null
  ignore_reason?: string | null
  bought_at?: string | null
  bought_by?: string | null
  receipt_url?: string | null
  expense_id?: string | null
  cash_movement_id?: string | null
  stock_movement_id?: string | null
  event_id?: string | null
  event_date?: string | null
  event_time?: string | null
  event_label?: string | null
  event_type?: string | null
  dedup_key?: string | null
  created_at: string
  updated_at?: string | null
  is_open?: boolean
}

export function isPurchaseUrgency(v: unknown): v is PurchaseUrgency {
  return typeof v === "string" && (PURCHASE_URGENCIES as readonly string[]).includes(v)
}

export function isPurchaseStatus(v: unknown): v is PurchaseStatus {
  return typeof v === "string" && (PURCHASE_STATUSES as readonly string[]).includes(v)
}

export function isPurchaseReasonCode(v: unknown): v is PurchaseReasonCode {
  return typeof v === "string" && (PURCHASE_REASON_CODES as readonly string[]).includes(v)
}

/** Filtre courant pour la vue admin (tabs / pills). */
export type PurchaseFilter = {
  urgency?: PurchaseUrgency | "ALL"
  status?: PurchaseStatus | "ALL_OPEN" | "ALL_CLOSED" | "ALL"
  reason?: PurchaseReasonCode | "ALL"
  search?: string
}
