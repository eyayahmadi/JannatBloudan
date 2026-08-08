import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { isPlaceholderImage } from "@/lib/menu/menu-display"
import { normalizeProductTags, productHasAnyTag, productHasTag } from "@/lib/menu/product-attributes"
import { stationBadgeForProduct } from "@/lib/menu/station-order-block"
import type { StockAvailability } from "@/lib/menu/availability"
import type { StationAvailability } from "@/lib/stations/availability"

export function mapApiToQrMenuItem(
  p: Record<string, unknown>,
  stationAvailability: StationAvailability[] = [],
): QrMenuItem {
  const tags = normalizeProductTags(p.tags)
  const canOrder = p.can_order !== false
  const availabilityRaw = String(p.availability ?? "")
  const availability: StockAvailability =
    availabilityRaw === "out" ? "out" : availabilityRaw === "low" ? "limited" : "available"
  const stationAccepting = p.station_accepting_orders !== false
  const soldOut = !canOrder && availability === "out" && stationAccepting

  const badge = stationBadgeForProduct(
    {
      id: String(p.id),
      name: String(p.name ?? ""),
      name_ar: null,
      description: "",
      description_ar: null,
      category: "",
      categoryName: "",
      category_display_order: 0,
      display_order: 0,
      section: "",
      price: typeof p.price === "number" ? p.price : 0,
      image_url: null,
      station: String(p.station ?? "KITCHEN"),
      is_popular: false,
      is_new: false,
      is_vegetarian: false,
      spice_level: null,
      tags: [],
      availability,
      max_orderable: 0,
      can_order: canOrder,
      order_count: 0,
      created_at: null,
      modifiers: [],
      variants: [],
      is_customizable: false,
      has_variants: false,
    },
    stationAvailability,
  )

  return {
    id: String(p.id),
    slug: String(p.slug ?? ""),
    name: String(p.name ?? ""),
    name_ar: p.name_ar != null ? String(p.name_ar) : null,
    description: String(p.description ?? ""),
    description_ar:
      p.description_ar != null && String(p.description_ar).trim()
        ? String(p.description_ar)
        : null,
    price: typeof p.price === "number" ? p.price : parseFloat(String(p.price)) || 0,
    image: (p.image_url as string) || "/placeholder.svg",
    category: String(p.category ?? "other"),
    section: String(p.section ?? "food"),
    station: String(p.station ?? "KITCHEN"),
    displayOrder: Number(p.display_order) || 0,
    categoryDisplayOrder: Number(p.category_display_order) || 0,
    tags,
    isPopular: productHasAnyTag(tags, ["popular", "best_seller"]),
    isNew: productHasTag(tags, "new"),
    isVegetarian: productHasTag(tags, "vegetarian") || productHasTag(tags, "vegan"),
    spiceLevel: productHasTag(tags, "spicy") ? "épicé" : productHasTag(tags, "not_spicy") ? "doux" : null,
    orderCount: typeof p.order_count === "number" ? p.order_count : 0,
    canOrder,
    soldOut,
    stationStatus: String(p.station_status ?? "OPEN"),
    stationAcceptingOrders: stationAccepting,
    unavailableLabel: !canOrder ? badge?.label ?? (soldOut ? "Ausverkauft" : null) : null,
    isCustomizable: !!p.is_customizable,
    hasVariants: !!p.has_variants,
    modifiers: Array.isArray(p.modifiers) ? (p.modifiers as QrMenuItem["modifiers"]) : [],
    variants: Array.isArray(p.variants) ? (p.variants as QrMenuItem["variants"]) : [],
  }
}

function preferCanonicalMenuItem(next: QrMenuItem, prev: QrMenuItem): boolean {
  const nextPlaceholder = isPlaceholderImage(next.image)
  const prevPlaceholder = isPlaceholderImage(prev.image)
  if (prevPlaceholder && !nextPlaceholder) return true
  if (!prevPlaceholder && nextPlaceholder) return false
  return false
}

/** Map featured picks to the same catalog rows used on category pages (id, then slug). */
export function canonicalizeMenuItemsForDisplay(
  picks: QrMenuItem[],
  catalog: QrMenuItem[],
): QrMenuItem[] {
  if (picks.length === 0 || catalog.length === 0) return picks

  const byId = new Map(catalog.map((item) => [item.id, item]))
  const bySlug = new Map<string, QrMenuItem>()
  for (const item of catalog) {
    if (!item.slug) continue
    const prev = bySlug.get(item.slug)
    if (!prev || preferCanonicalMenuItem(item, prev)) {
      bySlug.set(item.slug, item)
    }
  }

  return picks.map((pick) => {
    const byExactId = byId.get(pick.id)
    if (byExactId) return byExactId
    if (pick.slug) {
      const byExactSlug = bySlug.get(pick.slug)
      if (byExactSlug) return byExactSlug
    }
    return pick
  })
}

/** Preserve stable item references when polling refreshes unchanged products. */
export function mergeQrMenuItems(prev: QrMenuItem[], next: QrMenuItem[]): QrMenuItem[] {
  if (prev.length === 0) return next
  const byId = new Map(prev.map((item) => [item.id, item]))
  return next.map((item) => {
    const old = byId.get(item.id)
    if (!old) return item
    if (
      old.name === item.name &&
      old.name_ar === item.name_ar &&
      old.description === item.description &&
      old.description_ar === item.description_ar &&
      old.price === item.price &&
      old.image === item.image &&
      old.canOrder === item.canOrder &&
      old.soldOut === item.soldOut &&
      old.unavailableLabel === item.unavailableLabel &&
      old.displayOrder === item.displayOrder &&
      old.categoryDisplayOrder === item.categoryDisplayOrder &&
      JSON.stringify(old.tags) === JSON.stringify(item.tags)
    ) {
      return old
    }
    return item
  })
}

export function isQrItemSpicy(item: QrMenuItem): boolean {
  return productHasTag(item.tags, "spicy")
}

export function isQrItemVegetarian(item: QrMenuItem): boolean {
  return productHasTag(item.tags, "vegetarian") || productHasTag(item.tags, "vegan")
}

export function isQrItemVegan(item: QrMenuItem): boolean {
  return productHasTag(item.tags, "vegan")
}

/** Note affichée (optionnelle) pour les plats populaires. */
export function qrDisplayRating(item: QrMenuItem): number | null {
  if (!item.isPopular && item.orderCount < 5) return null
  const base = 4.4 + Math.min(0.5, item.orderCount / 40)
  return Math.round(base * 10) / 10
}
