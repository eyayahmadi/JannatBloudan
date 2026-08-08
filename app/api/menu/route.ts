import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { computeMaxServings, productTags } from "@/lib/menu/availability"
import { buildOftenOrderedWith } from "@/lib/menu/build-pairs"
import { MENU_POPULAR_ORDER_MIN } from "@/lib/menu/menu-constants"
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config"
import { translateStrings } from "@/lib/server/translation-service"
import type { MenuSortId, DigitalMenuProduct, ProductModifier, ProductVariant } from "@/lib/menu/digital-menu-product"
import { sortMenuProducts } from "@/lib/menu/filter-menu-client"
import { sortByMenuCardOrder } from "@/lib/menu/menu-order"
import { STATIONS, type Station } from "@/lib/stations/config"
import {
  AVAILABILITY_META,
  defaultStationAvailability,
  isValidAvailabilityStatus,
  type StationAvailability,
  type StationAvailabilityStatus,
} from "@/lib/stations/availability"
import { fetchMenuHomepageSections } from "@/lib/menu/menu-homepage-sections"
import { getLiveMenuCatalog } from "@/lib/menu/menu-catalog-service"
import { resolveMenuProductImageUrl } from "@/lib/menu/resolve-product-image"

export const dynamic = "force-dynamic"

type ProductRow = Record<string, unknown> & {
  id: string
  name: string
  price: number
  name_ar?: string | null
  description?: string | null
  description_ar?: string | null
  is_available?: boolean
  is_popular?: boolean
  is_new?: boolean
  is_chef_choice?: boolean
  is_recommended?: boolean
  is_vegetarian?: boolean
  spice_level?: string | null
  station?: string | null
  stock_quantity?: number
  tags?: string[] | null
  created_at?: string | null
  categories?: {
    id?: string
    name: string
    slug: string
    section?: string
    display_order?: number
    icon_emoji?: string | null
    name_ar?: string | null
  } | null
  product_ingredients?: Array<{
    quantity: number | string
    ingredients: {
      id: string
      stock_quantity: number | string
      threshold_low?: number | string | null
      unit?: string | null
    } | null
  }> | null
}

async function loadAdminRecommendations(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {}
  try {
    const { data } = await supabase
      .from("product_recommendations")
      .select("product_id, recommended_product_id, display_order")
      .order("display_order", { ascending: true })
    for (const r of data ?? []) {
      const pid = String(r.product_id)
      if (!out[pid]) out[pid] = []
      out[pid].push(String(r.recommended_product_id))
    }
  } catch {
    // migration 34 optionnelle
  }
  return out
}


type ModifierGroupRow = { id: string; product_id: string }
type ModifierRow = {
  id: string
  slug: string
  name_de: string
  name_ar: string | null
  price: number | string
  group_id: string
  display_order: number
}

async function loadProductModifiers(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Map<string, ProductModifier[]>> {
  const out = new Map<string, ProductModifier[]>()
  try {
    const groupsRes = await supabase.from("product_modifier_groups").select("id, product_id")
    if (groupsRes.error) return out

    const modsRes = await supabase
      .from("product_modifiers")
      .select("id, slug, name_de, name_ar, price, group_id, display_order")
      .eq("is_available", true)
      .order("display_order", { ascending: true })
    if (modsRes.error) return out

    const groupToProduct = new Map<string, string>()
    for (const g of (groupsRes.data ?? []) as ModifierGroupRow[]) {
      groupToProduct.set(g.id, g.product_id)
    }

    for (const m of (modsRes.data ?? []) as ModifierRow[]) {
      const productId = groupToProduct.get(m.group_id)
      if (!productId) continue
      const list = out.get(productId) ?? []
      list.push({
        id: m.id,
        slug: m.slug,
        name: m.name_de,
        name_ar: m.name_ar,
        price: Number(m.price) || 0,
      })
      out.set(productId, list)
    }
  } catch {
    // Tables optionnelles (migration 33)
  }
  return out
}

type VariantGroupRow = { id: string; product_id: string }
type VariantRow = {
  id: string
  slug: string
  name_de: string
  name_ar: string | null
  price: number | string
  group_id: string
  display_order: number
}

async function loadProductVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Map<string, ProductVariant[]>> {
  const out = new Map<string, ProductVariant[]>()
  try {
    const groupsRes = await supabase.from("product_variant_groups").select("id, product_id")
    if (groupsRes.error) return out

    const varsRes = await supabase
      .from("product_variants")
      .select("id, slug, name_de, name_ar, price, group_id, display_order")
      .eq("is_available", true)
      .order("display_order", { ascending: true })
    if (varsRes.error) return out

    const groupToProduct = new Map<string, string>()
    for (const g of (groupsRes.data ?? []) as VariantGroupRow[]) {
      groupToProduct.set(g.id, g.product_id)
    }

    for (const v of (varsRes.data ?? []) as VariantRow[]) {
      const productId = groupToProduct.get(v.group_id)
      if (!productId) continue
      const list = out.get(productId) ?? []
      list.push({
        id: v.id,
        slug: v.slug,
        name: v.name_de,
        name_ar: v.name_ar,
        price: Number(v.price) || 0,
      })
      out.set(productId, list)
    }
  } catch {
    // Tables optionnelles (migration 33)
  }
  return out
}

function enrich(
  p: ProductRow,
  sectionByCategoryId: Map<string, string>,
  categoryOrderBySlug: Map<string, number>,
  modifiersByProductId: Map<string, ProductModifier[]>,
  variantsByProductId: Map<string, ProductVariant[]>,
) {
  const stock = Number(p.stock_quantity) || 0
  const recipe = p.product_ingredients
  const { availability, maxOrderable, limitedReason } = computeMaxServings(recipe, stock)
  const tags = productTags(p)
  const adminOff = p.is_available === false
  const canOrder = !adminOff && availability !== "out" && (maxOrderable ?? 0) >= 1
  const createdRaw = p.created_at
  const created_at =
    typeof createdRaw === "string" ? createdRaw : createdRaw ? String(createdRaw) : null
  const catId = p.categories?.id
  const secFromMap = catId ? sectionByCategoryId.get(catId) : undefined
  const catSlug = p.categories?.slug ?? "other"
  const modifiers = modifiersByProductId.get(p.id) ?? []
  const variants = variantsByProductId.get(p.id) ?? []
  const basePrice = Number(p.price) || 0
  const displayPrice =
    variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : basePrice
  return {
    id: p.id,
    slug: String((p as { slug?: string }).slug ?? ""),
    name: p.name,
    name_ar: p.name_ar ?? null,
    description:
      p.description && String(p.description).trim()
        ? String(p.description)
        : `Découvrez notre ${p.name} — préparé sur place avec des ingrédients sélectionnés.`,
    description_ar:
      (p as { description_ar?: string | null }).description_ar &&
      String((p as { description_ar?: string | null }).description_ar).trim()
        ? String((p as { description_ar?: string | null }).description_ar)
        : null,
    category: catSlug,
    categoryName: p.categories?.name ?? "",
    category_display_order: categoryOrderBySlug.get(catSlug) ?? 0,
    display_order: Number((p as { display_order?: number }).display_order) || 0,
    section: secFromMap ?? p.categories?.section ?? "food",
    price: displayPrice,
    image_url: resolveMenuProductImageUrl(
      p.image_url != null ? String(p.image_url) : null,
      catSlug,
      String((p as { slug?: string }).slug ?? ""),
    ),
    station: p.station ?? "KITCHEN",
    /** Recalculé après agrégation commandes */
    is_popular: !!p.is_popular,
    is_new: !!p.is_new,
    is_vegetarian: !!p.is_vegetarian,
    spice_level: p.spice_level ?? null,
    is_chef_choice: !!p.is_chef_choice,
    is_recommended: !!p.is_recommended,
    tags,
    availability: adminOff ? ("out" as const) : availability,
    max_orderable: maxOrderable ?? 0,
    limited_reason: limitedReason,
    can_order: canOrder,
    created_at,
    order_count: 0,
    modifiers,
    variants,
    has_variants: variants.length > 0 || tags.includes("has_variants"),
    is_customizable:
      modifiers.length > 0 || variants.length > 0 || tags.includes("customizable"),
  }
}

type EnrichedProduct = ReturnType<typeof enrich>

async function localizeProducts(
  items: EnrichedProduct[],
  locale: Locale,
): Promise<EnrichedProduct[]> {
  // Official product names (DE + name_ar) are never machine-translated.
  // Only descriptions and category labels (UI) are localized.
  if (locale === "de") return items
  const texts: string[] = []
  for (const it of items) {
    texts.push(it.description)
    texts.push(it.categoryName)
  }
  const translated = await translateStrings(texts, locale, "de")
  return items.map((it, idx) => {
    const base = idx * 2
    return {
      ...it,
      description: translated[base] ?? it.description,
      categoryName: translated[base + 1] ?? it.categoryName,
    }
  })
}

function parseBool(v: string | null): boolean {
  return v === "1" || v === "true"
}

function applyServerParams(list: EnrichedProduct[], sp: URLSearchParams): EnrichedProduct[] {
  let filtered = [...list]

  const q = (sp.get("search") ?? sp.get("q") ?? "").toLowerCase().trim()
  if (q) {
    filtered = filtered.filter((p) => {
      const inTags = p.tags.some((t) => t.toLowerCase().includes(q))
      return (
        p.name.toLowerCase().includes(q) ||
        (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        inTags
      )
    })
  }

  const section = sp.get("section")
  if (section && section !== "all") {
    filtered = filtered.filter((p) => p.section === section)
  }

  const category = sp.get("category")
  if (category && category !== "all") {
    filtered = filtered.filter((p) => p.category === category)
  }

  const minPrice = sp.get("minPrice")
  if (minPrice) {
    const m = Number(minPrice)
    if (Number.isFinite(m)) filtered = filtered.filter((p) => p.price >= m)
  }
  const maxPrice = sp.get("maxPrice")
  if (maxPrice) {
    const m = Number(maxPrice)
    if (Number.isFinite(m)) filtered = filtered.filter((p) => p.price <= m)
  }

  if (parseBool(sp.get("popular"))) {
    filtered = filtered.filter((p) => p.tags.includes("popular") || p.tags.includes("best_seller"))
  }
  if (parseBool(sp.get("new"))) {
    filtered = filtered.filter((p) => p.tags.includes("new"))
  }
  if (parseBool(sp.get("vegetarian"))) {
    filtered = filtered.filter((p) => p.tags.includes("vegetarian") || p.tags.includes("vegan"))
  }
  if (parseBool(sp.get("spicy"))) {
    filtered = filtered.filter((p) => p.tags.includes("spicy"))
  }
  if (parseBool(sp.get("not_spicy"))) {
    filtered = filtered.filter((p) => p.tags.includes("not_spicy"))
  }
  if (parseBool(sp.get("vegan"))) {
    filtered = filtered.filter((p) => p.tags.includes("vegan"))
  }
  if (parseBool(sp.get("kids"))) {
    filtered = filtered.filter((p) => p.tags.includes("kids_friendly"))
  }
  if (parseBool(sp.get("chef"))) {
    filtered = filtered.filter((p) => p.tags.includes("chef_recommendation"))
  }

  const station = sp.get("station")?.toUpperCase().trim()
  if (station && STATIONS.includes(station as (typeof STATIONS)[number])) {
    filtered = filtered.filter((p) => p.station === station)
  }

  const tagsCsv = sp.get("tags")
  if (tagsCsv) {
    const need = tagsCsv
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
    if (need.length) {
      filtered = filtered.filter((p) => {
        const pt = p.tags.map((x) => x.toLowerCase())
        return need.every((t) => pt.some((x) => x.includes(t) || t.includes(x)))
      })
    }
  }

  if (parseBool(sp.get("available"))) {
    filtered = filtered.filter((p) => p.can_order)
  }

  const sortRaw = sp.get("sort") as MenuSortId | null
  const sorts: MenuSortId[] = ["name", "price_asc", "price_desc", "popular", "new", "recommended"]
  if (sortRaw && sorts.includes(sortRaw)) {
    filtered = sortMenuProducts(filtered as DigitalMenuProduct[], sortRaw) as EnrichedProduct[]
  } else {
    filtered = sortByMenuCardOrder(filtered)
  }

  return filtered
}

function mergeOrderStats(items: EnrichedProduct[], sold: Map<string, number>): EnrichedProduct[] {
  return items.map((it) => {
    const oc = sold.get(it.id) ?? 0
    const popular = it.is_popular || oc >= MENU_POPULAR_ORDER_MIN
    return { ...it, order_count: oc, is_popular: popular }
  })
}

/** True si au moins un filtre métier serveur est passé (hors locale / include_unavailable). */
function hasServerFilters(sp: URLSearchParams): boolean {
  const ignore = new Set(["locale", "include_unavailable"])
  for (const k of sp.keys()) {
    if (ignore.has(k)) continue
    const v = sp.get(k)
    if (v != null && v !== "") return true
  }
  return false
}

export async function GET(request: NextRequest) {
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ menu: null, source: "mock", message: "Supabase requis" })
  }

  const { searchParams } = new URL(request.url)
  const includeUnavailable = searchParams.get("include_unavailable") === "1"
  const serverFiltering = hasServerFilters(searchParams)

  const rawLocale = searchParams.get("locale")
  const locale: Locale =
    rawLocale && isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE

  try {
    const supabase = await createClient()

    const { categories: categoryRows, products: productRowsRaw, error: catalogErr } =
      await getLiveMenuCatalog(supabase)
    if (catalogErr) {
      return NextResponse.json({ error: catalogErr }, { status: 500 })
    }

    const sectionByCategoryId = new Map<string, string>()
    const categoryOrderBySlug = new Map<string, number>()
    for (const c of categoryRows) {
      sectionByCategoryId.set(c.id, c.section ?? "food")
      categoryOrderBySlug.set(c.slug, c.display_order ?? 0)
    }

    const [{ data: oi }, { data: availRows }, modifiersByProductId, variantsByProductId, adminRecommendations] =
      await Promise.all([
        supabase
          .from("order_items")
          .select("order_id, product_id, quantity")
          .not("product_id", "is", null)
          .limit(12000),
        supabase
          .from("station_availability")
          .select("station, status, reason, estimated_wait_minutes, closes_at, updated_at"),
        loadProductModifiers(supabase),
        loadProductVariants(supabase),
        loadAdminRecommendations(supabase),
      ])

    const productRows = productRowsRaw as unknown as ProductRow[]
    const stationAvailMap = new Map<Station, StationAvailability>()
    for (const station of STATIONS) {
      stationAvailMap.set(station, defaultStationAvailability(station))
    }
    for (const r of (availRows ?? []) as Array<{
      station: string
      status: string
      reason: string | null
      estimated_wait_minutes: number | null
      closes_at: string | null
      updated_at: string
    }>) {
      const s = r.station as Station
      if (!STATIONS.includes(s)) continue
      if (!isValidAvailabilityStatus(r.status)) continue
      stationAvailMap.set(s, {
        station: s,
        status: r.status as StationAvailabilityStatus,
        reason: r.reason,
        estimated_wait_minutes: r.estimated_wait_minutes,
        closes_at: r.closes_at,
        updated_at: r.updated_at,
      })
    }

    const enrichedRows = productRows.map((r) => {
      const base = enrich(r, sectionByCategoryId, categoryOrderBySlug, modifiersByProductId, variantsByProductId)
      const stationKey = (base.station as Station) ?? "KITCHEN"
      const avail = stationAvailMap.get(stationKey)
      const meta = avail ? AVAILABILITY_META[avail.status] : null
      const hide = meta?.hideInMenu ?? false
      const accepting = meta?.acceptingOrders ?? true
      return {
        ...base,
        station_status: avail?.status ?? ("OPEN" as StationAvailabilityStatus),
        station_accepting_orders: accepting,
        station_hidden: hide,
        can_order: base.can_order && accepting,
      }
    })

    const localized =
      locale === "fr" ? enrichedRows : await localizeProducts(enrichedRows, locale)

    const sold = new Map<string, number>()
    for (const r of oi ?? []) {
      const row = r as { product_id?: string | null; quantity?: number | string | null }
      const pid = row.product_id
      if (!pid) continue
      const qn = Number(row.quantity) || 0
      sold.set(pid, (sold.get(pid) ?? 0) + qn)
    }

    const withStats = mergeOrderStats(localized, sold)
    const coOccurrence = buildOftenOrderedWith(
      (oi ?? []) as { order_id: string | null; product_id: string | null }[],
      6,
    )
    const often_ordered_with: Record<string, string[]> = { ...coOccurrence }
    for (const [pid, ids] of Object.entries(adminRecommendations)) {
      if (ids.length > 0) often_ordered_with[pid] = ids
    }

    const baseList = includeUnavailable ? withStats : withStats.filter((p) => p.can_order)

    let items: EnrichedProduct[]
    if (serverFiltering) {
      items = applyServerParams(withStats, searchParams)
      if (!includeUnavailable && !parseBool(searchParams.get("available"))) {
        items = items.filter((p) => p.can_order)
      }
    } else {
      items = sortByMenuCardOrder(baseList)
    }

    const mostOrderedIds = [...sold.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    const bySection = {
      food: [] as typeof items,
      desserts: [] as typeof items,
      drinks: [] as typeof items,
      special: [] as typeof items,
    }
    for (const p of items) {
      const s = p.section in bySection ? (p.section as keyof typeof bySection) : "food"
      if (bySection[s]) bySection[s].push(p)
    }

    const stationAvailability = STATIONS.map((s) => {
      const v = stationAvailMap.get(s) ?? defaultStationAvailability(s)
      const meta = AVAILABILITY_META[v.status]
      return {
        ...v,
        accepting_orders: meta.acceptingOrders,
        hide_in_menu: meta.hideInMenu,
      }
    })

    let homepage_sections: Record<string, string[]> = {}
    try {
      homepage_sections = await fetchMenuHomepageSections(supabase)
    } catch {
      homepage_sections = {}
    }

    return NextResponse.json(
      {
        source: "supabase",
        items,
        categories: categoryRows,
        by_section: bySection,
        often_ordered_with,
        most_ordered_ids: mostOrderedIds,
        homepage_sections,
        chef_choice: items.filter((p) => p.is_chef_choice),
        recommended: items.filter((p) => p.is_recommended),
        most_popular: [...items]
          .filter((p) => p.is_popular)
          .sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0))
          .slice(0, 8),
        station_availability: stationAvailability,
        meta: {
          client_filter_tip:
            "Pour le menu client : GET ?include_unavailable=1&locale=fr puis filtrer côté navigateur (instantané).",
          popular_threshold: MENU_POPULAR_ORDER_MIN,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    )
  } catch (e) {
    console.error("[menu]", e)
    return NextResponse.json({ error: "Erreur menu" }, { status: 500 })
  }
}
