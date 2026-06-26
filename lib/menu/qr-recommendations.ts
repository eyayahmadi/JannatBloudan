import type { QrMenuItem } from "@/lib/menu/qr-menu-types"

/**
 * Recommandations depuis la base (admin) + co-occurrence API.
 * Plus de règles hardcodées.
 */
export function getQrRecommendations(
  product: QrMenuItem,
  catalog: QrMenuItem[],
  oftenOrderedWith: Record<string, string[]>,
  limit = 4,
): QrMenuItem[] {
  const seen = new Set<string>([product.id])
  const out: QrMenuItem[] = []

  const push = (items: QrMenuItem[]) => {
    for (const p of items) {
      if (seen.has(p.id) || !p.canOrder) continue
      seen.add(p.id)
      out.push(p)
      if (out.length >= limit) return true
    }
    return out.length >= limit
  }

  const apiIds = oftenOrderedWith[product.id] ?? []
  if (apiIds.length > 0) {
    const fromApi = apiIds
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is QrMenuItem => !!p)
    if (push(fromApi)) return out
  }

  const sameCat = catalog.filter((p) => p.id !== product.id && p.category === product.category && p.canOrder)
  push(sameCat.slice(0, limit - out.length))

  return out.slice(0, limit)
}
