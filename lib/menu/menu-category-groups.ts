/**
 * Sous-groupes affichés dans la section Boissons.
 * Cet ordre n'est qu'un repli (labels/icônes). L'ordre réel d'affichage est piloté
 * par la base (categories.display_order) via groupMenuItemsByCategory(..., orderedSlugs).
 */
export const DRINKS_CATEGORY_GROUPS = [
  { slug: "water", labelDe: "Wasser", labelAr: "المياه", icon: "💧" },
  { slug: "juices", labelDe: "Säfte", labelAr: "العصائر", icon: "🧃" },
  { slug: "soft-drinks", labelDe: "Soft Drinks", labelAr: "المشروبات الغازية", icon: "🥤" },
  { slug: "ice-tea", labelDe: "Eistee", labelAr: "الشاي المثلج", icon: "🧊" },
  { slug: "tea", labelDe: "Tee", labelAr: "الشاي", icon: "🍵" },
  { slug: "iced-coffee", labelDe: "Iced Coffee", labelAr: "القهوة الباردة", icon: "🧋" },
  { slug: "coffee", labelDe: "Heißgetränke", labelAr: "المشروبات الساخنة", icon: "☕" },
  { slug: "cocktails", labelDe: "Cocktails", labelAr: "الكوكتيلات", icon: "🍹" },
  { slug: "smoothies", labelDe: "Smoothies", labelAr: "السموذي", icon: "🥤" },
  { slug: "milkshakes", labelDe: "Milkshakes", labelAr: "الميلك شيك", icon: "🥛" },
  { slug: "banana-milk-cocktails", labelDe: "Bananen-Milch Cocktails", labelAr: "كوكتيلات الموز بالحليب", icon: "🍌" },
  { slug: "imperator", labelDe: "Imperator", labelAr: "إمبراطور", icon: "💨" },
] as const

/** Sous-groupes affichés dans la section Desserts. */
export const DESSERTS_CATEGORY_GROUPS = [
  { slug: "waffeln", labelDe: "Waffeln", labelAr: "وافل", icon: "🧇" },
  { slug: "crepes", labelDe: "Crêpes", labelAr: "كريب", icon: "🥞" },
  { slug: "pancakes", labelDe: "Pancakes", labelAr: "بان كيك", icon: "🥞" },
  { slug: "fruit-salads", labelDe: "Fruit Salads", labelAr: "سلطات الفواكه", icon: "🍓" },
  { slug: "ice-cream", labelDe: "Ice Cream", labelAr: "آيس كريم", icon: "🍨" },
  { slug: "cheesecakes", labelDe: "Cheesecakes", labelAr: "تشيز كيك", icon: "🍰" },
  { slug: "cakes", labelDe: "Cakes", labelAr: "كيك", icon: "🍫" },
  { slug: "snacks", labelDe: "Snacks", labelAr: "سناكات", icon: "🥜" },
] as const

export type MenuCategoryGroupDef = {
  slug: string
  labelDe: string
  labelAr: string
  icon: string
}

export type GroupedMenuItems<T extends { category: string }> = {
  key: string
  labelDe: string
  labelAr: string
  icon: string
  subtitle?: string
  items: T[]
}

export function resolveGroupedSection(
  activeCategory: string,
  sectionFilter?: string,
): "drinks" | "desserts" | null {
  if (activeCategory === "section:drinks") return "drinks"
  if (activeCategory === "section:desserts") return "desserts"
  if (sectionFilter === "drinks" || sectionFilter === "desserts") return sectionFilter
  return null
}

/**
 * Regroupe les produits par catégorie pour une section (Boissons / Desserts).
 *
 * L'ordre des sous-groupes est piloté par la base : passez `orderedSlugs`
 * (slugs des catégories de la section, déjà triés par categories.display_order).
 * Les libellés/icônes proviennent des définitions ci-dessus (avec repli sur le slug).
 * Sans `orderedSlugs`, on retombe sur l'ordre des définitions.
 */
export function groupMenuItemsByCategory<T extends { category: string }>(
  items: T[],
  groupType: "drinks" | "desserts",
  orderedSlugs?: string[],
  subtitleBySlug?: Map<string, string>,
): GroupedMenuItems<T>[] {
  const defs =
    groupType === "drinks" ? DRINKS_CATEGORY_GROUPS : DESSERTS_CATEGORY_GROUPS
  const defBySlug = new Map<string, MenuCategoryGroupDef>(
    defs.map((d) => [d.slug, { slug: d.slug, labelDe: d.labelDe, labelAr: d.labelAr, icon: d.icon }]),
  )

  const byCategory = new Map<string, T[]>()
  for (const item of items) {
    const list = byCategory.get(item.category) ?? []
    list.push(item)
    byCategory.set(item.category, list)
  }

  const order =
    orderedSlugs && orderedSlugs.length > 0 ? orderedSlugs : defs.map((d) => d.slug)

  const groups: GroupedMenuItems<T>[] = []
  const used = new Set<string>()
  for (const slug of order) {
    if (used.has(slug)) continue
    used.add(slug)
    const groupItems = byCategory.get(slug) ?? []
    if (groupItems.length === 0) continue
    const def = defBySlug.get(slug)
    groups.push({
      key: slug,
      labelDe: def?.labelDe ?? slug,
      labelAr: def?.labelAr ?? "",
      icon: def?.icon ?? "🍽️",
      subtitle: subtitleBySlug?.get(slug),
      items: groupItems,
    })
  }

  // Catégories non listées dans l'ordre (fallback)
  const orphan: T[] = []
  for (const [slug, list] of byCategory) {
    if (!used.has(slug)) orphan.push(...list)
  }
  if (orphan.length > 0) {
    groups.push({
      key: "other",
      labelDe: "Weitere",
      labelAr: "أخرى",
      icon: "🍽️",
      items: orphan,
    })
  }

  return groups
}
