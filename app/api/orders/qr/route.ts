import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/auth/admin-api"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { resolveRestaurantTableFromRef } from "@/lib/restaurant/resolve-table"

type QrOrderInput = {
  id?: string
  orderNumber?: string
  /** @deprecated Préférer tableRef — peut être confondu id / numéro */
  tableId?: number
  /** Segment d’URL /table/{tableRef} (nombre, code, etc.) */
  tableRef?: string
  items: Array<{ name: string; quantity: number; unitPrice?: number; notes?: string }>
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
      return NextResponse.json({ error: "Sans base, utilisez un numéro de table numérique dans l’URL" }, { status: 400 })
    }

    const total =
      typeof body.total === "number"
        ? body.total
        : items.reduce((s, it) => s + (it.unitPrice ?? 0) * it.quantity, 0)

    const orderNumber =
      body.orderNumber ||
      `T${tableNumberForOrder}-${String(Math.floor(1000 + Math.random() * 9000))}`

    if (!hasServerSupabaseEnv()) {
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

    const supabase = await createClient()

    // Ouvrir ou recuperer une session pour la table
    let sessionId: string | null = null
    try {
      const { data: existing } = await supabase
        .from("table_sessions")
        .select("id")
        .eq("table_id", tableRowId)
        .is("closed_at", null)
        .maybeSingle()

      if (existing?.id) {
        sessionId = existing.id
      } else {
        const { data: created } = await supabase
          .from("table_sessions")
          .insert({ table_id: tableRowId })
          .select("id")
          .single()
        sessionId = created?.id ?? null
      }
    } catch (err) {
      console.warn("[orders/qr] session lookup failed", err)
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: body.customerName ?? `Client Table ${tableNumberForOrder}`,
        order_type: "qr_self_service",
        order_source: "qr_self_service",
        table_id: tableRowId,
        table_number: tableNumberForOrder,
        session_id: sessionId,
        subtotal: total,
        total,
        status: "pending",
        payment_status: "pending",
        notes: body.notes ?? null,
      })
      .select("*")
      .single()

    if (error || !order) {
      console.error("[orders/qr] insert order error", error)
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
            source: "mock-fallback",
            warning: error?.message,
          },
        },
        { status: 201 },
      )
    }

    // Inserer les order_items (best-effort)
    const rows = items.map((it) => ({
      order_id: order.id,
      product_name: it.name,
      quantity: it.quantity,
      unit_price: it.unitPrice ?? 0,
      subtotal: (it.unitPrice ?? 0) * it.quantity,
      special_instructions: it.notes ?? null,
    }))
    const { error: itemsErr } = await supabase.from("order_items").insert(rows)
    if (itemsErr) console.warn("[orders/qr] insert items warning", itemsErr)

    return NextResponse.json(
      {
        order: {
          id: order.id,
          order_number: order.order_number,
          table_number: tableNumberForOrder,
          order_type: "qr_self_service",
          status: order.status ?? "received",
          items,
          total: Number(order.total ?? total),
          created_at: order.created_at,
          session_id: sessionId,
          source: "supabase",
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error("[orders/qr] exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
