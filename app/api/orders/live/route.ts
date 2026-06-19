import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { mapDbRowsToKitchenOrders } from "@/lib/orders/live-order-mapper"

const STAFF_ROLES = ["ADMIN", "SERVER", "CASHIER", "KITCHEN", "BAR", "SHISHA"] as const

/**
 * GET /api/orders/live
 * Commandes actives pour cuisine / serveur / caisse (polling KDS).
 */
export async function GET() {
  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ orders: [], source: "mock" })
  }

  try {
    const supabase = createServiceRoleClient()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: rawOrders, error: ordersErr } = await supabase
      .from("orders")
      .select(
        "id, order_number, table_number, table_id, order_type, source, status, customer_name, total, created_at, updated_at",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(150)

    if (ordersErr) {
      return NextResponse.json({ orders: [], error: ordersErr.message }, { status: 500 })
    }

    const closed = new Set(["completed", "cancelled", "livrée", "livree", "annulée", "annulee"])
    const orders = (rawOrders ?? []).filter((o) => !closed.has(String(o.status ?? "").toLowerCase())).slice(0, 120)

    const orderIds = orders.map((o) => String(o.id))
    if (orderIds.length === 0) {
      return NextResponse.json({ orders: [], source: "supabase" })
    }

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select(
        "id, order_id, product_name, quantity, unit_price, special_instructions, station, station_status, started_at, ready_at, refusal_note, refused_at, billable",
      )
      .in("order_id", orderIds)

    if (itemsErr) {
      return NextResponse.json({ orders: [], error: itemsErr.message }, { status: 500 })
    }

    type ItemRow = NonNullable<typeof items>[number]
    const itemsByOrderId = new Map<string, ItemRow[]>()
    for (const row of items ?? []) {
      const oid = String((row as { order_id?: string }).order_id ?? "")
      if (!oid) continue
      const list = itemsByOrderId.get(oid) ?? []
      list.push(row)
      itemsByOrderId.set(oid, list)
    }

    const mapped = mapDbRowsToKitchenOrders(orders, itemsByOrderId)

    return NextResponse.json({ orders: mapped, source: "supabase" })
  } catch (e) {
    return NextResponse.json({ orders: [], error: String(e) }, { status: 500 })
  }
}
