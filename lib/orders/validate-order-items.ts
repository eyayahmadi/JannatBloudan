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

export type ValidatedOrderItem = {
  productId?: string
  name: string
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
          .select("id, name, price, is_available, is_archived, station")
          .in("id", productIds)
      : { data: [], error: null }

  if (prodErr) throw new Error(prodErr.message)

  const productMap = new Map((products ?? []).map((p) => [String(p.id), p]))
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

    validated.push({
      productId: it.productId,
      name: String(prod.name),
      quantity: qty,
      unitPrice: Number(prod.price) || 0,
      notes: it.notes ?? null,
    })
  }

  return validated
}
