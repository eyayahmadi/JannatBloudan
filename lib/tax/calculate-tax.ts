/**
 * Tax breakdown from TTC (menu prices are already tax-inclusive).
 *
 * TTC = final customer price
 * HT  = TTC / (1 + VAT_RATE)
 * TVA = TTC - HT
 */

export type TaxBreakdown = {
  ht: number
  tva: number
  ttc: number
}

/** Default VAT rate for Tunisia restaurant context (19%). */
export const DEFAULT_VAT_RATE_PERCENT = 19

/** Stored in DB as fraction (0.19). */
export const DEFAULT_VAT_RATE_FRACTION = 0.19

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Accepts 19 (percent) or 0.19 (fraction). */
export function normalizeVatRatePercent(rate: number): number {
  if (!Number.isFinite(rate) || rate < 0) return DEFAULT_VAT_RATE_PERCENT
  if (rate > 0 && rate < 1) return rate * 100
  return rate
}

function toCents(eur: number): number {
  return Math.round((eur + Number.EPSILON) * 100)
}

function fromCents(cents: number): number {
  return cents / 100
}

/**
 * Derives HT and TVA from a tax-inclusive (TTC) amount.
 * Uses integer cents so HT + TVA always equals TTC.
 */
export function calculateTaxFromTtc(
  ttcAmount: number,
  vatRatePercent: number = DEFAULT_VAT_RATE_PERCENT,
): TaxBreakdown {
  if (!Number.isFinite(ttcAmount) || ttcAmount < 0) {
    throw new Error("Invalid TTC amount")
  }

  if (ttcAmount === 0) {
    return { ht: 0, tva: 0, ttc: 0 }
  }

  const rate = normalizeVatRatePercent(vatRatePercent)
  const ttcCents = toCents(ttcAmount)
  const divisor = 1 + rate / 100
  const htCents = Math.round(ttcCents / divisor)
  const tvaCents = ttcCents - htCents

  return {
    ht: fromCents(htCents),
    tva: fromCents(tvaCents),
    ttc: fromCents(ttcCents),
  }
}

/** Invoice totals from gross menu TTC, optional discount (TTC), and VAT rate (fraction or percent). */
export function calculateInvoiceTotalsFromGrossTtc(
  grossTtc: number,
  discountTtc: number,
  vatRate: number = DEFAULT_VAT_RATE_FRACTION,
): {
  grossTtc: number
  subtotalHt: number
  discount_amount: number
  tva_amount: number
  total: number
} {
  const gross = Number.isFinite(grossTtc) ? Math.max(0, grossTtc) : 0
  const disc = Number.isFinite(discountTtc) ? Math.max(0, discountTtc) : 0
  const cappedDisc = roundMoney(Math.min(disc, gross))
  const payableTtc = roundMoney(Math.max(0, gross - cappedDisc))
  const breakdown = calculateTaxFromTtc(payableTtc, vatRate)

  return {
    grossTtc: roundMoney(gross),
    subtotalHt: breakdown.ht,
    discount_amount: cappedDisc,
    tva_amount: breakdown.tva,
    total: breakdown.ttc,
  }
}
