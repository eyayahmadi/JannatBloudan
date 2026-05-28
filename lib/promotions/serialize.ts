/** Offre brute Supabase → payload public sécurisé (pas de données internes sensibles). */
export type PublicPromotion = {
  id: string
  name: string
  short_label?: string | null
  description?: string | null
  offer_type: string
  /** Pour affichage: % ou montant € selon type */
  value_num: number | null
  promo_code?: string | null
  visibility: string
  auto_apply: boolean
  image_url?: string | null
  starts_at?: string | null
  ends_at?: string | null
  meta: Record<string, unknown>
}

export function toPublicPromotion(row: Record<string, unknown>): PublicPromotion | null {
  const id = typeof row.id === "string" ? row.id : null
  if (!id) return null
  return {
    id,
    name: String(row.name ?? ""),
    short_label: row.short_label != null ? String(row.short_label) : null,
    description: row.description != null ? String(row.description) : null,
    offer_type: String(row.offer_type ?? ""),
    value_num: row.value_num != null ? Number(row.value_num) : null,
    promo_code: row.promo_code != null ? String(row.promo_code) : null,
    visibility: String(row.visibility ?? "all"),
    auto_apply: row.auto_apply === true,
    image_url: row.image_url != null ? String(row.image_url) : null,
    starts_at: row.starts_at != null ? String(row.starts_at) : null,
    ends_at: row.ends_at != null ? String(row.ends_at) : null,
    meta: typeof row.meta === "object" && row.meta ? (row.meta as Record<string, unknown>) : {},
  }
}

/** Label prix pour carte / badge UI. */
export function formatPromoBadge(
  p: Pick<PublicPromotion, "offer_type" | "value_num" | "meta">,
): string {
  const t = p.offer_type.toLowerCase()
  const v = p.value_num
  if (t === "percentage" || t === "happy_hour") {
    return v != null && Number.isFinite(v) ? `-${Math.round(Number(v))}%` : "Promo %"
  }
  if (t === "fixed_amount") {
    return v != null && Number.isFinite(v) ? `-${Number(v)} €` : "Réduction"
  }
  if (t === "buy_x_get_y" || t === "bogo") {
    const bxgy = p.meta?.bxgy as { buy_qty?: number; discount_percent?: number } | undefined
    if (bxgy?.discount_percent === 100) return "2ème offert"
    if (typeof bxgy?.buy_qty === "number") return `${bxgy.buy_qty + 1}ème offert`
    return "Offre duo"
  }
  if (t === "combo") return "Pack"
  if (t === "loyalty") return "Fidélité"
  if (t === "student_offer") return "Étudiant"
  if (t === "vip_offer") return "VIP"
  if (t === "birthday_offer") return "Anniversaire"
  return "Offre spéciale"
}
