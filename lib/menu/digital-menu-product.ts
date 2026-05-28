import type { StockAvailability } from "@/lib/menu/availability"
import type { Station } from "@/lib/stations/config"

/** Produit enrichi renvoyé par GET /api/menu (utilisable côté client). */
export type DigitalMenuProduct = {
  id: string
  name: string
  name_ar: string | null
  description: string
  category: string
  categoryName: string
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
}

export type MenuSectionId = "all" | "food" | "desserts" | "drinks" | "special"

export type MenuSortId = "name" | "price_asc" | "price_desc" | "popular" | "new"

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
