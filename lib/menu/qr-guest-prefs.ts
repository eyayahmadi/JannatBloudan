const FAVORITES_KEY = "jannat-qr-favorites"
const recentKey = (tableId: string) => `jannat-qr-recent-${tableId}`

function readIds(key: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function writeIds(key: string, ids: string[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify([...new Set(ids)]))
}

export function getQrFavorites(): string[] {
  return readIds(FAVORITES_KEY)
}

export function toggleQrFavorite(productId: string): string[] {
  const cur = getQrFavorites()
  const next = cur.includes(productId) ? cur.filter((id) => id !== productId) : [...cur, productId]
  writeIds(FAVORITES_KEY, next)
  return next
}

export function isQrFavorite(productId: string): boolean {
  return getQrFavorites().includes(productId)
}

export function getQrRecentlyOrdered(tableId: string): string[] {
  return readIds(recentKey(tableId))
}

export function pushQrRecentlyOrdered(tableId: string, productIds: string[], max = 12) {
  const prev = getQrRecentlyOrdered(tableId)
  const merged = [...productIds, ...prev.filter((id) => !productIds.includes(id))].slice(0, max)
  writeIds(recentKey(tableId), merged)
}
