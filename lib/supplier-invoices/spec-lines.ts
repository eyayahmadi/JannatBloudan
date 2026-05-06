/**
 * Format « produit » attendu pour intégrations / mobiles (harmonisé IA).
 * Correspond aux champs métier arabes demandés dans le cahier des charges.
 */
import type { ExtractedInvoice, ExtractedLine } from "./types"

export type InvoiceLineProductSpec = {
  produit: string
  quantite: number
  prix: number
  total: number
}

export function extractedLineToSpec(line: ExtractedLine): InvoiceLineProductSpec {
  return {
    produit: line.name,
    quantite: line.quantity,
    prix: line.unit_price,
    total: line.line_total,
  }
}

/** Tableau `{ produit, quantite, prix, total }[]` après OCR / IA. */
export function invoiceLinesToProductSpec(inv: ExtractedInvoice): InvoiceLineProductSpec[] {
  return inv.lines.map(extractedLineToSpec)
}
