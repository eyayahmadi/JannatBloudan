import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
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
    price: typeof p.price === "number" ? p.price : parseFloat(String(p.price)) || 0,
    image: (p.image_url as string) || "/placeholder.svg",
    category: String(p.category ?? "other"),
    section: String(p.section ?? "food"),
    station: String(p.station ?? "KITCHEN"),
    displayOrder: Number(p.display_order) || 0,
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
