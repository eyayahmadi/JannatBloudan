/** Recalcul TTC après changement lignes — prix menu déjà TTC (tax-inclusive). */

import {
  calculateInvoiceTotalsFromGrossTtc,
  roundMoney,
} from "@/lib/tax/calculate-tax"

export type InvoiceItemRow = {
  subtotal?: unknown
  line_status?: string | null
}

export function round2(n: number) {
  return roundMoney(n)
}

/** Statuts de ligne facture exclus du montant facturable. */
export const NON_BILLABLE_LINE_STATUSES = new Set([
  "cancelled",
  "waste",
  "refused",
  "replaced",
])

/** Somme des lignes actives — montants TTC (prix menu × quantité). */
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

/**
 * Recalcule HT / TVA / TTC à partir du total lignes TTC et d'une remise TTC.
 * @param grossTtc — somme des lignes actives (prix menu TTC)
 * @param discountTtc — remise en euros TTC
 * @param vatRate — 0.19 ou 19
 */
export function recomputeTotalsFromSubtotal(
  grossTtc: number,
  discountTtc: number,
  vatRate: number,
) {
  return calculateInvoiceTotalsFromGrossTtc(grossTtc, discountTtc, vatRate)
}

const TOTALS_EPS = 0.02

export type InvoiceTotalsFields = {
  subtotal?: unknown
  tva_amount?: unknown
  total?: unknown
  discount_amount?: unknown
  gross_before_discount?: unknown
}

/** Recalcule HT / TVA / TTC à partir des lignes facture (montants menu TTC). */
export function deriveInvoiceTotalsFromItems(
  items: InvoiceItemRow[],
  discountTtc: number,
  vatRate: number,
) {
  const grossTtc = sumActiveSubtotal(items)
  return recomputeTotalsFromSubtotal(grossTtc, discountTtc, vatRate)
}

/** True si les totaux stockés ne correspondent plus aux lignes (ex. ancienne formule HT×1.19). */
export function invoiceTotalsNeedRefresh(
  inv: InvoiceTotalsFields,
  items: InvoiceItemRow[],
  vatRate: number,
): boolean {
  const disc = Number(inv.discount_amount ?? 0)
  const expected = deriveInvoiceTotalsFromItems(items, disc, vatRate)
  return (
    Math.abs(Number(inv.total ?? 0) - expected.total) > TOTALS_EPS ||
    Math.abs(Number(inv.subtotal ?? 0) - expected.subtotalHt) > TOTALS_EPS ||
    Math.abs(Number(inv.tva_amount ?? 0) - expected.tva_amount) > TOTALS_EPS ||
    Math.abs(Number(inv.gross_before_discount ?? 0) - expected.grossTtc) > TOTALS_EPS
  )
}
