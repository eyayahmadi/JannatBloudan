import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { createWalkInOrder } from "@/lib/orders/create-walk-in-order"

const ROLES = ["ADMIN", "SERVER", "CASHIER"] as const

type WalkInBody = {
  orderNumber?: string
  customerName?: string
  notes?: string
  channel?: string
  items: Array<{
    productId?: string
    name: string
    quantity: number
    unitPrice?: number
    notes?: string
  }>
  total?: number
}

export async function POST(request: Request) {
  const guard = await requireRoles(ROLES)
  if (!guard.ok) return guard.response

  try {
    const body = (await request.json()) as WalkInBody
    const items = Array.isArray(body.items) ? body.items : []
    const customerName = body.customerName?.trim()

    if (!customerName || items.length === 0) {
      return NextResponse.json({ error: "customerName et items requis" }, { status: 400 })
    }

    if (!hasServerSupabaseEnv()) {
      const orderNumber = body.orderNumber ?? `W-${Date.now()}`
      return NextResponse.json(
        {
          order: {
            id: `ORD-${Date.now()}`,
            order_number: orderNumber,
            table_number: null,
            order_type: "pos",
            status: "received",
            items,
            total: body.total ?? 0,
            source: "mock",
          },
        },
        { status: 201 },
      )
    }

    const supabase = createServiceRoleClient()
    const channelLabel = body.channel?.trim()
    const notes = [body.notes?.trim(), channelLabel ? `[${channelLabel}]` : null]
      .filter(Boolean)
      .join(" — ") || null

    const result = await createWalkInOrder(supabase, {
      items: items.map((it) => ({
        productId: it.productId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        notes: it.notes ?? null,
      })),
      total: body.total,
      orderNumber: body.orderNumber,
      customerName,
      notes,
      source: "pos",
      createdByUserId: guard.user?.id ?? null,
      createdByEmail: guard.user?.email ?? null,
    })

    return NextResponse.json(
      {
        order: {
          id: result.orderId,
          order_number: result.orderNumber,
          table_number: null,
          order_type: "pos",
          status: result.status,
          items: result.items.map((it) => ({
            id: it.id,
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            notes: it.notes,
            station: it.station,
            item_status: it.station_status,
          })),
          total: result.total,
          source: "supabase",
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error("[orders/walk-in]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    )
  }
}
