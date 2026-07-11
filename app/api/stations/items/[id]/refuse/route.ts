/**
 * POST /api/stations/items/[id]/refuse
 * -------------------------------------
 * Refuse un item de commande pour une raison codifiée.
 *
 * Body :
 *   {
 *     reason_code: "produit_indisponible" | "ingredient_manquant" | "rush"
 *                | "station_fermee" | "fin_service" | "remplacement_necessaire"
 *                | "autre",
 *     reason_note?: string,        // texte libre 0..500 chars
 *     mark_waste?: boolean         // true si l'item était déjà préparé (perte stock)
 *   }
 *
 * Effets :
 *   - order_items.station_status passe à 'refused' (ou 'waste' si mark_waste=true)
 *   - order_items.billable passe à false (via trigger)
 *   - Une ligne audit est ajoutée dans `order_item_refusals`
 *   - Une ligne audit applicative est ajoutée dans `audit_logs`
 *
 * Sécurité :
 *   - ADMIN ou le rôle station correspondant à l'item.station
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { syncOrderInvoice } from "@/lib/caisse/sync-order-invoice"
import {
  isRefusalReasonCode,
  type RefusalReasonCode,
} from "@/lib/stations/refusal-reasons"
import { ORDER_ITEM_KDS_SELECT, enrichSingleOrderItemRow } from "@/lib/orders/order-item-fields"
import type { Station, ItemStatus } from "@/lib/stations/config"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"

const STAFF_ROLES: readonly AppRole[] = [
  "ADMIN",
  "KITCHEN",
  "BAR",
  "SHISHA",
  "SERVER",
  "CASHIER",
] as const

const STATION_ROLE_GUARD: Record<Station, AppRole> = {
  KITCHEN: "KITCHEN",
  BAR: "BAR",
  SHISHA: "SHISHA",
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  const reasonCode = String(body.reason_code ?? "").toLowerCase()
  if (!isRefusalReasonCode(reasonCode)) {
    return NextResponse.json(
      { error: "reason_code invalide" },
      { status: 400 },
    )
  }
  const reasonCodeTyped: RefusalReasonCode = reasonCode

  const reasonNote =
    typeof body.reason_note === "string" ? body.reason_note.trim().slice(0, 500) : ""
  const markWaste = body.mark_waste === true

  const supabase = createServiceRoleClient()

  const { data: current, error: fetchErr } = await supabase
    .from("order_items")
    .select("id, order_id, station, station_status, product_name, product_id")
    .eq("id", id)
    .maybeSingle()

  if (fetchErr || !current) {
    return NextResponse.json(
      { error: fetchErr?.message ?? "Item introuvable" },
      { status: 404 },
    )
  }

  const itemStation = current.station as Station
  const callerRole = normalizeRole(guard.role)
  if (callerRole !== "ADMIN" && callerRole !== STATION_ROLE_GUARD[itemStation]) {
    return NextResponse.json(
      {
        error: `Seul ADMIN ou ${STATION_ROLE_GUARD[itemStation]} peut refuser cet item (${itemStation}).`,
      },
      { status: 403 },
    )
  }

  const previousStatus = current.station_status as ItemStatus
  const targetStatus: ItemStatus = markWaste ? "waste" : "refused"

  if (previousStatus === "refused" || previousStatus === "waste" || previousStatus === "replaced") {
    return NextResponse.json(
      { error: `Item déjà ${previousStatus}` },
      { status: 409 },
    )
  }

  const { data: updated, error: updErr } = await supabase
    .from("order_items")
    .update({
      station_status: targetStatus,
      refusal_reason: reasonCodeTyped,
      refusal_note: reasonNote || null,
      refused_by: guard.user.id,
    })
    .eq("id", id)
    .select(ORDER_ITEM_KDS_SELECT)
    .single()

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  // Trace fine
  await supabase.from("order_item_refusals").insert({
    order_item_id: current.id,
    order_id: current.order_id,
    station: itemStation,
    reason_code: reasonCodeTyped,
    reason_note: reasonNote || null,
    previous_status: previousStatus,
    bulk_refuse: false,
    refused_by: guard.user.id,
  })

  // Audit applicatif
  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "order_item.refuse",
    entityType: "order_item",
    entityId: String(current.id),
    oldValues: { station_status: previousStatus },
    newValues: {
      station_status: targetStatus,
      refusal_reason: reasonCodeTyped,
      refusal_note: reasonNote || null,
      mark_waste: markWaste,
    },
    metadata: {
      role: guard.role,
      station: itemStation,
      order_id: current.order_id,
      product_id: current.product_id,
      product_name: current.product_name,
    },
  })

  const sync = await syncOrderInvoice(supabase, {
    orderId: String(current.order_id),
    reason: markWaste ? "item_waste" : "item_refuse",
    actorId: guard.user.id,
    actorEmail: guard.user.email ?? null,
    metadata: { order_item_id: String(current.id), station: itemStation },
  })

  return NextResponse.json({
    ok: true,
    item: await enrichSingleOrderItemRow(supabase, updated as { product_id?: string | null; product_name_ar?: string | null }),
    transition: { from: previousStatus, to: targetStatus },
    invoice_sync: sync,
  })
}
