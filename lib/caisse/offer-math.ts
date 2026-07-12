import { round2 } from "@/lib/caisse/recalc-invoice"
import { isWithinHappyHourWindow } from "@/lib/promotions/site-hour"

type OfferLike = {
  offer_type?: string | null
  value_num?: unknown
  meta?: Record<string, unknown> | null
}

function pctDiscount(subtotalHt: number, pct: number): number {
  if (!Number.isFinite(pct) || pct <= 0) return 0
  return round2((subtotalHt * Math.min(pct, 100)) / 100)
}

/**
 * Réduction monétaire sur un sous-total TTC (prix menu) — approximation caisse MVP.
 * Pour les offres complexes (BXGY, combo, …) on accepte un % équivalent en `value_num` ou `meta.equivalent_percent`.
 */
export function discountAmountForOffer(subtotalHt: number, offer: OfferLike, refTime: Date = new Date()): number {
  const t = String(offer.offer_type ?? "").toLowerCase()
  const v = Number(offer.value_num ?? 0)
  if (!Number.isFinite(subtotalHt) || subtotalHt <= 0) return 0

  if (t === "percentage") {
    if (!Number.isFinite(v) || v <= 0) return 0
    return pctDiscount(subtotalHt, v)
  }
  if (t === "fixed_amount") {
    if (!Number.isFinite(v) || v <= 0) return 0
    return round2(Math.min(v, subtotalHt))
  }
  if (t === "promo_code") {
    const mode = String(offer.meta?.mode ?? "percentage").toLowerCase()
    if (mode === "fixed") {
      return round2(Math.min(Number(offer.meta?.amount ?? v) || 0, subtotalHt))
    }
    const pct = Number(offer.meta?.percent ?? v) || 0
    return pctDiscount(subtotalHt, pct)
  }
  if (t === "happy_hour") {
    const hh = offer.meta?.happy_hour as [number, number] | undefined
    if (!isWithinHappyHourWindow(refTime, hh)) return 0
    if (!Number.isFinite(v) || v <= 0) return 0
    return pctDiscount(subtotalHt, v)
  }
  if (t === "buy_x_get_y" || t === "bogo") {
    const bxgy = offer.meta?.bxgy as { discount_percent?: number } | undefined
    const pct = Number(bxgy?.discount_percent ?? offer.meta?.equivalent_percent ?? v) || 0
    return pctDiscount(subtotalHt, pct)
  }
  if (
    t === "combo" ||
    t === "vip_offer" ||
    t === "student_offer" ||
    t === "birthday_offer" ||
    t === "loyalty" ||
    t === "table_group" ||
    t === "event_offer" ||
    t === "event_package" ||
    t === "category" ||
    t === "product"
  ) {
    const pct = Number(offer.meta?.equivalent_percent ?? v) || 0
    return pctDiscount(subtotalHt, pct)
  }
  return 0
}
