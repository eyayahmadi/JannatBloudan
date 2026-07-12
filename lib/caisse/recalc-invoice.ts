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
