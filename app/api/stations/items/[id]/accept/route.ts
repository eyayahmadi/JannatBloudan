/**
 * POST /api/stations/items/[id]/accept
 * -------------------------------------
 * Accepte explicitement un item de commande.
 *  - Passe `station_status` à 'accepted' (ou 'preparing' si already started).
 *  - Renseigne accepted_at / accepted_by.
 *  - Ne change PAS le statut s'il est déjà ready / served / refused / replaced.
 *
 * Sécurité : ADMIN ou rôle station correspondant à l'item.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { syncOrderInvoice } from "@/lib/caisse/sync-order-invoice"
import type { Station, ItemStatus } from "@/lib/stations/config"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"

const STAFF_ROLES: readonly AppRole[] = [
  "ADMIN",
  "KITCHEN",
  "BAR",
  "SHISHA",
] as const

const STATION_ROLE_GUARD: Record<Station, AppRole> = {
  KITCHEN: "KITCHEN",
  BAR: "BAR",
  SHISHA: "SHISHA",
}

const ACCEPTABLE_FROM: ItemStatus[] = ["new"]

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const supabase = createServiceRoleClient()

  const { data: current, error: fetchErr } = await supabase
    .from("order_items")
    .select("id, order_id, station, station_status, product_name")
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
        error: `Seul ADMIN ou ${STATION_ROLE_GUARD[itemStation]} peut accepter cet item (${itemStation}).`,
      },
      { status: 403 },
    )
  }

  const previousStatus = current.station_status as ItemStatus
  if (!ACCEPTABLE_FROM.includes(previousStatus)) {
    return NextResponse.json(
      { error: `Impossible d'accepter un item au statut "${previousStatus}".` },
      { status: 409 },
    )
  }

  const { data: updated, error: updErr } = await supabase
    .from("order_items")
    .update({
      station_status: "accepted",
      accepted_by: guard.user.id,
    })
    .eq("id", id)
    .select("id, order_id, station, station_status, accepted_at, accepted_by")
    .single()

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "order_item.accept",
    entityType: "order_item",
    entityId: String(current.id),
    oldValues: { station_status: previousStatus },
    newValues: { station_status: "accepted" },
    metadata: {
      role: guard.role,
      station: itemStation,
      order_id: current.order_id,
      product_name: current.product_name,
    },
  })

  const sync = await syncOrderInvoice(supabase, {
    orderId: String(current.order_id),
    reason: "item_accept",
    actorId: guard.user.id,
    actorEmail: guard.user.email ?? null,
    metadata: { order_item_id: String(current.id), station: itemStation },
  })

  return NextResponse.json({
    ok: true,
    item: updated,
    transition: { from: previousStatus, to: "accepted" },
    invoice_sync: sync,
  })
}
