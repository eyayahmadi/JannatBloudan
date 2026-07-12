/**
 * Fiscalité configurable : hors cash par défaut pour TVA à payer ; option partie cash déclarée.
 */

import {
  calculateTaxFromTtc,
  normalizeVatRatePercent,
  roundMoney,
} from "@/lib/tax/calculate-tax"

export type VatScope = "online_only" | "online_plus_cash_declared"

/** HT à partir du TTC (prix menu / montant tax-inclusive). */
export function htFromTtcInclusive(ttcInclusive: number, rate: number): number {
  if (!Number.isFinite(ttcInclusive) || ttcInclusive <= 0) return 0
  return calculateTaxFromTtc(ttcInclusive, normalizeVatRatePercent(rate)).ht
}

/** TVA extraite du TTC (ne pas utiliser HT × taux — prix menu déjà TTC). */
export function vatFromTtc(ttc: number, rate: number): number {
  if (!Number.isFinite(ttc) || ttc <= 0) return 0
  return calculateTaxFromTtc(ttc, normalizeVatRatePercent(rate)).tva
}

/** TVA à partir du HT (reconstruit via TTC = HT × (1+taux)). */
export function vatFromHt(ht: number, rate: number): number {
  if (!Number.isFinite(ht) || ht <= 0) return 0
  const pct = normalizeVatRatePercent(rate)
  const ttc = roundMoney(ht * (1 + pct / 100))
  return calculateTaxFromTtc(ttc, pct).tva
}

function meth(m?: string | null) {
  return (m ?? "").toLowerCase()
}

/** true si encaissement traité hors espèces (soumis à flux TVA suivi dans factures paiement carte/online). */
export function isElectronicPaymentMethod(pm?: string | null) {
  const m = meth(pm)
  return m === "online" || m === "card" || m === "transfer" || m === "wallet"
}

/** true uniquement espèces physiques. */
export function isCashPaymentMethod(pm?: string | null) {
  return meth(pm) === "cash"
}

export type InvoiceRow = {
  status?: string | null
  payment_method?: string | null
  tva_amount?: number | string | null
}

/**
 * Agrège la TVA issue des lignes facture déjà en base (prioritaire).
 * Hors cash pour online_only ; ajoute une base HT déclarée cash si scope étendue.
 */
export function sumTaxesToPayFromInvoiceRows(
  invoices: InvoiceRow[],
  opts: { vatRate: number; vatScope: VatScope; cashDeclaredHtForTax?: number | null },
): { electronicVat: number; extraCashDeclareVat: number; totalVatDue: number } {
  let electronicVat = 0

  for (const inv of invoices) {
    if ((inv.status ?? "").toLowerCase() !== "paid") continue
    if (isCashPaymentMethod(inv.payment_method)) continue
    if (!isElectronicPaymentMethod(inv.payment_method)) continue
    electronicVat += Number(inv.tva_amount ?? 0) || 0
  }

  let extraCashDeclareVat = 0
  if (
    opts.vatScope === "online_plus_cash_declared" &&
    opts.cashDeclaredHtForTax &&
    opts.cashDeclaredHtForTax > 0
  ) {
    extraCashDeclareVat = vatFromHt(opts.cashDeclaredHtForTax, opts.vatRate)
  }

  const totalVatDue = roundMoney(electronicVat + extraCashDeclareVat)
  return { electronicVat, extraCashDeclareVat, totalVatDue }
}
