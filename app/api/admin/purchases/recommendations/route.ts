/**
 * GET  /api/admin/purchases/recommendations
 * POST /api/admin/purchases/recommendations
 *
 * - GET : liste les recommandations d'achat (vue v_purchase_recommendations).
 *   Filtres facultatifs : status, urgency, reason, search, only_open=1.
 *   Réponse : {
 *     recommendations: PurchaseRecommendation[],
 *     stats: { open, byUrgency, byStatus, estimatedTotal }
 *   }
 *
 * - POST : crée manuellement une recommandation (admin).
 *   Body : { ingredient_id?, product_id?, suggested_qty, urgency?, reason_code?,
 *            reason_detail?, supplier_name?, deadline?, notes?, event_id?, unit?,
 *            estimated_cost? }
 *
 * Auth : ADMIN ou CASHIER (lecture seulement pour CASHIER).
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireRoles, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import {
  isPurchaseReasonCode,
  isPurchaseStatus,
  isPurchaseUrgency,
  type PurchaseRecommendation,
  type PurchaseStatus,
  type PurchaseUrgency,
} from "@/lib/purchases/types"

const READ_ROLES = ["ADMIN", "CASHIER"] as const

function emptyResponse() {
  return NextResponse.json({
    recommendations: [],
    stats: {
      open: 0,
      total: 0,
      byUrgency: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      byStatus: {},
      estimatedTotal: 0,
    },
    source: "default",
  })
}

export async function GET(request: NextRequest) {
  const guard = await requireRoles(READ_ROLES)
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) return emptyResponse()

  const { searchParams } = new URL(request.url)
  const onlyOpen = searchParams.get("only_open") === "1"
  const urgencyParam = searchParams.get("urgency") ?? ""
  const statusParam = searchParams.get("status") ?? ""
  const reasonParam = searchParams.get("reason") ?? ""
  const search = (searchParams.get("search") ?? "").trim().toLowerCase()
  const limit = Math.max(1, Math.min(500, Number(searchParams.get("limit") ?? 200)))

  const supabase = createServiceRoleClient()

  let query = supabase
    .from("v_purchase_recommendations")
    .select("*")
    .order("urgency_rank", { ascending: false })
    .order("status_rank", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (onlyOpen) {
    query = query.eq("is_open", true)
  }
  if (statusParam && isPurchaseStatus(statusParam)) {
    query = query.eq("status", statusParam)
  }
  if (urgencyParam && isPurchaseUrgency(urgencyParam)) {
    query = query.eq("urgency", urgencyParam)
  }
  if (reasonParam && isPurchaseReasonCode(reasonParam)) {
    query = query.eq("reason_code", reasonParam)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json(
      { error: error.message, recommendations: [], stats: null },
      { status: 500 },
    )
  }

  let rows = (data ?? []) as PurchaseRecommendation[]
  if (search) {
    rows = rows.filter((r) => {
      const name = String(r.ingredient_name ?? r.product_name ?? "").toLowerCase()
      const supp = String(r.effective_supplier ?? r.supplier_name ?? "").toLowerCase()
      return name.includes(search) || supp.includes(search)
    })
  }

  const stats = computeStats(rows)
  return NextResponse.json({ recommendations: rows, stats, source: "supabase" })
}

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
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const ingredient_id = typeof body.ingredient_id === "string" ? body.ingredient_id : null
  const product_id = typeof body.product_id === "string" ? body.product_id : null
  if (!ingredient_id && !product_id) {
    return NextResponse.json({ error: "ingredient_or_product_required" }, { status: 400 })
  }

  const suggested_qty = Number(body.suggested_qty)
  if (!Number.isFinite(suggested_qty) || suggested_qty <= 0) {
    return NextResponse.json({ error: "invalid_quantity" }, { status: 400 })
  }

  const urgency: PurchaseUrgency = isPurchaseUrgency(body.urgency)
    ? (body.urgency as PurchaseUrgency)
    : "MEDIUM"
  const reason_code = isPurchaseReasonCode(body.reason_code)
    ? (body.reason_code as string)
    : "manual"

  const supabase = createServiceRoleClient()

  const insertPayload: Record<string, unknown> = {
    ingredient_id,
    product_id,
    suggested_qty,
    estimated_cost: Number(body.estimated_cost ?? 0) || null,
    status: "pending",
    generated_by: "manual",
    urgency,
    reason_code,
    reason_detail: typeof body.reason_detail === "string" ? body.reason_detail : null,
    supplier_name: typeof body.supplier_name === "string" ? body.supplier_name : null,
    deadline: typeof body.deadline === "string" ? body.deadline : null,
    notes: typeof body.notes === "string" ? body.notes : null,
    unit: typeof body.unit === "string" ? body.unit : null,
    event_id: typeof body.event_id === "string" ? body.event_id : null,
  }

  const { data, error } = await supabase
    .from("reorder_requests")
    .insert(insertPayload)
    .select("id")
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const recoId = data!.id as string

  await supabase.from("purchase_recommendation_log").insert({
    recommendation_id: recoId,
    action: "manual_create",
    actor_id: guard.user.id,
    payload: insertPayload,
  })
  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email,
    action: "purchase_reco_manual_create",
    entityType: "reorder_requests",
    entityId: recoId,
    newValues: insertPayload,
  })

  return NextResponse.json({ ok: true, id: recoId })
}

function computeStats(rows: PurchaseRecommendation[]) {
  const byUrgency: Record<PurchaseUrgency, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  const byStatus: Partial<Record<PurchaseStatus, number>> = {}
  let estimatedTotal = 0
  let open = 0

  for (const r of rows) {
    byUrgency[r.urgency] = (byUrgency[r.urgency] ?? 0) + 1
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
    if (r.is_open) open += 1
    estimatedTotal += Number(r.estimated_cost ?? 0)
  }

  return {
    open,
    total: rows.length,
    byUrgency,
    byStatus,
    estimatedTotal: Math.round(estimatedTotal * 100) / 100,
  }
}
