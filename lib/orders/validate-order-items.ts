import type { SupabaseClient } from "@supabase/supabase-js"
import { STATIONS, type Station } from "@/lib/stations/config"
import {
  AVAILABILITY_META,
  isValidAvailabilityStatus,
  type StationAvailabilityStatus,
} from "@/lib/stations/availability"
import { stationBlockMessage } from "@/lib/menu/station-order-block"
import type { PersistOrderItemInput } from "@/lib/orders/create-table-order"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type DbVariant = {
  id: string
  name_de: string
  name_ar: string | null
  price: number
}

export type ValidatedOrderItem = {
  productId?: string
  name: string
  name_ar?: string | null
  quantity: number
  unitPrice: number
  notes?: string | null
}

async function loadStationStatusMap(
  supabase: SupabaseClient,
): Promise<Map<Station, StationAvailabilityStatus>> {
  const { data: stationRows } = await supabase.from("station_availability").select("station, status")
  const stationMap = new Map<Station, StationAvailabilityStatus>()
  for (const r of stationRows ?? []) {
    const s = r.station as Station
    if (STATIONS.includes(s) && isValidAvailabilityStatus(r.status)) {
      stationMap.set(s, r.status)
    }
  }
  return stationMap
}

async function loadVariantsByProductId(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, DbVariant[]>> {
  const out = new Map<string, DbVariant[]>()
  if (productIds.length === 0) return out

  const { data: groups, error: groupErr } = await supabase
    .from("product_variant_groups")
    .select("id, product_id")
    .in("product_id", productIds)
  if (groupErr || !groups?.length) return out

  const groupIds = groups.map((g) => String(g.id))
  const groupToProduct = new Map(groups.map((g) => [String(g.id), String(g.product_id)]))

  const { data: variants, error: varErr } = await supabase
    .from("product_variants")
    .select("id, group_id, name_de, name_ar, price, display_order")
    .in("group_id", groupIds)
    .eq("is_available", true)
    .order("display_order", { ascending: true })
  if (varErr || !variants?.length) return out

  for (const v of variants) {
    const productId = groupToProduct.get(String(v.group_id))
    if (!productId) continue
    const list = out.get(productId) ?? []
    list.push({
      id: String(v.id),
      name_de: String(v.name_de),
      name_ar: (v.name_ar as string | null) ?? null,
      price: Number(v.price) || 0,
    })
    out.set(productId, list)
  }
  return out
}

function variantFromNotes(notes: string | null | undefined, variants: DbVariant[]): DbVariant | null {
  if (!notes?.trim() || variants.length === 0) return null
  const sizeLine = notes
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.toLowerCase().startsWith("size:"))
  if (!sizeLine) return null
  const label = sizeLine.replace(/^size:\s*/i, "").split(" / ")[0]?.trim()
  if (!label) return null
  return (
    variants.find((v) => v.name_de === label) ??
    variants.find((v) => label.startsWith(v.name_de)) ??
    null
  )
}

function resolveVariant(
  item: PersistOrderItemInput,
  variants: DbVariant[],
): DbVariant | null {
  if (variants.length === 0) return null
  if (item.variantId && UUID_RE.test(item.variantId)) {
    const byId = variants.find((v) => v.id === item.variantId)
    if (byId) return byId
  }
  return variantFromNotes(item.notes, variants)
}

/** Valide produits + stations avant insertion commande (prix DB, dispo, station ouverte). */
export async function validateAndEnrichOrderItems(
  supabase: SupabaseClient,
  items: PersistOrderItemInput[],
): Promise<ValidatedOrderItem[]> {
  if (items.length === 0) throw new Error("items requis")

  const productIds = items
    .map((it) => it.productId)
    .filter((id): id is string => !!id && UUID_RE.test(id))

  const { data: products, error: prodErr } =
    productIds.length > 0
      ? await supabase
          .from("products")
          .select("id, name, name_ar, price, is_available, is_archived, station")
          .in("id", productIds)
      : { data: [], error: null }

  if (prodErr) throw new Error(prodErr.message)

  const productMap = new Map((products ?? []).map((p) => [String(p.id), p]))
  const variantsByProductId = await loadVariantsByProductId(supabase, productIds)
  const stationMap = await loadStationStatusMap(supabase)
  const validated: ValidatedOrderItem[] = []

  for (const it of items) {
    const qty = Number(it.quantity) || 0
    if (qty <= 0) throw new Error("Quantité invalide")

    if (!it.productId || !UUID_RE.test(it.productId)) {
      throw new Error(`Produit invalide : ${it.name}`)
    }

    const prod = productMap.get(it.productId)
    if (!prod) throw new Error(`Produit introuvable : ${it.name}`)

    if ((prod as { is_archived?: boolean }).is_archived) {
      throw new Error(`« ${prod.name} » n'est plus au menu`)
    }
    if (!prod.is_available) {
      throw new Error(`« ${prod.name} » est épuisé ou indisponible`)
    }

    const station = ((prod.station as Station) ?? "KITCHEN") as Station
    const stStatus = stationMap.get(station) ?? "OPEN"
    const meta = AVAILABILITY_META[stStatus]
    if (!meta.acceptingOrders) {
      throw new Error(stationBlockMessage(station, stStatus))
    }

    const variants = variantsByProductId.get(it.productId) ?? []
    let unitPrice = Number(prod.price) || 0
    let notes = it.notes ?? null

    if (variants.length > 0) {
      const variant = resolveVariant(it, variants)
      if (!variant) {
        throw new Error(`Taille requise pour « ${prod.name} »`)
      }
      unitPrice = variant.price
      if (!notes?.includes("Size:")) {
        const sizeLabel = variant.name_ar
          ? `${variant.name_de} / ${variant.name_ar}`
          : variant.name_de
        notes = notes?.trim() ? `Size: ${sizeLabel}\n${notes.trim()}` : `Size: ${sizeLabel}`
      }
    }

    validated.push({
      productId: it.productId,
      name: String(prod.name),
      name_ar: (prod as { name_ar?: string | null }).name_ar ?? null,
      quantity: qty,
      unitPrice,
      notes,
    })
  }

  return validated
}
