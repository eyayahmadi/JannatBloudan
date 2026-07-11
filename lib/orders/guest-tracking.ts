/**
 * Commande invité (QR / suivi) : mapping statuts DB → UI tracker.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isLikelyOrderUuid(id: string): boolean {
  return UUID_RE.test(id.trim())
}

export type GuestTrackerStatus = "received" | "preparing" | "ready" | "completed" | "cancelled"

export function mapDbOrderStatusToGuestTracker(raw: string | null | undefined): GuestTrackerStatus {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()

  if (s === "cancelled" || s === "annulée" || s === "annulee") return "cancelled"
  if (s === "completed" || s === "livrée" || s === "livree") return "completed"
  if (s === "delivering" || s === "en livraison") return "ready"
  if (s === "ready" || s === "prête" || s === "prete") return "ready"
  if (s === "preparing" || s === "en préparation" || s === "en preparation") return "preparing"
  return "received"
}

type DbOrderRow = {
  id: string
  order_number: string
  table_id?: number | null
  order_type?: string | null
  status?: string | null
  customer_name?: string | null
  total?: number | string | null
  created_at?: string | null
  updated_at?: string | null
}

type DbOrderItemRow = {
  product_name: string
  product_name_ar?: string | null
  quantity: number | string
}

export function shapeGuestOrderResponse(order: DbOrderRow, items: DbOrderItemRow[]) {
  const total =
    typeof order.total === "number" ? order.total : Number.parseFloat(String(order.total ?? "0")) || 0

  return {
    id: order.id,
    order_number: order.order_number,
    table_number: order.table_id != null ? Number(order.table_id) : 0,
    order_type: order.order_type ?? "qr_self_service",
    status: mapDbOrderStatusToGuestTracker(order.status),
    items: items.map((it) => ({
      name: it.product_name,
      name_ar: it.product_name_ar?.trim() || null,
      quantity: typeof it.quantity === "number" ? it.quantity : Number.parseInt(String(it.quantity), 10) || 0,
    })),
    created_at: order.created_at ?? new Date().toISOString(),
    updated_at: order.updated_at ?? order.created_at ?? new Date().toISOString(),
    customer_name: order.customer_name ?? "",
    total,
  }
}
