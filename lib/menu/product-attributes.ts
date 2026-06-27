/**
 * Attributs menu gérés manuellement par l'admin (source de vérité : products.tags).
 * Ne pas déduire automatiquement côté client — l'admin coche explicitement.
 */

export type MenuAttributeGroup = "taste" | "diet" | "allergen" | "badge" | "availability"

export type MenuProductAttributeDef = {
  id: string
  labelDe: string
  labelAr: string
  group: MenuAttributeGroup
  /** Exclusif avec d'autres ids (ex. spicy / not_spicy) */
  exclusiveWith?: string[]
}

export const MENU_PRODUCT_ATTRIBUTES: MenuProductAttributeDef[] = [
  { id: "spicy", labelDe: "Scharf", labelAr: "حار", group: "taste", exclusiveWith: ["not_spicy"] },
  { id: "not_spicy", labelDe: "Nicht scharf", labelAr: "غير حار", group: "taste", exclusiveWith: ["spicy"] },
  { id: "vegan", labelDe: "Vegan 100%", labelAr: "نباتي 100%", group: "diet" },
  { id: "vegetarian", labelDe: "Vegetarisch", labelAr: "نباتي", group: "diet" },
  { id: "halal", labelDe: "Halal", labelAr: "حلال", group: "diet" },
  { id: "gluten_free", labelDe: "Glutenfrei", labelAr: "خالي من الغلوتين", group: "diet" },
  { id: "contains_gluten", labelDe: "Enthält Gluten", labelAr: "يحتوي غلوتين", group: "allergen", exclusiveWith: ["gluten_free"] },
  { id: "contains_milk", labelDe: "Enthält Milch", labelAr: "يحتوي حليب", group: "allergen" },
  { id: "contains_nuts", labelDe: "Enthält Nüsse", labelAr: "يحتوي مكسرات", group: "allergen" },
  { id: "contains_eggs", labelDe: "Enthält Eier", labelAr: "يحتوي بيض", group: "allergen" },
  { id: "contains_fish", labelDe: "Enthält Fisch", labelAr: "يحتوي سمك", group: "allergen" },
  { id: "contains_meat", labelDe: "Enthält Fleisch", labelAr: "يحتوي لحم", group: "allergen" },
  { id: "best_seller", labelDe: "Bestseller", labelAr: "الأكثر مبيعاً", group: "badge" },
  { id: "new", labelDe: "Neu", labelAr: "جديد", group: "badge" },
  { id: "chef_recommendation", labelDe: "Chef Choice", labelAr: "اختيار الشيف", group: "badge" },
  { id: "kids_friendly", labelDe: "Kinderfreundlich", labelAr: "مناسب للأطفال", group: "badge" },
  { id: "healthy", labelDe: "Gesund", labelAr: "صحي", group: "badge" },
  { id: "popular", labelDe: "Beliebt", labelAr: "شائع", group: "badge" },
]

export const MENU_ATTRIBUTE_GROUPS: { id: MenuAttributeGroup; labelDe: string }[] = [
  { id: "taste", labelDe: "Geschmack" },
  { id: "diet", labelDe: "Ernährung" },
  { id: "allergen", labelDe: "Allergene" },
  { id: "badge", labelDe: "Badges & Highlights" },
]

/** Filtres rapides QR menu (chips) — tags admin uniquement */
export const QR_MENU_ATTRIBUTE_FILTERS = [
  { id: "all", labelDe: "Alle", labelAr: "الكل", icon: "🍽️" },
  { id: "popular", labelDe: "Beliebt", labelAr: "شائع", icon: "⭐", tags: ["popular", "best_seller"] as const },
  { id: "spicy", labelDe: "Scharf", labelAr: "حار", icon: "🌶️", tags: ["spicy"] as const },
  { id: "not_spicy", labelDe: "Nicht scharf", labelAr: "غير حار", icon: "😌", tags: ["not_spicy"] as const },
  { id: "vegan", labelDe: "Vegan", labelAr: "نباتي 100%", icon: "🌱", tags: ["vegan"] as const },
  { id: "vegetarian", labelDe: "Vegetarisch", labelAr: "نباتي", icon: "🥗", tags: ["vegetarian"] as const },
  { id: "kids_friendly", labelDe: "Kinder", labelAr: "أطفال", icon: "👶", tags: ["kids_friendly"] as const },
  { id: "new", labelDe: "Neu", labelAr: "جديد", icon: "✨", tags: ["new"] as const },
  { id: "chef_recommendation", labelDe: "Chef Choice", labelAr: "اختيار الشيف", icon: "👨‍🍳", tags: ["chef_recommendation"] as const },
] as const

export type QrAttributeFilterId = (typeof QR_MENU_ATTRIBUTE_FILTERS)[number]["id"]

const ATTR_MAP = new Map(MENU_PRODUCT_ATTRIBUTES.map((a) => [a.id, a]))

export function getAttributeDef(id: string): MenuProductAttributeDef | undefined {
  return ATTR_MAP.get(id)
}

export function normalizeProductTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.map((t) => String(t).trim()).filter(Boolean))]
}

export function productHasTag(tags: string[] | null | undefined, tag: string): boolean {
  return (tags ?? []).includes(tag)
}

export function productHasAnyTag(tags: string[] | null | undefined, need: readonly string[]): boolean {
  const set = new Set(tags ?? [])
  return need.some((t) => set.has(t))
}

/** Tags affichables (exclut métadonnées techniques) */
const HIDDEN_DISPLAY_TAGS = new Set(["customizable", "has_variants"])

/** Tags du groupe "badge" (highlights) — affichés en surimpression sur les cartes,
 *  donc exclus de la liste d'infos (diet/allergènes) pour éviter les doublons. */
export const BADGE_GROUP_TAGS: ReadonlySet<string> = new Set(
  MENU_PRODUCT_ATTRIBUTES.filter((a) => a.group === "badge").map((a) => a.id),
)

export function visibleProductTags(tags: string[] | null | undefined): string[] {
  return normalizeProductTags(tags).filter((t) => !HIDDEN_DISPLAY_TAGS.has(t))
}

export const ATTRIBUTE_BADGE_STYLES: Record<string, string> = {
  spicy: "bg-rose-500/20 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100",
  not_spicy: "bg-sky-500/15 text-sky-900 dark:bg-sky-900/25 dark:text-sky-100",
  vegan: "bg-emerald-500/20 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100",
  vegetarian: "bg-lime-500/20 text-lime-900 dark:bg-lime-900/30 dark:text-lime-100",
  halal: "bg-teal-500/15 text-teal-900 dark:bg-teal-900/25 dark:text-teal-100",
  gluten_free: "bg-green-500/15 text-green-900 dark:bg-green-900/25 dark:text-green-100",
  contains_gluten: "bg-orange-500/15 text-orange-900 dark:bg-orange-900/25 dark:text-orange-100",
  contains_milk: "bg-amber-500/15 text-amber-900 dark:bg-amber-900/25 dark:text-amber-100",
  contains_nuts: "bg-yellow-600/15 text-yellow-900 dark:bg-yellow-900/25 dark:text-yellow-100",
  contains_eggs: "bg-amber-400/20 text-amber-950 dark:bg-amber-900/30 dark:text-amber-100",
  contains_fish: "bg-blue-500/15 text-blue-900 dark:bg-blue-900/25 dark:text-blue-100",
  contains_meat: "bg-red-500/15 text-red-900 dark:bg-red-900/25 dark:text-red-100",
  best_seller: "bg-amber-500/25 text-amber-950 dark:bg-amber-900/35 dark:text-amber-100",
  new: "bg-emerald-500/20 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100",
  chef_recommendation: "bg-violet-500/20 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100",
  kids_friendly: "bg-sky-500/20 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100",
  healthy: "bg-green-500/20 text-green-900 dark:bg-green-900/30 dark:text-green-100",
  popular: "bg-amber-500/25 text-amber-950 dark:bg-amber-900/35 dark:text-amber-100",
}

export function attributeBadgeClassName(tagId: string): string {
  return ATTRIBUTE_BADGE_STYLES[tagId] ?? "bg-slate-500/10 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"
}

export function attributeBadgeLabel(tagId: string): { de: string; ar: string } | null {
  const def = getAttributeDef(tagId)
  if (!def) return null
  return { de: def.labelDe, ar: def.labelAr }
}

/** Recherche menu : inclut libellés DE/AR des attributs */
export function attributeSearchHaystack(tags: string[] | null | undefined): string {
  const parts: string[] = []
  for (const tag of normalizeProductTags(tags)) {
    parts.push(tag)
    const lbl = attributeBadgeLabel(tag)
    if (lbl) {
      parts.push(lbl.de, lbl.ar)
    }
  }
  return parts.join(" ")
}

/** Applique exclusivité lors de la sélection admin */
export function toggleAttributeTag(current: string[], tagId: string, checked: boolean): string[] {
  const def = getAttributeDef(tagId)
  let next = new Set(current)
  if (checked) {
    if (def?.exclusiveWith) {
      for (const ex of def.exclusiveWith) next.delete(ex)
    }
    next.add(tagId)
  } else {
    next.delete(tagId)
  }
  return [...next]
}

/** Sync colonnes booléennes legacy avec les tags admin */
export function syncLegacyFieldsFromTags(tags: string[]) {
  return {
    is_popular: tags.includes("popular") || tags.includes("best_seller"),
    is_new: tags.includes("new"),
    is_vegetarian: tags.includes("vegetarian"),
    is_vegan: tags.includes("vegan"),
    is_halal: tags.includes("halal"),
    is_gluten_free: tags.includes("gluten_free"),
    is_chef_choice: tags.includes("chef_recommendation"),
    is_recommended: tags.includes("chef_recommendation"),
    spice_level: tags.includes("spicy") ? "épicé" : tags.includes("not_spicy") ? "doux" : null,
    tags,
  }
}

/** Tags depuis produit DB — admin uniquement, sans inférence des booléens legacy */
export function tagsFromProductRow(p: { tags?: string[] | null }): string[] {
  return normalizeProductTags(p.tags)
}

export function filterProductsByAttributeTag<T extends { tags?: string[] }>(
  items: T[],
  filterId: QrAttributeFilterId,
): T[] {
  if (filterId === "all") return items
  const chip = QR_MENU_ATTRIBUTE_FILTERS.find((c) => c.id === filterId)
  if (!chip || !("tags" in chip) || !chip.tags?.length) return items
  return items.filter((p) => productHasAnyTag(p.tags, chip.tags))
}
