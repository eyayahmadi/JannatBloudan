/**
 * Co-occurrence par commande : pour chaque produit A, liste des produits B les plus
 * souvent commandés dans la même commande.
 */
export function buildOftenOrderedWith(
  rows: Array<{ order_id: string | null; product_id: string | null }>,
  topN = 5,
): Record<string, string[]> {
  const byOrder = new Map<string, Set<string>>()
  for (const r of rows) {
    const oid = r.order_id
    const pid = r.product_id
    if (!oid || !pid) continue
    if (!byOrder.has(oid)) byOrder.set(oid, new Set())
    byOrder.get(oid)!.add(pid)
  }
  const pairCounts = new Map<string, Map<string, number>>()
  for (const set of byOrder.values()) {
    const ids = [...set]
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        if (i === j) continue
        const a = ids[i]
        const b = ids[j]
        if (!pairCounts.has(a)) pairCounts.set(a, new Map())
        const m = pairCounts.get(a)!
        m.set(b, (m.get(b) ?? 0) + 1)
      }
    }
  }
  const result: Record<string, string[]> = {}
  for (const [a, m] of pairCounts) {
    result[a] = [...m.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, topN)
      .map(([id]) => id)
  }
  return result
}
