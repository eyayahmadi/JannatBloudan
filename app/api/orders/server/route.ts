import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { resolveRestaurantTableFromRef } from "@/lib/restaurant/resolve-table"
import { createTableOrder } from "@/lib/orders/create-table-order"

const ALLOW = ["ADMIN", "SERVER", "CASHIER"] as const

type ServerOrderInput = {
  tableRef?: string
  tableId?: number
  items: Array<{
    productId?: string
    name: string
    quantity: number
    unitPrice?: number
    notes?: string
    variantId?: string | null
  }>
  total?: number
  orderNumber?: string
  customerName?: string
  notes?: string
}

/**
 * POST /api/orders/server
 * Commande serveur — attachée à la session table active (créée si besoin).
 */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  try {
    const body = (await request.json()) as ServerOrderInput
    const items = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) {
      return NextResponse.json({ error: "items requis" }, { status: 400 })
    }

    const ref =
      typeof body.tableRef === "string" && body.tableRef.trim()
        ? body.tableRef.trim()
        : body.tableId != null
          ? String(body.tableId)
          : ""

    if (!ref) {
      return NextResponse.json({ error: "tableRef ou tableId requis" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const resolved = await resolveRestaurantTableFromRef(supabase, ref)
    if (!resolved) {
      return NextResponse.json({ error: "Table inconnue" }, { status: 400 })
    }

    const result = await createTableOrder(supabase, {
      tableRowId: resolved.id,
      tableNumber: resolved.table_number,
      items: items.map((it) => ({
        productId: it.productId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        notes: it.notes ?? null,
        variantId: it.variantId ?? null,
      })),
      total: body.total,
      orderNumber: body.orderNumber,
      customerName: body.customerName ?? `Serveur — Table ${resolved.table_number}`,
      notes: body.notes ?? null,
      source: "server",
      orderType: "server",
      createdByUserId: guard.user.id ?? null,
      createdByEmail: guard.user.email ?? null,
    })

    return NextResponse.json(
      {
        order: {
          id: result.orderId,
          order_number: result.orderNumber,
          table_number: result.tableNumber,
          table_id: result.tableId,
          session_id: result.sessionId,
          order_type: "server",
          status: result.status,
          total: result.total,
          items: result.items.map((it) => ({
            id: it.id,
            name: it.name,
            quantity: it.quantity,
            unit_price: it.unitPrice,
            notes: it.notes,
            station: it.station,
            item_status: it.station_status,
          })),
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error("[orders/server]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    )
  }
}
