import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { logMenuTelemetry } from "@/lib/menu/menu-telemetry"

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
    const missing: string[] = []
    const fromApi = apiIds
      .map((id) => {
        const hit = catalog.find((p) => p.id === id)
        if (!hit) missing.push(id)
        return hit
      })
      .filter((p): p is QrMenuItem => !!p)
    if (missing.length > 0) {
      logMenuTelemetry("recommendation_lookup_failed", {
        productId: product.id,
        productSlug: product.slug,
        missingIds: missing,
      })
    }
    if (push(fromApi)) return out
  }

  const sameCat = catalog.filter((p) => p.id !== product.id && p.category === product.category && p.canOrder)
  push(sameCat.slice(0, limit - out.length))

  return out.slice(0, limit)
}
