import type { StockAvailability } from "@/lib/menu/availability"
import type { Station } from "@/lib/stations/config"

export type ProductModifier = {
  id: string
  slug: string
  name: string
  name_ar: string | null
  price: number
}

export type ProductVariant = {
  id: string
  slug: string
  name: string
  name_ar: string | null
  price: number
}

/** Produit enrichi renvoyé par GET /api/menu (utilisable côté client). */
export type DigitalMenuProduct = {
  id: string
  name: string
  name_ar: string | null
  description: string
  description_ar: string | null
  category: string
  categoryName: string
  category_display_order: number
  display_order: number
  section: string
  price: number
  image_url: string | null
  station: string
  /** Populaire : flag admin OU assez de commandes historiques */
  is_popular: boolean
  is_new: boolean
  is_vegetarian: boolean
  spice_level: string | null
  is_chef_choice?: boolean
  is_recommended?: boolean
  tags: string[]
  availability: StockAvailability
  max_orderable: number
  limited_reason?: string
  can_order: boolean
  order_count: number
  created_at: string | null
  station_status?: string
  station_accepting_orders?: boolean
  station_hidden?: boolean
  /** Extras configurables (Waffle / Crêpe / Pancake Nature) */
  modifiers: ProductModifier[]
  /** Variantes de taille (Klein/Groß, 0.25L/0.75L, Glas/Kanne) */
  variants: ProductVariant[]
  is_customizable: boolean
  has_variants: boolean
  slug?: string
}

export type MenuSectionId = "all" | "food" | "desserts" | "drinks" | "special"

export type MenuSortId = "recommended" | "name" | "price_asc" | "price_desc" | "popular" | "new"

export type MenuClientFilters = {
  search: string
  section: MenuSectionId
  /** "all" ou slug catégorie */
  categorySlug: string
  priceMin: number | null
  priceMax: number | null
  availableOnly: boolean
  popularOnly: boolean
  newOnly: boolean
  spicyOnly: boolean
  vegetarianOnly: boolean
  /** "all" ou station */
  station: "all" | Station
}

/** Preserve stable product references during silent menu polling. */
export function mergeDigitalMenuProducts(
  prev: DigitalMenuProduct[],
  next: DigitalMenuProduct[],
): DigitalMenuProduct[] {
  if (!prev.length) return next
  const byId = new Map(prev.map((p) => [p.id, p]))
  return next.map((item) => {
    const old = byId.get(item.id)
    if (!old) return item
    if (
      old.name === item.name &&
      old.name_ar === item.name_ar &&
      old.description === item.description &&
      old.description_ar === item.description_ar &&
      old.price === item.price &&
      old.image_url === item.image_url &&
      old.can_order === item.can_order &&
      old.availability === item.availability &&
      old.max_orderable === item.max_orderable &&
      JSON.stringify(old.tags) === JSON.stringify(item.tags) &&
      JSON.stringify(old.modifiers) === JSON.stringify(item.modifiers) &&
      JSON.stringify(old.variants) === JSON.stringify(item.variants)
    ) {
      return old
    }
    return item
  })
}
