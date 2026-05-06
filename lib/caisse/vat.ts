/**
 * Fiscalité configurable : hors cash par défaut pour TVA à payer ; option partie cash déclarée.
 */

export type VatScope = "online_only" | "online_plus_cash_declared"

function normRate(rate: number) {
  return rate > 1 ? rate / 100 : rate
}

/** TVA sur montant HT. */
export function vatFromHt(ht: number, rate: number): number {
  const r = normRate(rate)
  if (!Number.isFinite(ht) || ht <= 0) return 0
  return Math.round(ht * r * 100) / 100
}

/** HT à partir du TTC (prix TI). */
export function htFromTtcInclusive(ttcInclusive: number, rate: number): number {
  const r = normRate(rate)
  if (!Number.isFinite(ttcInclusive) || ttcInclusive <= 0 || r <= 0) return 0
  return Math.round((ttcInclusive / (1 + r)) * 100) / 100
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
    // Ne compte la TVA embarquée que si le mode est bien un encaissement « traçuable » hors espèces
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

  const totalVatDue = Math.round((electronicVat + extraCashDeclareVat) * 100) / 100
  return { electronicVat, extraCashDeclareVat, totalVatDue }
}
