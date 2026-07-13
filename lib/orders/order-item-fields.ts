import type { SupabaseClient } from "@supabase/supabase-js"

/** Champs order_items renvoyés par les APIs station / live KDS. */
export const ORDER_ITEM_KDS_SELECT = [
  "id",
  "order_id",
  "product_id",
  "product_name",
  "product_name_ar",
  "quantity",
  "unit_price",
  "special_instructions",
  "options_snapshot",
  "station",
  "station_status",
  "started_at",
  "ready_at",
  "served_at",
  "accepted_at",
  "accepted_by",
  "refused_at",
  "refusal_reason",
  "refusal_note",
  "billable",
].join(", ")

type ItemWithProductRef = {
  product_id?: string | null
  product_name_ar?: string | null
}

/** Remplit product_name_ar depuis products.name_ar si absent sur la ligne commande. */
export async function enrichOrderItemsWithProductArabic<
  T extends ItemWithProductRef,
>(supabase: SupabaseClient, itemRows: T[]): Promise<T[]> {
  const missingIds = new Set<string>()
  for (const row of itemRows) {
    if (!String(row.product_name_ar ?? "").trim() && row.product_id) {
      missingIds.add(String(row.product_id))
    }
  }
  if (missingIds.size === 0) return itemRows

  const { data: products } = await supabase
    .from("products")
    .select("id, name_ar")
    .in("id", [...missingIds])

  const arByProductId = new Map(
    (products ?? []).map((p) => [String(p.id), String((p as { name_ar?: string | null }).name_ar ?? "").trim()]),
  )

  return itemRows.map((row) => {
    if (String(row.product_name_ar ?? "").trim() || !row.product_id) return row
    const ar = arByProductId.get(String(row.product_id))
    if (!ar) return row
    return { ...row, product_name_ar: ar }
  })
}

/** Une ligne order_items — complète product_name_ar si manquant. */
export async function enrichSingleOrderItemRow<
  T extends ItemWithProductRef,
>(supabase: SupabaseClient, row: T): Promise<T> {
  const [enriched] = await enrichOrderItemsWithProductArabic(supabase, [row])
  return enriched
}
