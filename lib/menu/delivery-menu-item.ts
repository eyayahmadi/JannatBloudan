import { normalizeProductTags, productHasAnyTag, productHasTag } from "@/lib/menu/product-attributes"
import { resolveCategoryDisplayIcon } from "@/lib/menu/category-display-icon"

export type DeliveryMenuItem = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  categoryDisplayOrder: number
  displayOrder: number
  rating: number
  reviews: number
  prepTime: string
  isPopular: boolean
  isNew: boolean
  allergens: string[]
  isFeatured: boolean
  isAvailable: boolean
  spiceLevel: string
}

export function mapApiToDeliveryMenuItem(p: Record<string, unknown>): DeliveryMenuItem {
  const tags = normalizeProductTags(p.tags)
  const orderCount = typeof p.order_count === "number" ? p.order_count : 0
  return {
    id: String(p.id),
    name: String(p.name ?? ""),
    description: String(p.description ?? ""),
    price: typeof p.price === "number" ? p.price : parseFloat(String(p.price)) || 0,
    image: String(p.image_url || "/placeholder.svg"),
    category: String(p.category ?? "other"),
    categoryDisplayOrder: Number(p.category_display_order) || 0,
    displayOrder: Number(p.display_order) || 0,
    rating: Math.round((4.4 + Math.min(0.5, orderCount / 40)) * 10) / 10,
    reviews: orderCount,
    prepTime: "15-20 min",
    isPopular: Boolean(p.is_popular) || productHasAnyTag(tags, ["popular", "best_seller"]),
    isNew: productHasTag(tags, "new"),
    allergens: [],
    isFeatured: Boolean(p.is_popular) || productHasTag(tags, "chef_recommendation"),
    isAvailable: p.can_order !== false,
    spiceLevel: productHasTag(tags, "spicy") ? "medium" : "mild",
  }
}

export const DELIVERY_CATEGORY_CHIPS = [
  { id: "all", name: "Tout", icon: "🍽️" },
  { id: "popular", name: "Populaire", icon: "🔥" },
] as const

export function buildDeliveryCategories(
  apiCategories: Array<{ name: string; slug: string; icon_emoji?: string | null }>,
) {
  const fromApi = apiCategories.map((c) => ({
    id: c.slug,
    name: c.name,
    icon: resolveCategoryDisplayIcon(c.slug, c.icon_emoji),
  }))
  return [...DELIVERY_CATEGORY_CHIPS, ...fromApi]
}
