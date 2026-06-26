/** Sous-groupes affichés dans la section Boissons (ordre carte réelle). */
export const DRINKS_CATEGORY_GROUPS = [
  { slug: "water", labelDe: "Wasser", labelAr: "المياه", icon: "💧" },
  { slug: "juices", labelDe: "Säfte", labelAr: "العصائر", icon: "🧃" },
  { slug: "soft-drinks", labelDe: "Soft Drinks", labelAr: "المشروبات الغازية", icon: "🥤" },
  { slug: "ice-tea", labelDe: "Eistee", labelAr: "الشاي المثلج", icon: "🧊" },
  { slug: "cocktails", labelDe: "Cocktails", labelAr: "الكوكتيلات", icon: "🍹" },
  { slug: "smoothies", labelDe: "Smoothies", labelAr: "السموذي", icon: "🥤" },
  { slug: "milkshakes", labelDe: "Milkshakes", labelAr: "الميلك شيك", icon: "🥛" },
  { slug: "banana-milk-cocktails", labelDe: "Bananen-Milch Cocktails", labelAr: "كوكتيلات الموز بالحليب", icon: "🍌" },
  { slug: "iced-coffee", labelDe: "Iced Coffee", labelAr: "القهوة الباردة", icon: "🧋" },
  { slug: "tea", labelDe: "Tee", labelAr: "الشاي", icon: "🍵" },
  { slug: "coffee", labelDe: "Heißgetränke", labelAr: "مشروبات ساخنة", icon: "☕" },
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
  { slug: "cakes", labelDe: "Cakes", labelAr: "تورتة", icon: "🍫" },
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

export function groupMenuItemsByCategory<T extends { category: string }>(
  items: T[],
  groupType: "drinks" | "desserts",
): GroupedMenuItems<T>[] {
  const defs =
    groupType === "drinks" ? DRINKS_CATEGORY_GROUPS : DESSERTS_CATEGORY_GROUPS
  const byCategory = new Map<string, T[]>()
  for (const item of items) {
    const list = byCategory.get(item.category) ?? []
    list.push(item)
    byCategory.set(item.category, list)
  }

  const groups: GroupedMenuItems<T>[] = []
  for (const def of defs) {
    const groupItems = byCategory.get(def.slug) ?? []
    if (groupItems.length === 0) continue
    groups.push({
      key: def.slug,
      labelDe: def.labelDe,
      labelAr: def.labelAr,
      icon: def.icon,
      items: groupItems,
    })
  }

  // Catégories non listées (fallback)
  const known = new Set<string>(defs.map((d) => d.slug))
  const orphan: T[] = []
  for (const [slug, list] of byCategory) {
    if (!known.has(slug)) orphan.push(...list)
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
