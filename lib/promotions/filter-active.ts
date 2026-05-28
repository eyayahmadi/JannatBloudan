import { toPublicPromotion, type PublicPromotion } from "@/lib/promotions/serialize"

/** Context public: filtre visibility + dates + pas archivé. */
export function offerIsActiveNow(
  row: Record<string, unknown>,
  now: Date = new Date(),
): boolean {
  if (row.active === false) return false
  if (row.archived_at) return false
  const starts = row.starts_at ? new Date(String(row.starts_at)).getTime() : null
  const ends = row.ends_at ? new Date(String(row.ends_at)).getTime() : null
  const t = now.getTime()
  if (starts != null && Number.isFinite(starts) && starts > t) return false
  if (ends != null && Number.isFinite(ends) && ends < t) return false
  return true
}

export type PromoChannel = "all" | "delivery" | "dine_in" | "qr_table" | "takeaway" | "catering" | "vip"

export function visibilityMatches(channel: PromoChannel | string, rowVis: string | null | undefined): boolean {
  const v = String(rowVis ?? "all").toLowerCase()
  if (v === "all") return true
  const c = String(channel ?? "all").toLowerCase()
  if (c === "all") return true
  return v === c
}

/** Transforme lignes catalogue en promos publiques, filtrées. */
export function filterPublicPromotions(
  rows: Record<string, unknown>[],
  opts: { context?: PromoChannel | string },
): PublicPromotion[] {
  const ctx = opts.context ?? "all"
  const now = new Date()
  const out: PublicPromotion[] = []
  for (const row of rows) {
    if (!offerIsActiveNow(row, now)) continue
    if (!visibilityMatches(ctx, typeof row.visibility === "string" ? row.visibility : "all")) continue
    const p = toPublicPromotion(row)
    if (p) out.push(p)
  }
  return out
}
