/**
 * Canonical menu card order: category display_order → product display_order → id.
 * Single source of truth for ordering across customer menu, QR, staff, POS, admin, and APIs.
 */
export type MenuCardOrderFields = {
  category_display_order?: number | null
  categoryDisplayOrder?: number | null
  display_order?: number | null
  displayOrder?: number | null
  id?: string | null
}

function categoryOrder(item: MenuCardOrderFields): number {
  return item.category_display_order ?? item.categoryDisplayOrder ?? 0
}

function productOrder(item: MenuCardOrderFields): number {
  return item.display_order ?? item.displayOrder ?? 0
}

/** Compare two menu items by card order (stable tie-breaker on id). */
export function compareMenuCardOrder(a: MenuCardOrderFields, b: MenuCardOrderFields): number {
  const cat = categoryOrder(a) - categoryOrder(b)
  if (cat !== 0) return cat
  const prod = productOrder(a) - productOrder(b)
  if (prod !== 0) return prod
  return String(a.id ?? "").localeCompare(String(b.id ?? ""))
}

/** Return a new array sorted by menu card order. */
export function sortByMenuCardOrder<T>(items: readonly T[]): T[] {
  return [...items].sort((a, b) =>
    compareMenuCardOrder(a as MenuCardOrderFields, b as MenuCardOrderFields),
  )
}
