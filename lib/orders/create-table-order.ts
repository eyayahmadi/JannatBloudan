import type { SupabaseClient } from "@supabase/supabase-js"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { ensureTableSession } from "@/lib/table-sessions/ensure-session"
import { validateAndEnrichOrderItems } from "@/lib/orders/validate-order-items"
import { syncOrderInvoice } from "@/lib/caisse/sync-order-invoice"
import { tableGuestCustomerName } from "@/lib/orders/customer-display"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type PersistOrderItemInput = {
  productId?: string
  slug?: string | null
  name: string
  name_ar?: string | null
  quantity: number
  unitPrice?: number
  notes?: string | null
  variantId?: string | null
}

export type CreateTableOrderInput = {
  tableRowId: number
  tableNumber: number
  items: PersistOrderItemInput[]
  total?: number
  orderNumber?: string
  customerName?: string
  notes?: string | null
  source: "qr_self_service" | "server" | "pos"
  orderType?: string
  createdByUserId?: string | null
  createdByEmail?: string | null
}

export type PersistedOrderItem = {
  id: string
  productId?: string
  name: string
  name_ar?: string | null
  quantity: number
  unitPrice: number
  notes?: string | null
  station?: string | null
  station_status?: string | null
}

export type CreateTableOrderResult = {
  orderId: string
  orderNumber: string
  sessionId: string
  tableId: number
  tableNumber: number
  total: number
  status: string
  items: PersistedOrderItem[]
}

export async function createTableOrder(
  supabase: SupabaseClient,
  input: CreateTableOrderInput,
): Promise<CreateTableOrderResult> {
  const items = Array.isArray(input.items) ? input.items : []
  if (items.length === 0) throw new Error("items requis")

  const validatedItems = await validateAndEnrichOrderItems(supabase, items)

  const total =
    typeof input.total === "number"
      ? input.total
      : validatedItems.reduce((s, it) => s + it.unitPrice * it.quantity, 0)

  const orderNumber =
    input.orderNumber?.trim() ||
    `T${input.tableNumber}-${String(Math.floor(1000 + Math.random() * 9000))}`

  const { sessionId } = await ensureTableSession(supabase, input.tableRowId, {
    userId: input.createdByUserId,
    userEmail: input.createdByEmail,
    source: input.source,
  })

  const orderType = input.orderType ?? input.source

  const orderPayload = {
    order_number: orderNumber,
    customer_name: input.customerName ?? tableGuestCustomerName(input.tableNumber),
    order_type: orderType,
    source: input.source,
    table_id: String(input.tableRowId),
    table_number: String(input.tableNumber),
    session_id: sessionId,
    subtotal: String(total),
    total: String(total),
    status: "pending",
    notes: input.notes ?? null,
  }

  const itemPayload = validatedItems.map((it) => ({
    product_id: it.productId && UUID_RE.test(it.productId) ? it.productId : null,
    product_name: it.name,
    product_name_ar: it.name_ar?.trim() || null,
    quantity: it.quantity,
    unit_price: it.unitPrice,
    subtotal: it.unitPrice * it.quantity,
    special_instructions: it.notes ?? null,
    options_snapshot: it.options_snapshot ?? null,
  }))

  console.log("ORDER PAYLOAD:", orderPayload)
  console.log("ORDER ITEMS PAYLOAD:", itemPayload)

  let order: Record<string, unknown>
  let insertedItems: Array<Record<string, unknown>>

  const { data: rpcData, error: rpcErr } = await supabase.rpc("insert_table_order_with_items", {
    p_order: orderPayload,
    p_items: itemPayload,
  })

  if (!rpcErr && rpcData && typeof rpcData === "object") {
    const bundle = rpcData as { order?: Record<string, unknown>; items?: Array<Record<string, unknown>> }
    if (bundle.order?.id) {
      order = bundle.order
      insertedItems = Array.isArray(bundle.items) ? bundle.items : []
      console.log("ORDER DATA (RPC):", order)
    } else {
      console.error("ORDER ERROR (RPC malformed):", rpcData)
      throw new Error("Réponse commande invalide")
    }
  } else {
    if (rpcErr) {
      console.error("ORDER ERROR (RPC):", rpcErr)
      if (rpcErr.code !== "42883" && !String(rpcErr.message).includes("insert_table_order_with_items")) {
        throw new Error(rpcErr.message)
      }
      console.warn("[create-table-order] RPC unavailable — fallback insert (non-atomic)")
    }

    const { data: fallbackOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: input.customerName ?? tableGuestCustomerName(input.tableNumber),
        order_type: orderType,
        source: input.source,
        table_id: input.tableRowId,
        table_number: input.tableNumber,
        session_id: sessionId,
        subtotal: total,
        total,
        status: "pending",
        notes: input.notes ?? null,
      })
      .select("*")
      .single()

    console.log("ORDER DATA:", fallbackOrder)
    console.error("ORDER ERROR:", orderErr)

    if (orderErr || !fallbackOrder) {
      throw new Error(orderErr?.message ?? "Impossible d'enregistrer la commande")
    }

    order = fallbackOrder as Record<string, unknown>

    const rows = validatedItems.map((it) => {
      const row: Record<string, unknown> = {
        order_id: order.id,
        product_name: it.name,
        product_name_ar: it.name_ar?.trim() || null,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        subtotal: it.unitPrice * it.quantity,
        special_instructions: it.notes ?? null,
        options_snapshot: it.options_snapshot,
      }
      if (it.productId && UUID_RE.test(it.productId)) {
        row.product_id = it.productId
      }
      return row
    })

    const { data: fallbackItems, error: itemsErr } = await supabase
      .from("order_items")
      .insert(rows)
      .select(
        "id, product_id, product_name, product_name_ar, quantity, unit_price, special_instructions, options_snapshot, station, station_status",
      )

    console.log("ORDER ITEMS DATA:", fallbackItems)
    console.error("ORDER ITEMS ERROR:", itemsErr)

    if (itemsErr) {
      await supabase.from("orders").delete().eq("id", order.id)
      throw new Error(itemsErr.message)
    }

    insertedItems = (fallbackItems ?? []) as Array<Record<string, unknown>>
  }

  await supabase
    .from("restaurant_tables")
    .update({ status: "ORDERING", last_activity: new Date().toISOString() })
    .eq("id", input.tableRowId)

  await insertCaisseAudit(supabase, {
    userId: input.createdByUserId ?? null,
    userEmail: input.createdByEmail ?? null,
    action: "order_created",
    entityType: "orders",
    entityId: String(order.id),
    oldValues: null,
    newValues: {
      order_number: orderNumber,
      session_id: sessionId,
      table_id: input.tableRowId,
      source: input.source,
      item_count: validatedItems.length,
    },
    metadata: { source: input.source },
  })

  const mapped: PersistedOrderItem[] = insertedItems.map((row) => ({
    id: String(row.id),
    productId: row.product_id ? String(row.product_id) : undefined,
    name: String(row.product_name),
    name_ar: row.product_name_ar ? String(row.product_name_ar) : null,
    quantity: Number(row.quantity) || 0,
    unitPrice: Number(row.unit_price) || 0,
    notes: row.special_instructions != null ? String(row.special_instructions) : null,
    station: row.station != null ? String(row.station) : null,
    station_status: row.station_status != null ? String(row.station_status) : null,
  }))

  try {
    await syncOrderInvoice(supabase, {
      orderId: String(order.id),
      reason: "order_created",
      actorId: input.createdByUserId ?? null,
      actorEmail: input.createdByEmail ?? null,
      metadata: { source: input.source, order_number: orderNumber },
    })
  } catch (invoiceErr) {
    console.error("[create-table-order] syncOrderInvoice failed (order kept):", invoiceErr)
  }

  return {
    orderId: String(order.id),
    orderNumber,
    sessionId,
    tableId: input.tableRowId,
    tableNumber: input.tableNumber,
    total: Number(order.total ?? total),
    status: String(order.status ?? "pending"),
    items: mapped,
  }
}
