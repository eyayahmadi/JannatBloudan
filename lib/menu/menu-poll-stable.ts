import type { DigitalMenuProduct } from "@/lib/menu/digital-menu-product"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"

/** True when silent poll can skip setState — any phone, any browser. */
export function isStableQrMenuPayload(
  prevItems: QrMenuItem[],
  nextItems: QrMenuItem[],
  prevCats: { id: string; slug: string; name: string }[],
  nextCats: { id: string; slug: string; name: string }[],
): boolean {
  if (nextItems.length !== prevItems.length) return false
  for (let i = 0; i < nextItems.length; i++) {
    if (nextItems[i] !== prevItems[i]) return false
  }
  if (nextCats.length !== prevCats.length) return false
  for (let i = 0; i < nextCats.length; i++) {
    const a = nextCats[i]
    const b = prevCats[i]
    if (!b || a.id !== b.id || a.slug !== b.slug || a.name !== b.name) return false
  }
  return true
}

type MenuPayloadSlice = {
  catalog: DigitalMenuProduct[]
  categories: { id: string; slug: string; name: string; display_order?: number }[]
}

/** True when silent poll can skip setState — avoids layout shift on every phone. */
export function isStableDigitalMenuPayload(
  prev: MenuPayloadSlice,
  catalog: DigitalMenuProduct[],
  categories: MenuPayloadSlice["categories"],
): boolean {
  if (catalog.length !== prev.catalog.length) return false
  for (let i = 0; i < catalog.length; i++) {
    if (catalog[i] !== prev.catalog[i]) return false
  }
  if (categories.length !== prev.categories.length) return false
  for (let i = 0; i < categories.length; i++) {
    const a = categories[i]
    const b = prev.categories[i]
    if (!b || a.id !== b.id || a.slug !== b.slug || a.name !== b.name) return false
  }
  return true
}
