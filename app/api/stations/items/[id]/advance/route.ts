/**
 * PATCH /api/stations/items/[id]/advance
 * Avance le statut : new → accepted → preparing → ready → served
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { syncOrderInvoice } from "@/lib/caisse/sync-order-invoice"
import { ORDER_ITEM_KDS_SELECT, enrichSingleOrderItemRow } from "@/lib/orders/order-item-fields"
import { NEXT_ITEM_STATUS, type ItemStatus, type Station } from "@/lib/stations/config"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"

const STAFF_ROLES: readonly AppRole[] = ["ADMIN", "KITCHEN", "BAR", "SHISHA"] as const

const STATION_ROLE_GUARD: Record<Station, AppRole> = {
  KITCHEN: "KITCHEN",
  BAR: "BAR",
  SHISHA: "SHISHA",
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  let body: { to?: ItemStatus } = {}
  try {
    body = await request.json()
  } catch {
    /* empty body ok */
  }

  const supabase = createServiceRoleClient()

  const { data: current, error: fetchErr } = await supabase
    .from("order_items")
    .select("id, station_status, station, order_id, product_name")
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
    return NextResponse.json({ error: "Accès refusé pour cette station." }, { status: 403 })
  }

  const currentStatus = current.station_status as ItemStatus
  const target = body.to ?? NEXT_ITEM_STATUS[currentStatus]

  if (!target) {
    return NextResponse.json(
      { error: `Aucun statut suivant depuis "${currentStatus}"` },
      { status: 400 },
    )
  }

  const { data: updated, error: updateErr } = await supabase
    .from("order_items")
    .update({ station_status: target })
    .eq("id", id)
    .select(ORDER_ITEM_KDS_SELECT)
    .single()

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  await insertCaisseAudit(supabase, {
    userId: guard.user.id ?? null,
    userEmail: guard.user.email ?? null,
    action: "order_item.advance",
    entityType: "order_items",
    entityId: id,
    oldValues: { station_status: currentStatus },
    newValues: { station_status: target },
    metadata: {
      order_id: current.order_id,
      station: itemStation,
      product_name: current.product_name,
    },
  })

  const sync = await syncOrderInvoice(supabase, {
    orderId: String(current.order_id),
    reason: "item_advance",
    actorId: guard.user.id ?? null,
    actorEmail: guard.user.email ?? null,
    metadata: { order_item_id: id, station: itemStation, to: target },
  })

  return NextResponse.json({
    item: await enrichSingleOrderItemRow(supabase, updated as { product_id?: string | null; product_name_ar?: string | null }),
    transition: { from: currentStatus, to: target },
    invoice_sync: sync,
  })
}
