import type { SupabaseClient } from "@supabase/supabase-js"
import { productHasTag } from "@/lib/menu/product-attributes"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"

/** Configurable homepage promo sections — add keys here to extend without route changes. */
export const MENU_HOMEPAGE_SECTION_DEFS = [
  {
    key: "bestseller",
    labelDe: "Bestseller",
    labelAr: "الأكثر مبيعاً",
    icon: "⭐",
  },
  {
    key: "today_recommended",
    labelDe: "Heute empfohlen",
    labelAr: "موصى به اليوم",
    icon: "🔥",
  },
] as const

export type MenuHomepageSectionKey = (typeof MENU_HOMEPAGE_SECTION_DEFS)[number]["key"]

export type MenuHomepageSectionRow = {
  id: string
  section_key: string
  product_id: string
  display_order: number
  is_active: boolean
}

export type MenuHomepageSectionsMap = Record<string, string[]>

export function emptyHomepageSectionsMap(): MenuHomepageSectionsMap {
  const map: MenuHomepageSectionsMap = {}
  for (const def of MENU_HOMEPAGE_SECTION_DEFS) {
    map[def.key] = []
  }
  return map
}

export async function fetchMenuHomepageSections(
  supabase: SupabaseClient,
): Promise<MenuHomepageSectionsMap> {
  const map = emptyHomepageSectionsMap()
  const { data, error } = await supabase
    .from("menu_homepage_sections")
    .select("section_key, product_id, display_order")
    .eq("is_active", true)
    .order("display_order")

  if (error) {
    if (error.code === "42P01" || error.message?.includes("menu_homepage_sections")) {
      return map
    }
    throw error
  }

  for (const row of data ?? []) {
    const key = String(row.section_key)
    const productId = String(row.product_id)
    if (!map[key]) map[key] = []
    map[key].push(productId)
  }

  return map
}

function pickByTags(sectionKey: string, items: QrMenuItem[], limit: number): QrMenuItem[] {
  const available = items.filter((i) => !i.soldOut && i.canOrder)

  if (sectionKey === "bestseller") {
    return available
      .filter(
        (i) =>
          productHasTag(i.tags, "best_seller") ||
          productHasTag(i.tags, "popular") ||
          productHasTag(i.tags, "featured"),
      )
      .slice(0, limit)
  }

  if (sectionKey === "today_recommended") {
    return available
      .filter(
        (i) =>
          productHasTag(i.tags, "today_recommended") ||
          productHasTag(i.tags, "chef_recommendation") ||
          productHasTag(i.tags, "featured") ||
          productHasTag(i.tags, "promotion"),
      )
      .slice(0, limit)
  }

  return []
}

/** Resolve homepage products: CMS selection first, tag fallback when empty. */
export function resolveHomepageSectionProducts(
  sectionKey: MenuHomepageSectionKey,
  items: QrMenuItem[],
  homepageSections: MenuHomepageSectionsMap,
  limit = 8,
): QrMenuItem[] {
  const selectedIds = homepageSections[sectionKey] ?? []
  if (selectedIds.length > 0) {
    const byId = new Map(items.map((i) => [i.id, i]))
    return selectedIds
      .map((id) => byId.get(id))
      .filter((i): i is QrMenuItem => !!i && !i.soldOut && i.canOrder)
      .slice(0, limit)
  }
  return pickByTags(sectionKey, items, limit)
}

export function sectionDefByKey(key: string) {
  return MENU_HOMEPAGE_SECTION_DEFS.find((d) => d.key === key)
}
