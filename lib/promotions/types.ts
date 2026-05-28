/** Types et étiquettes promotions (alignés avec `promotional_offers.offer_type`). */
export const PROMOTION_TYPES = [
  { value: "percentage", label: "Réduction pourcentage", group: "reduction" },
  { value: "fixed_amount", label: "Réduction montant fixe (€)", group: "reduction" },
  { value: "promo_code", label: "Code promo", group: "reduction" },
  { value: "buy_x_get_y", label: "Achetez X — offre Y / 2ème offert", group: "offer" },
  { value: "combo", label: "Menu combo / formule", group: "offer" },
  { value: "happy_hour", label: "Happy hour (créneau horaire)", group: "offer" },
  { value: "loyalty", label: "Fidélité (après X commandes)", group: "offer" },
  { value: "vip_offer", label: "Offre VIP", group: "offer" },
  { value: "student_offer", label: "Offre étudiants", group: "offer" },
  { value: "birthday_offer", label: "Offre anniversaire", group: "offer" },
  { value: "table_group", label: "Groupe à table (5+ convives)", group: "offer" },
  { value: "event_offer", label: "Offre événement / mariage", group: "offer" },
  { value: "bogo", label: "BOGO simplifié (panier)", group: "offer" },
  { value: "category", label: "Catégorie produits", group: "reduction" },
  { value: "product", label: "Produit(s) ciblé(s)", group: "reduction" },
  { value: "event_package", label: "Forfait événementaire", group: "offer" },
] as const

export type PromotionTypeValue = (typeof PROMOTION_TYPES)[number]["value"]

export const VISIBILITY_OPTIONS = [
  { value: "all", label: "Tous les canaux" },
  { value: "delivery", label: "Livraison" },
  { value: "dine_in", label: "Sur place" },
  { value: "qr_table", label: "QR table" },
  { value: "takeaway", label: "À emporter" },
  { value: "catering", label: "Traiteur / groupe" },
  { value: "vip", label: "Espace VIP" },
] as const

const REDUCTION_TYPE_SET = new Set<string>([
  "percentage",
  "fixed_amount",
  "promo_code",
  "category",
  "product",
])

/** Promotions (hub) = tout ; Réductions = % / montant / code / périmètres catalogue ; Offres = le reste. */
export function offerMatchesHub(
  offerType: string | null | undefined,
  hub: "promotions" | "offers" | "reductions",
): boolean {
  const t = String(offerType ?? "").toLowerCase()
  if (hub === "promotions") return true
  const isReduction = REDUCTION_TYPE_SET.has(t)
  if (hub === "reductions") return isReduction
  if (hub === "offers") return !isReduction
  return true
}

export type PromotionRowMeta = Record<string, unknown> & {
  happy_hour?: [number, number]
  loyalty_min_orders?: number
  min_party_size?: number
  bxgy?: { buy_qty?: number; get_qty?: number; discount_percent?: number }
  countdown_ends_at?: string
  ai_hint?: string
  segment?: string
}
