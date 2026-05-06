import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { computeMaxServings, productTags } from "@/lib/menu/availability"
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config"
import { translateStrings } from "@/lib/server/translation-service"

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
  categories?: {
    id: string
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

function enrich(p: ProductRow) {
  const stock = Number(p.stock_quantity) || 0
  const recipe = p.product_ingredients
  const { availability, maxOrderable, limitedReason } = computeMaxServings(recipe, stock)
  const tags = productTags(p)
  const adminOff = p.is_available === false
  const canOrder = !adminOff && availability !== "out" && (maxOrderable ?? 0) >= 1
  return {
    id: p.id,
    name: p.name,
    name_ar: p.name_ar ?? null,
    description:
      p.description && String(p.description).trim()
        ? p.description
        : `Découvrez notre ${p.name} — préparé sur place avec des ingrédients sélectionnés.`,
    category: p.categories?.slug ?? "other",
    categoryName: p.categories?.name ?? "",
    section: p.categories?.section ?? "food",
    price: Number(p.price) || 0,
    image_url: p.image_url ?? null,
    station: p.station ?? "KITCHEN",
    is_popular: !!p.is_popular,
    is_chef_choice: !!p.is_chef_choice,
    is_recommended: !!p.is_recommended,
    tags,
    availability: adminOff ? "out" : availability,
    max_orderable: maxOrderable,
    limited_reason: limitedReason,
    can_order: canOrder,
  }
}

type EnrichedProduct = ReturnType<typeof enrich>

async function localizeProducts(
  items: EnrichedProduct[],
  locale: Locale,
): Promise<EnrichedProduct[]> {
  if (locale === "fr") return items
  const texts: string[] = []
  for (const it of items) {
    texts.push(it.name)
    texts.push(it.description)
    texts.push(it.categoryName)
  }
  const translated = await translateStrings(texts, locale, "fr")
  return items.map((it, idx) => {
    const base = idx * 3
    return {
      ...it,
      name: translated[base] ?? it.name,
      description: translated[base + 1] ?? it.description,
      categoryName: translated[base + 2] ?? it.categoryName,
    }
  })
}

export async function GET(request: NextRequest) {
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ menu: null, source: "mock", message: "Supabase requis" })
  }

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") ?? "").toLowerCase().trim()
  const section = searchParams.get("section")
  const popular = searchParams.get("popular") === "1"
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const includeUnavailable = searchParams.get("include_unavailable") === "1"

  const rawLocale = searchParams.get("locale")
  const locale: Locale =
    rawLocale && isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE

  try {
    const supabase = await createClient()
    let query = supabase
      .from("products")
      .select(
        `id, name, name_ar, slug, description, price, image_url, is_available, is_popular, is_new,
         is_chef_choice, is_recommended, is_vegetarian, spice_level, stock_quantity, tags, station,
         categories ( id, name, slug, section, display_order, icon_emoji, name_ar ),
         product_ingredients ( quantity, ingredients ( id, name, unit, stock_quantity, threshold_low, threshold_critical ) )`,
      )
      .order("name")

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data ?? []) as unknown as ProductRow[]
    const enrichedRows = rows.map(enrich)
    const enriched =
      locale === "fr" ? enrichedRows : await localizeProducts(enrichedRows, locale)

    let filtered = includeUnavailable ? enriched : enriched.filter((p) => p.can_order)
    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q),
      )
    }
    if (section && section !== "all") {
      filtered = filtered.filter((p) => p.section === section)
    }
    if (popular) {
      filtered = filtered.filter((p) => p.is_popular)
    }
    if (minPrice) {
      const m = Number(minPrice)
      if (Number.isFinite(m)) filtered = filtered.filter((p) => p.price >= m)
    }
    if (maxPrice) {
      const m = Number(maxPrice)
      if (Number.isFinite(m)) filtered = filtered.filter((p) => p.price <= m)
    }

    const { data: oi } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .not("product_id", "is", null)
      .limit(5000)

    const sold = new Map<string, number>()
    for (const r of oi ?? []) {
      const pid = r.product_id as string
      if (!pid) continue
      sold.set(pid, (sold.get(pid) ?? 0) + Number((r as { quantity: number }).quantity))
    }
    const mostOrderedIds = [...sold.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    const bySection = {
      food: [] as typeof filtered,
      desserts: [] as typeof filtered,
      drinks: [] as typeof filtered,
      special: [] as typeof filtered,
    }
    for (const p of filtered) {
      const s = p.section in bySection ? (p.section as keyof typeof bySection) : "food"
      if (bySection[s]) bySection[s].push(p)
    }

    return NextResponse.json({
      source: "supabase",
      items: filtered,
      by_section: bySection,
      most_ordered_ids: mostOrderedIds,
      chef_choice: filtered.filter((p) => p.is_chef_choice),
      recommended: filtered.filter((p) => p.is_recommended),
      most_popular: filtered
        .filter((p) => p.is_popular)
        .sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0))
        .slice(0, 8),
    })
  } catch (e) {
    console.error("[menu]", e)
    return NextResponse.json({ error: "Erreur menu" }, { status: 500 })
  }
}
