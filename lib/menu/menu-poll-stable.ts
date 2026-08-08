import type { DigitalMenuProduct } from "@/lib/menu/digital-menu-product"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"

function qrMenuItemFingerprint(item: QrMenuItem): string {
  return [
    item.id,
    item.slug,
    item.name,
    item.name_ar ?? "",
    item.description,
    item.description_ar ?? "",
    item.price,
    item.image,
    item.category,
    item.section,
    item.displayOrder,
    item.categoryDisplayOrder,
    item.canOrder,
    item.soldOut,
    item.unavailableLabel ?? "",
    JSON.stringify(item.tags),
    JSON.stringify(item.modifiers),
    JSON.stringify(item.variants),
  ].join("\u001f")
}

function digitalMenuItemFingerprint(item: DigitalMenuProduct): string {
  return [
    item.id,
    item.slug ?? "",
    item.name,
    item.name_ar ?? "",
    item.description,
    item.description_ar ?? "",
    item.price,
    item.image_url ?? "",
    item.category,
    item.categoryName,
    item.section,
    item.display_order,
    item.category_display_order,
    item.can_order,
    item.availability,
    item.max_orderable,
    JSON.stringify(item.tags),
    JSON.stringify(item.modifiers),
    JSON.stringify(item.variants),
  ].join("\u001f")
}

type CategorySlice = {
  id: string
  slug: string
  name: string
  display_order?: number
  icon_emoji?: string | null
}

function categoryFingerprint(cat: CategorySlice): string {
  return [cat.id, cat.slug, cat.name, cat.display_order ?? 0, cat.icon_emoji ?? ""].join("\u001f")
}

/** True when silent poll can skip setState — compares live data, not object identity. */
export function isStableQrMenuPayload(
  prevItems: QrMenuItem[],
  nextItems: QrMenuItem[],
  prevCats: CategorySlice[],
  nextCats: CategorySlice[],
): boolean {
  if (nextItems.length !== prevItems.length) return false
  for (let i = 0; i < nextItems.length; i++) {
    if (qrMenuItemFingerprint(nextItems[i]) !== qrMenuItemFingerprint(prevItems[i])) return false
  }
  if (nextCats.length !== prevCats.length) return false
  for (let i = 0; i < nextCats.length; i++) {
    if (categoryFingerprint(nextCats[i]) !== categoryFingerprint(prevCats[i] ?? nextCats[i])) return false
  }
  return true
}

type MenuPayloadSlice = {
  catalog: DigitalMenuProduct[]
  categories: CategorySlice[]
}

/** True when silent poll can skip setState — compares live data, not object identity. */
export function isStableDigitalMenuPayload(
  prev: MenuPayloadSlice,
  catalog: DigitalMenuProduct[],
  categories: CategorySlice[],
): boolean {
  if (catalog.length !== prev.catalog.length) return false
  for (let i = 0; i < catalog.length; i++) {
    if (digitalMenuItemFingerprint(catalog[i]) !== digitalMenuItemFingerprint(prev.catalog[i])) return false
  }
  if (categories.length !== prev.categories.length) return false
  for (let i = 0; i < categories.length; i++) {
    if (categoryFingerprint(categories[i]) !== categoryFingerprint(prev.categories[i] ?? categories[i])) {
      return false
    }
  }
  return true
}
