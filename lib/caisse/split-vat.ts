import { isElectronicPaymentMethod } from "@/lib/caisse/vat"

/** Ligne de paiement pour ventilation TVA / split (montants bruts Supabase). */
export type PayLine = { method?: unknown; amount?: unknown }

/**
 * Agrège la TVA sur encaissements électroniques (hors espèces) pour factures payées du jour —
 * gère split, paiements legacy sans lignes `payments`, et lignes uniques carte/online.
 */
export function aggregateElectronicVatFromPaidInvoiceRows(
  invoices: Array<{
    id?: string | null
    status?: string | null
    total?: unknown
    tva_amount?: unknown
    payment_method?: string | null
  }>,
  paymentsByInvoiceId: Record<string, PayLine[]>,
): number {
  let sum = 0
  for (const inv of invoices) {
    if (String(inv.status ?? "").toLowerCase() !== "paid") continue
    const invoiceId = String(inv.id ?? "")
    const totalDue = Number(inv.total ?? 0)
    const tva = Number(inv.tva_amount ?? 0)
    if (!invoiceId || !Number.isFinite(totalDue)) continue
    const pm = String(inv.payment_method ?? "").toLowerCase()
    const pays = paymentsByInvoiceId[invoiceId] ?? []
    const paysEffective: PayLine[] =
      pays.length > 0
        ? pays
        : [{ method: pm, amount: totalDue }]
    const allCashOnly =
      paysEffective.length > 0 &&
      paysEffective.every((p) => String(p.method ?? "").toLowerCase() === "cash")
    if (allCashOnly || pm === "cash") continue
    sum += electronicShareOfInvoiceTva(totalDue, tva, paysEffective)
  }
  return Math.round(sum * 100) / 100
}

/**
 * Part de la TVA facture attribuable aux encaissements carte/online (split ou ligne unique).
 */
export function electronicShareOfInvoiceTva(
  invoiceTotal: number,
  invoiceTva: number,
  payments: PayLine[],
): number {
  const total = Number(invoiceTotal)
  const tva = Number(invoiceTva)
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(tva) || tva <= 0) return 0

  let electronic = 0
  for (const p of payments) {
    const m = String(p.method ?? "").toLowerCase()
    const a = Number(p.amount ?? 0)
    if (!Number.isFinite(a) || a <= 0) continue
    if (isElectronicPaymentMethod(m)) electronic += a
  }
  electronic = Math.min(electronic, total)
  const ratio = electronic / total
  return Math.round(tva * ratio * 100) / 100
}
