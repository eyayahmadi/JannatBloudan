import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { computeMaxServings, productTags } from "@/lib/menu/availability"
import { buildOftenOrderedWith } from "@/lib/menu/build-pairs"
import { MENU_POPULAR_ORDER_MIN } from "@/lib/menu/menu-constants"
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config"
import { translateStrings } from "@/lib/server/translation-service"
import type { MenuSortId, DigitalMenuProduct } from "@/lib/menu/digital-menu-product"
import { sortMenuProducts } from "@/lib/menu/filter-menu-client"
import { STATIONS, type Station } from "@/lib/stations/config"
import {
  AVAILABILITY_META,
  defaultStationAvailability,
  isValidAvailabilityStatus,
  type StationAvailability,
  type StationAvailabilityStatus,
} from "@/lib/stations/availability"

type ProductRow = Record<string, unknown> & {
  id: string
  name: string
  price: number
  name_ar?: string | null
  description?: string | null
  image_url?: string | null
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

/** Jointure produits + catégories + ingrédients (schéma digital menu). */
const PRODUCTS_SELECT_FULL = `id, name, name_ar, slug, description, price, image_url, is_available, is_popular, is_new,
           is_chef_choice, is_recommended, is_vegetarian, spice_level, stock_quantity, tags, station, created_at,
           categories ( id, name, slug ),
           product_ingredients ( quantity, ingredients ( id, name, unit, stock_quantity, threshold_low, threshold_critical ) )`

/** Sans is_new (colonne ajoutée dans scripts/13 — parfois absente si migration partielle). */
const PRODUCTS_SELECT_NO_IS_NEW = `id, name, name_ar, slug, description, price, image_url, is_available, is_popular,
           is_chef_choice, is_recommended, is_vegetarian, spice_level, stock_quantity, tags, station, created_at,
           categories ( id, name, slug ),
           product_ingredients ( quantity, ingredients ( id, name, unit, stock_quantity, threshold_low, threshold_critical ) )`

/** Même requête sans name_ar (bases n’ayant pas exécuté scripts/13 ou 22). */
const PRODUCTS_SELECT_NO_NAME_AR = `id, name, slug, description, price, image_url, is_available, is_popular, is_new,
           is_chef_choice, is_recommended, is_vegetarian, spice_level, stock_quantity, tags, station, created_at,
           categories ( id, name, slug ),
           product_ingredients ( quantity, ingredients ( id, name, unit, stock_quantity, threshold_low, threshold_critical ) )`

/** Schéma minimal produits : sans name_ar ni is_new. */
const PRODUCTS_SELECT_NO_NAME_AR_NO_IS_NEW = `id, name, slug, description, price, image_url, is_available, is_popular,
           is_chef_choice, is_recommended, is_vegetarian, spice_level, stock_quantity, tags, station, created_at,
           categories ( id, name, slug ),
           product_ingredients ( quantity, ingredients ( id, name, unit, stock_quantity, threshold_low, threshold_critical ) )`

function isMissingColumnError(msg: string | undefined): boolean {
  if (!msg) return false
  const m = msg.toLowerCase()
  return m.includes("does not exist") || m.includes("column ") || m.includes("unknown")
}

/** Schéma complet (script 13) ; sinon fallback schéma minimal (script 01). */
async function loadMenuCategories(supabase: Awaited<ReturnType<typeof createClient>>) {
  const full = await supabase
    .from("categories")
    .select("id, name, slug, section, display_order, icon_emoji, name_ar")
    .eq("is_active", true)
    .order("section", { ascending: true })
    .order("display_order", { ascending: true })

  if (!full.error) {
    const rows = (full.data ?? []).map((c: Record<string, unknown>) => ({
      id: String(c.id),
      name: String(c.name ?? ""),
      slug: String(c.slug ?? ""),
      section: typeof c.section === "string" ? c.section : "food",
      display_order: Number(c.display_order) || 0,
      icon_emoji: c.icon_emoji != null ? String(c.icon_emoji) : null,
      name_ar: c.name_ar != null ? String(c.name_ar) : null,
    }))
    return { rows, error: null as string | null }
  }
  if (!isMissingColumnError(full.error.message)) {
    return { rows: [], error: full.error.message }
  }

  const noActiveFilter = await supabase
    .from("categories")
    .select("id, name, slug, section, display_order, icon_emoji, name_ar")
    .order("section", { ascending: true })
    .order("display_order", { ascending: true })

  if (!noActiveFilter.error) {
    const rows = (noActiveFilter.data ?? []).map((c: Record<string, unknown>) => ({
      id: String(c.id),
      name: String(c.name ?? ""),
      slug: String(c.slug ?? ""),
      section: typeof c.section === "string" ? c.section : "food",
      display_order: Number(c.display_order) || 0,
      icon_emoji: c.icon_emoji != null ? String(c.icon_emoji) : null,
      name_ar: c.name_ar != null ? String(c.name_ar) : null,
    }))
    return { rows, error: null as string | null }
  }
  if (!isMissingColumnError(noActiveFilter.error.message)) {
    return { rows: [], error: noActiveFilter.error.message }
  }

  const minimal = await supabase.from("categories").select("id, name, slug").order("name", { ascending: true })

  if (minimal.error) {
    return { rows: [], error: minimal.error.message }
  }

  const rows = (minimal.data ?? []).map((c) => ({
    id: String((c as { id: string }).id),
    name: String((c as { name?: string }).name ?? ""),
    slug: String((c as { slug?: string }).slug ?? ""),
    section: "food",
    display_order: 0,
    icon_emoji: null as string | null,
    name_ar: null as string | null,
  }))
  return { rows, error: null as string | null }
}

async function loadMenuProducts(supabase: Awaited<ReturnType<typeof createClient>>) {
  const first = await supabase.from("products").select(PRODUCTS_SELECT_FULL).order("name")
  if (!first.error) {
    return { rows: (first.data ?? []) as unknown as ProductRow[], error: null as string | null }
  }
  if (!isMissingColumnError(first.error.message)) {
    return { rows: [] as ProductRow[], error: first.error.message }
  }

  const noIsNew = await supabase.from("products").select(PRODUCTS_SELECT_NO_IS_NEW).order("name")
  if (!noIsNew.error) {
    return { rows: (noIsNew.data ?? []) as unknown as ProductRow[], error: null as string | null }
  }
  if (!isMissingColumnError(noIsNew.error.message)) {
    return { rows: [] as ProductRow[], error: noIsNew.error.message }
  }

  const noNameAr = await supabase.from("products").select(PRODUCTS_SELECT_NO_NAME_AR).order("name")
  if (!noNameAr.error) {
    const rows = (noNameAr.data ?? []).map((raw) => {
      const r = raw as Record<string, unknown>
      return { ...r, name_ar: null } as unknown as ProductRow
    })
    return { rows, error: null as string | null }
  }
  if (!isMissingColumnError(noNameAr.error.message)) {
    return { rows: [] as ProductRow[], error: noNameAr.error.message }
  }

  const minimal = await supabase.from("products").select(PRODUCTS_SELECT_NO_NAME_AR_NO_IS_NEW).order("name")
  if (minimal.error) {
    return { rows: [] as ProductRow[], error: minimal.error.message }
  }
  const rows = (minimal.data ?? []).map((raw) => {
    const r = raw as Record<string, unknown>
    return { ...r, name_ar: null, is_new: false } as unknown as ProductRow
  })
  return { rows, error: null as string | null }
}

function enrich(p: ProductRow, sectionByCategoryId: Map<string, string>) {
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
  return {
    id: p.id,
    name: p.name,
    name_ar: p.name_ar ?? null,
    description:
      p.description && String(p.description).trim()
        ? String(p.description)
        : `Découvrez notre ${p.name} — préparé sur place avec des ingrédients sélectionnés.`,
    category: p.categories?.slug ?? "other",
    categoryName: p.categories?.name ?? "",
    section: secFromMap ?? p.categories?.section ?? "food",
    price: Number(p.price) || 0,
    image_url: p.image_url ?? null,
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
    filtered = filtered.filter((p) => p.is_popular)
  }
  if (parseBool(sp.get("new"))) {
    filtered = filtered.filter((p) => p.is_new)
  }
  if (parseBool(sp.get("vegetarian"))) {
    filtered = filtered.filter(
      (p) => p.is_vegetarian || p.tags.some((t) => t.toLowerCase().includes("veget")),
    )
  }
  if (parseBool(sp.get("spicy"))) {
    filtered = filtered.filter((p) => {
      const sl = (p.spice_level ?? "").toLowerCase()
      const tagSp = p.tags.some((t) => /spicy|épic|epic/i.test(t))
      return tagSp || (sl !== "" && sl !== "doux")
    })
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
  const sorts: MenuSortId[] = ["name", "price_asc", "price_desc", "popular", "new"]
  if (sortRaw && sorts.includes(sortRaw)) {
    filtered = sortMenuProducts(filtered as DigitalMenuProduct[], sortRaw) as EnrichedProduct[]
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

    const { rows: categoryRowsNormalized, error: catErr } = await loadMenuCategories(supabase)
    if (catErr) {
      return NextResponse.json({ error: catErr }, { status: 500 })
    }

    const sectionByCategoryId = new Map<string, string>()
    for (const c of categoryRowsNormalized) {
      sectionByCategoryId.set(c.id, c.section ?? "food")
    }

    const [{ rows: productRows, error: productsErr }, { data: oi }, { data: availRows }] =
      await Promise.all([
        loadMenuProducts(supabase),
        supabase
          .from("order_items")
          .select("order_id, product_id, quantity")
          .not("product_id", "is", null)
          .limit(12000),
        supabase
          .from("station_availability")
          .select("station, status, reason, estimated_wait_minutes, closes_at, updated_at"),
      ])

    if (productsErr) {
      return NextResponse.json({ error: productsErr }, { status: 500 })
    }

    // Construit la map availability (toujours toutes les 3 stations).
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

    const rows = productRows
    const enrichedRows = rows.map((r) => {
      const base = enrich(r, sectionByCategoryId)
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
        // Si station fermée → indisponible / non commandable
        availability: hide ? ("out" as const) : base.availability,
        can_order: hide ? false : base.can_order && accepting,
      }
    })
    const localized = locale === "fr" ? enrichedRows : await localizeProducts(enrichedRows, locale)

    const sold = new Map<string, number>()
    for (const r of oi ?? []) {
      const row = r as { product_id?: string | null; quantity?: number | string | null }
      const pid = row.product_id
      if (!pid) continue
      const qn = Number(row.quantity) || 0
      sold.set(pid, (sold.get(pid) ?? 0) + qn)
    }

    const withStats = mergeOrderStats(localized, sold)
    const often_ordered_with = buildOftenOrderedWith(
      (oi ?? []) as { order_id: string | null; product_id: string | null }[],
      6,
    )

    const baseList = includeUnavailable ? withStats : withStats.filter((p) => p.can_order)

    let items: EnrichedProduct[]
    if (serverFiltering) {
      items = applyServerParams(withStats, searchParams)
      if (!includeUnavailable && !parseBool(searchParams.get("available"))) {
        items = items.filter((p) => p.can_order)
      }
    } else {
      items = baseList
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

    return NextResponse.json({
      source: "supabase",
      items,
      categories: categoryRowsNormalized,
      by_section: bySection,
      often_ordered_with,
      most_ordered_ids: mostOrderedIds,
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
    })
  } catch (e) {
    console.error("[menu]", e)
    return NextResponse.json({ error: "Erreur menu" }, { status: 500 })
  }
}
