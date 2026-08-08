import type { ProductVariant } from "@/lib/menu/digital-menu-product"
import { attributeSearchHaystack } from "@/lib/menu/product-attributes"
import { SHISHA_CATEGORY_ICON } from "@/lib/menu/category-display-icon"

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

/** Normalize query/name for case-insensitive, spacing-tolerant name search. */
function normalizeProductNameSearchText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLocaleLowerCase()
}

/** QR search: German + Arabic product names only (no description, tags, etc.). */
export function matchesProductNameSearch(
  item: { name: string; name_ar?: string | null },
  query: string,
): boolean {
  const q = normalizeProductNameSearchText(query)
  if (!q) return false

  const nameDe = normalizeProductNameSearchText(item.name)
  const nameAr = normalizeProductNameSearchText(item.name_ar ?? "")

  return nameDe.includes(q) || (nameAr.length > 0 && nameAr.includes(q))
}

export function matchesMenuSearch(
  item: { name: string; name_ar?: string | null; description?: string; description_ar?: string | null; tags?: string[] },
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = [item.name, item.name_ar ?? "", item.description ?? "", item.description_ar ?? "", ...(item.tags ?? []), attributeSearchHaystack(item.tags)]
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
  if (category === "shisha" || category === "imperator") return SHISHA_CATEGORY_ICON
  if (section === "desserts") return "🍰"
  if (section === "drinks") return "🥤"
  if (category === "salades" || category === "entrees") return "🥗"
  return "🍽️"
}

export function isPlaceholderImage(url: string | null | undefined): boolean {
  if (!url) return true
  return url.includes("placeholder")
}
