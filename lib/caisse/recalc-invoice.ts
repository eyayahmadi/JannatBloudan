/** Recalcul TTC après changement lignes — hors business rules métier élaborées TVA fractionnée */

export type InvoiceItemRow = {
  subtotal?: unknown
  line_status?: string | null
}

export function round2(n: number) {
  return Math.round(n * 100) / 100
}

/** Statuts de ligne facture exclus du montant facturable. */
export const NON_BILLABLE_LINE_STATUSES = new Set([
  "cancelled",
  "waste",
  "refused",
  "replaced",
])

/** Somme des sous-taxes lignes encore actives (facturables) */
export function sumActiveSubtotal(items: InvoiceItemRow[]) {
  let s = 0
  for (const row of items) {
    const st = String(row.line_status ?? "").toLowerCase()
    if (NON_BILLABLE_LINE_STATUSES.has(st)) continue
    const sub = Number((row as { subtotal?: unknown }).subtotal ?? 0)
    if (Number.isFinite(sub)) s += sub
  }
  return round2(s)
}

export function recomputeTotalsFromSubtotal(activeSubtotal: number, discountAmount: number, tvaRate: number) {
  const disc = Number.isFinite(discountAmount) ? discountAmount : 0
  const baseHt = Math.max(0, activeSubtotal - disc)
  const tva = round2(baseHt * tvaRate)
  const total = round2(baseHt + tva)
  return { subtotalHt: round2(activeSubtotal), discount_amount: round2(disc), tva_amount: tva, total }
}
