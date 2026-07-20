import type { SupabaseClient } from "@supabase/supabase-js"
import { STATIONS, type Station } from "@/lib/stations/config"
import {
  AVAILABILITY_META,
  isValidAvailabilityStatus,
  type StationAvailabilityStatus,
} from "@/lib/stations/availability"
import { stationBlockMessage } from "@/lib/menu/station-order-block"
import type { PersistOrderItemInput } from "@/lib/orders/create-table-order"
import {
  formatBilingualPair,
  optionsSnapshotFromNotes,
  type OrderItemModifierSnapshot,
  type OrderItemOptionsSnapshot,
  type OrderItemVariantSnapshot,
} from "@/lib/orders/order-item-options"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const CATALOG_FALLBACK_ID_PREFIX = "catalog-tajine-haupt-prod-"

function slugFromFallbackProductId(productId: string | undefined): string | null {
  if (!productId?.startsWith(CATALOG_FALLBACK_ID_PREFIX)) return null
  const slug = productId.slice(CATALOG_FALLBACK_ID_PREFIX.length).trim()
  return slug || null
}

async function resolveProductIdsBySlug(
  supabase: SupabaseClient,
  slugs: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (slugs.length === 0) return out

  const { data, error } = await supabase
    .from("products")
    .select("id, slug, is_archived")
    .in("slug", slugs)

  if (error) {
    console.error("[validate-order-items] slug lookup error:", error)
    throw new Error(error.message)
  }

  for (const row of data ?? []) {
    if ((row as { is_archived?: boolean }).is_archived) continue
    const slug = String((row as { slug?: string }).slug ?? "").trim()
    const id = String((row as { id?: string }).id ?? "").trim()
    if (slug && id && UUID_RE.test(id)) out.set(slug, id)
  }

  return out
}

type DbVariant = {
  id: string
  name_de: string
  name_ar: string | null
  price: number
  group_name_de: string
  group_name_ar: string | null
}

type DbModifier = {
  id: string
  name_de: string
  name_ar: string | null
  price: number
  group_name_de: string
  group_name_ar: string | null
}

export type ValidatedOrderItem = {
  productId?: string
  name: string
  name_ar?: string | null
  quantity: number
  unitPrice: number
  notes?: string | null
  options_snapshot: OrderItemOptionsSnapshot
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
    .select("id, product_id, name_de, name_ar")
    .in("product_id", productIds)
  if (groupErr || !groups?.length) return out

  const groupIds = groups.map((g) => String(g.id))
  const groupMeta = new Map(
    groups.map((g) => [
      String(g.id),
      {
        product_id: String(g.product_id),
        group_name_de: String(g.name_de),
        group_name_ar: (g.name_ar as string | null) ?? null,
      },
    ]),
  )

  const { data: variants, error: varErr } = await supabase
    .from("product_variants")
    .select("id, group_id, name_de, name_ar, price, display_order")
    .in("group_id", groupIds)
    .eq("is_available", true)
    .order("display_order", { ascending: true })
  if (varErr || !variants?.length) return out

  for (const v of variants) {
    const meta = groupMeta.get(String(v.group_id))
    if (!meta) continue
    const list = out.get(meta.product_id) ?? []
    list.push({
      id: String(v.id),
      name_de: String(v.name_de),
      name_ar: (v.name_ar as string | null) ?? null,
      price: Number(v.price) || 0,
      group_name_de: meta.group_name_de,
      group_name_ar: meta.group_name_ar,
    })
    out.set(meta.product_id, list)
  }
  return out
}

async function loadModifiersByProductId(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, DbModifier[]>> {
  const out = new Map<string, DbModifier[]>()
  if (productIds.length === 0) return out

  const { data: groups, error: groupErr } = await supabase
    .from("product_modifier_groups")
    .select("id, product_id, name_de, name_ar")
    .in("product_id", productIds)
  if (groupErr || !groups?.length) return out

  const groupIds = groups.map((g) => String(g.id))
  const groupMeta = new Map(
    groups.map((g) => [
      String(g.id),
      {
        product_id: String(g.product_id),
        group_name_de: String(g.name_de),
        group_name_ar: (g.name_ar as string | null) ?? null,
      },
    ]),
  )

  const { data: modifiers, error: modErr } = await supabase
    .from("product_modifiers")
    .select("id, group_id, name_de, name_ar, price, display_order")
    .in("group_id", groupIds)
    .eq("is_available", true)
    .order("display_order", { ascending: true })
  if (modErr || !modifiers?.length) return out

  for (const m of modifiers) {
    const meta = groupMeta.get(String(m.group_id))
    if (!meta) continue
    const list = out.get(meta.product_id) ?? []
    list.push({
      id: String(m.id),
      name_de: String(m.name_de),
      name_ar: (m.name_ar as string | null) ?? null,
      price: Number(m.price) || 0,
      group_name_de: meta.group_name_de,
      group_name_ar: meta.group_name_ar,
    })
    out.set(meta.product_id, list)
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

function resolveVariant(item: PersistOrderItemInput, variants: DbVariant[]): DbVariant | null {
  if (variants.length === 0) return null
  if (item.variantId && UUID_RE.test(item.variantId)) {
    const byId = variants.find((v) => v.id === item.variantId)
    if (byId) return byId
  }
  return variantFromNotes(item.notes, variants)
}

function extractCustomerNote(notes: string | null | undefined): string | null {
  if (!notes?.trim()) return null
  for (const line of notes.split("\n")) {
    const trimmed = line.trim()
    if (/^note:/i.test(trimmed)) {
      return trimmed.replace(/^note:\s*/i, "").trim() || null
    }
  }
  return null
}

function extractExtraLabels(notes: string | null | undefined): string[] {
  if (!notes?.trim()) return []
  return notes
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("+"))
    .map((l) => l.replace(/^\+\s*/, "").split(" / ")[0]?.trim())
    .filter((l): l is string => Boolean(l))
}

function resolveModifiersFromNotes(
  notes: string | null | undefined,
  modifiers: DbModifier[],
  productName: string,
): OrderItemModifierSnapshot[] {
  const labels = extractExtraLabels(notes)
  const out: OrderItemModifierSnapshot[] = []
  for (const label of labels) {
    const match =
      modifiers.find((m) => m.name_de === label) ??
      modifiers.find((m) => label.startsWith(m.name_de))
    if (match) {
      out.push({
        id: match.id,
        group_name_de: match.group_name_de,
        group_name_ar: match.group_name_ar,
        name_de: match.name_de,
        name_ar: match.name_ar,
      })
      if (!match.name_ar) {
        console.warn(
          `[validate-order-items] Missing Arabic for modifier "${match.name_de}" on « ${productName} »`,
        )
      }
    } else {
      out.push({
        group_name_de: "Extras",
        group_name_ar: "الإضافات",
        name_de: label,
        name_ar: null,
      })
      console.warn(
        `[validate-order-items] Unknown modifier "${label}" on « ${productName} » — DE only`,
      )
    }
  }
  return out
}

function buildOptionsSnapshot(args: {
  variant: DbVariant | null
  modifiers: OrderItemModifierSnapshot[]
  customerNote: string | null
  productName: string
}): OrderItemOptionsSnapshot {
  let variantSnap: OrderItemVariantSnapshot | null = null
  if (args.variant) {
    variantSnap = {
      id: args.variant.id,
      group_name_de: args.variant.group_name_de,
      group_name_ar: args.variant.group_name_ar,
      name_de: args.variant.name_de,
      name_ar: args.variant.name_ar,
    }
    if (!args.variant.name_ar) {
      console.warn(
        `[validate-order-items] Missing Arabic for variant "${args.variant.name_de}" on « ${args.productName} »`,
      )
    }
  }

  return {
    variant: variantSnap,
    modifiers: args.modifiers,
    customer_note: args.customerNote,
  }
}

function notesFromSnapshot(snapshot: OrderItemOptionsSnapshot): string | null {
  const lines: string[] = []
  if (snapshot.variant) {
    lines.push(
      `Size: ${formatBilingualPair(snapshot.variant.name_de, snapshot.variant.name_ar)}`,
    )
  }
  for (const mod of snapshot.modifiers) {
    lines.push(`+ ${formatBilingualPair(mod.name_de, mod.name_ar)}`)
  }
  if (snapshot.customer_note) lines.push(`Note: ${snapshot.customer_note}`)
  return lines.length > 0 ? lines.join("\n") : null
}

/** Valide produits + stations avant insertion commande (prix DB, dispo, station ouverte). */
export async function validateAndEnrichOrderItems(
  supabase: SupabaseClient,
  items: PersistOrderItemInput[],
): Promise<ValidatedOrderItem[]> {
  if (items.length === 0) throw new Error("items requis")

  const slugsToResolve = new Set<string>()
  for (const it of items) {
    if (it.productId && UUID_RE.test(it.productId)) continue
    const slug = (it.slug?.trim() || slugFromFallbackProductId(it.productId)) ?? null
    if (slug) slugsToResolve.add(slug)
  }
  const slugToProductId = await resolveProductIdsBySlug(supabase, [...slugsToResolve])

  const normalizedItems = items.map((it) => {
    if (it.productId && UUID_RE.test(it.productId)) return it
    const slug = (it.slug?.trim() || slugFromFallbackProductId(it.productId)) ?? null
    const resolvedId = slug ? slugToProductId.get(slug) : undefined
    if (resolvedId) return { ...it, productId: resolvedId }
    return it
  })

  const productIds = normalizedItems
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
  const modifiersByProductId = await loadModifiersByProductId(supabase, productIds)
  const stationMap = await loadStationStatusMap(supabase)
  const validated: ValidatedOrderItem[] = []

  for (const it of normalizedItems) {
    const qty = Number(it.quantity) || 0
    if (qty <= 0) throw new Error("Quantité invalide")

    if (!it.productId || !UUID_RE.test(it.productId)) {
      const slugHint = it.slug?.trim() || slugFromFallbackProductId(it.productId)
      throw new Error(
        slugHint
          ? `Produit introuvable en base (${it.name}, slug « ${slugHint} »)`
          : `Produit invalide : ${it.name}`,
      )
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
    const modifiers = modifiersByProductId.get(it.productId) ?? []
    let unitPrice = Number(prod.price) || 0

    const variant = variants.length > 0 ? resolveVariant(it, variants) : null
    if (variants.length > 0 && !variant) {
      throw new Error(`Taille requise pour « ${prod.name} »`)
    }
    if (variant) unitPrice = variant.price

    const customerNote = extractCustomerNote(it.notes)
    const modifierSnaps = resolveModifiersFromNotes(it.notes, modifiers, String(prod.name))

    let options_snapshot = buildOptionsSnapshot({
      variant,
      modifiers: modifierSnaps,
      customerNote,
      productName: String(prod.name),
    })

    if (!options_snapshot.variant && modifierSnaps.length === 0 && !customerNote && it.notes?.trim()) {
      options_snapshot = optionsSnapshotFromNotes(it.notes, String(prod.name))
    }

    for (const mod of modifierSnaps) {
      const dbMod = modifiers.find((m) => m.id === mod.id)
      if (dbMod) unitPrice += dbMod.price
    }

    const notes = notesFromSnapshot(options_snapshot)

    validated.push({
      productId: it.productId,
      name: String(prod.name),
      name_ar: (prod as { name_ar?: string | null }).name_ar ?? null,
      quantity: qty,
      unitPrice: Math.round(unitPrice * 100) / 100,
      notes,
      options_snapshot,
    })
  }

  return validated
}
