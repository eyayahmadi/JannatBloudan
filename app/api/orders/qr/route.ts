import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type QrOrderInput = {
  id?: string
  orderNumber?: string
  tableId: number
  items: Array<{ name: string; quantity: number; unitPrice?: number; notes?: string }>
  total?: number
  customerName?: string
  notes?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QrOrderInput
    const tableId = Number(body.tableId)
    const items = Array.isArray(body.items) ? body.items : []

    if (!tableId || items.length === 0) {
      return NextResponse.json(
        { error: "tableId et items requis" },
        { status: 400 },
      )
    }

    const total =
      typeof body.total === "number"
        ? body.total
        : items.reduce((s, it) => s + (it.unitPrice ?? 0) * it.quantity, 0)

    const orderNumber =
      body.orderNumber ||
      `T${tableId}-${String(Math.floor(1000 + Math.random() * 9000))}`

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json(
        {
          order: {
            id: body.id ?? `ORD-${Date.now()}`,
            order_number: orderNumber,
            table_number: tableId,
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
        .eq("table_id", tableId)
        .eq("status", "open")
        .maybeSingle()

      if (existing?.id) {
        sessionId = existing.id
      } else {
        const { data: created } = await supabase
          .from("table_sessions")
          .insert({ table_id: tableId, status: "open" })
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
        customer_name: body.customerName ?? `Client Table ${tableId}`,
        order_type: "qr_self_service",
        order_source: "qr_self_service",
        table_id: tableId,
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
            table_number: tableId,
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
          table_number: tableId,
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
