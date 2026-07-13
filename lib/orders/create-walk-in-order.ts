import type { SupabaseClient } from "@supabase/supabase-js"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { validateAndEnrichOrderItems } from "@/lib/orders/validate-order-items"
import { syncOrderInvoice } from "@/lib/caisse/sync-order-invoice"
import type { PersistOrderItemInput } from "@/lib/orders/create-table-order"

export type CreateWalkInOrderInput = {
  items: PersistOrderItemInput[]
  total?: number
  orderNumber?: string
  customerName: string
  notes?: string | null
  orderType?: string
  source?: "pos" | "server"
  createdByUserId?: string | null
  createdByEmail?: string | null
}

export type CreateWalkInOrderResult = {
  orderId: string
  orderNumber: string
  total: number
  status: string
  items: Array<{
    id: string
    productId?: string
    name: string
    name_ar?: string | null
    quantity: number
    unitPrice: number
    notes?: string | null
    station?: string | null
    station_status?: string | null
  }>
}

/** Commande sans table (à emporter, téléphone) — persistée en base, routée aux stations. */
export async function createWalkInOrder(
  supabase: SupabaseClient,
  input: CreateWalkInOrderInput,
): Promise<CreateWalkInOrderResult> {
  const validatedItems = await validateAndEnrichOrderItems(supabase, input.items)
  const total =
    typeof input.total === "number"
      ? input.total
      : validatedItems.reduce((s, it) => s + it.unitPrice * it.quantity, 0)

  const orderNumber =
    input.orderNumber?.trim() ||
    `W-${String(Math.floor(1000 + Math.random() * 9000))}`

  const orderType = input.orderType ?? input.source ?? "pos"
  const source = input.source ?? "pos"

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: input.customerName,
      order_type: orderType,
      source,
      subtotal: total,
      total,
      status: "pending",
      notes: input.notes ?? null,
    })
    .select("*")
    .single()

  if (orderErr || !order) {
    throw new Error(orderErr?.message ?? "Impossible d'enregistrer la commande")
  }

  const rows = validatedItems.map((it) => ({
    order_id: order.id,
    product_id: it.productId,
    product_name: it.name,
    product_name_ar: it.name_ar?.trim() || null,
    quantity: it.quantity,
    unit_price: it.unitPrice,
    subtotal: it.unitPrice * it.quantity,
    special_instructions: it.notes ?? null,
    options_snapshot: it.options_snapshot,
  }))

  const { data: insertedItems, error: itemsErr } = await supabase
    .from("order_items")
    .insert(rows)
    .select("id, product_id, product_name, product_name_ar, quantity, unit_price, special_instructions, options_snapshot, station, station_status")

  if (itemsErr) {
    await supabase.from("orders").delete().eq("id", order.id)
    throw new Error(itemsErr.message)
  }

  await insertCaisseAudit(supabase, {
    userId: input.createdByUserId ?? null,
    userEmail: input.createdByEmail ?? null,
    action: "order_created",
    entityType: "orders",
    entityId: String(order.id),
    oldValues: null,
    newValues: {
      order_number: orderNumber,
      source,
      walk_in: true,
      item_count: validatedItems.length,
    },
    metadata: { source, walk_in: true },
  })

  await syncOrderInvoice(supabase, {
    orderId: String(order.id),
    reason: "order_created",
    actorId: input.createdByUserId ?? null,
    actorEmail: input.createdByEmail ?? null,
    metadata: { source, walk_in: true, order_number: orderNumber },
  })

  return {
    orderId: String(order.id),
    orderNumber,
    total: Number(order.total ?? total),
    status: String(order.status ?? "pending"),
    items: (insertedItems ?? []).map((row) => ({
      id: String(row.id),
      productId: row.product_id ? String(row.product_id) : undefined,
      name: String(row.product_name),
      name_ar: row.product_name_ar ? String(row.product_name_ar) : null,
      quantity: Number(row.quantity) || 0,
      unitPrice: Number(row.unit_price) || 0,
      notes: row.special_instructions ?? null,
      station: row.station ?? null,
      station_status: row.station_status ?? null,
    })),
  }
}
