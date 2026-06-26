import type { ProductVariant } from "@/lib/menu/digital-menu-product"
import { attributeSearchHaystack } from "@/lib/menu/product-attributes"

export type MenuPriceDisplayInput = {
  price: number
  hasVariants?: boolean
  variants?: Pick<ProductVariant, "price">[]
  isCustomizable?: boolean
  /** Suffix currency symbol (default €) */
  currency?: string
}

/** Affichage prix carte : « ab 6,00 € » pour variantes, « 6,00 €+ » pour extras. */
export function formatMenuPriceLabel({
  price,
  hasVariants,
  variants,
  isCustomizable,
  currency = "€",
}: MenuPriceDisplayInput): string {
  const list = variants ?? []
  const min = list.length > 0 ? Math.min(...list.map((v) => v.price)) : price
  const max = list.length > 0 ? Math.max(...list.map((v) => v.price)) : price

  if (hasVariants && list.length > 1 && min !== max) {
    return `ab ${min.toFixed(2)}${currency}`
  }
  if (hasVariants && list.length > 0) {
    return `${min.toFixed(2)}${currency}`
  }
  if (isCustomizable) {
    return `${price.toFixed(2)}${currency}+`
  }
  return `${price.toFixed(2)}${currency}`
}

export function matchesMenuSearch(
  item: { name: string; name_ar?: string | null; description?: string; tags?: string[] },
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = [item.name, item.name_ar ?? "", item.description ?? "", ...(item.tags ?? []), attributeSearchHaystack(item.tags)]
    .join(" ")
    .toLowerCase()
  return hay.includes(q)
}

/** Emoji de repli quand pas d'image produit. */
export function categoryPlaceholderEmoji(section: string, category?: string): string {
  if (category === "shawarma") return "🌯"
  if (category === "pizza") return "🍕"
  if (category === "burgers") return "🍔"
  if (category === "grillades") return "🔥"
  if (category === "shisha" || category === "imperator") return "💨"
  if (section === "desserts") return "🍰"
  if (section === "drinks") return "🥤"
  if (category === "salades" || category === "entrees") return "🥗"
  return "🍽️"
}

export function isPlaceholderImage(url: string | null | undefined): boolean {
  if (!url) return true
  return url.includes("placeholder")
}
