import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { resolveRestaurantTableFromRef } from "@/lib/restaurant/resolve-table"
import { createTableOrder } from "@/lib/orders/create-table-order"

type QrOrderInput = {
  id?: string
  orderNumber?: string
  tableId?: number
  tableRef?: string
  items: Array<{
    productId?: string
    name: string
    quantity: number
    unitPrice?: number
    notes?: string
    variantId?: string | null
  }>
  total?: number
  customerName?: string
  notes?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QrOrderInput
    const items = Array.isArray(body.items) ? body.items : []

    const ref =
      typeof body.tableRef === "string" && body.tableRef.trim()
        ? body.tableRef.trim()
        : body.tableId != null && Number.isFinite(Number(body.tableId))
          ? String(body.tableId)
          : ""

    if (!ref || items.length === 0) {
      return NextResponse.json({ error: "tableRef (ou tableId) et items requis" }, { status: 400 })
    }

    let tableRowId = Number(body.tableId)
    let tableNumberForOrder = Number.isFinite(tableRowId) ? tableRowId : 0

    if (hasServerSupabaseEnv()) {
      const supaAdmin = createServiceRoleClient()
      const resolved = await resolveRestaurantTableFromRef(supaAdmin, ref)
      if (!resolved) {
        return NextResponse.json({ error: "Table inconnue pour cette commande QR" }, { status: 400 })
      }
      tableRowId = resolved.id
      tableNumberForOrder = resolved.table_number
    } else if (/^\d+$/.test(ref)) {
      const n = Number(ref)
      tableRowId = n
      tableNumberForOrder = n
    } else {
      return NextResponse.json({ error: "Sans base, utilisez un numéro de table numérique dans l'URL" }, { status: 400 })
    }

    if (!hasServerSupabaseEnv()) {
      const orderNumber =
        body.orderNumber ||
        `T${tableNumberForOrder}-${String(Math.floor(1000 + Math.random() * 9000))}`
      const total =
        typeof body.total === "number"
          ? body.total
          : items.reduce((s, it) => s + (it.unitPrice ?? 0) * it.quantity, 0)
      return NextResponse.json(
        {
          order: {
            id: body.id ?? `ORD-${Date.now()}`,
            order_number: orderNumber,
            table_number: tableNumberForOrder,
            order_type: "qr_self_service",
            status: "received",
            items,
            total,
            created_at: new Date().toISOString(),
            source: "mock",
          },
        },
        { status: 201 },
      )
    }

    const supabase = createServiceRoleClient()
    const result = await createTableOrder(supabase, {
      tableRowId,
      tableNumber: tableNumberForOrder,
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
      customerName: body.customerName ?? `Client Table ${tableNumberForOrder}`,
      notes: body.notes ?? null,
      source: "qr_self_service",
    })

    return NextResponse.json(
      {
        order: {
          id: result.orderId,
          order_number: result.orderNumber,
          table_number: tableNumberForOrder,
          order_type: "qr_self_service",
          status: result.status,
          items: result.items.map((it) => ({
            id: it.id,
            productId: it.productId,
            name: it.name,
            name_ar: it.name_ar ?? null,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            notes: it.notes,
            station: it.station,
            item_status: it.station_status,
          })),
          total: result.total,
          session_id: result.sessionId,
          source: "supabase",
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error("[orders/qr] exception", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    )
  }
}
