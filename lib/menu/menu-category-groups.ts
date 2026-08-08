/**
 * Sous-groupes affichés dans la section Boissons.
 * Cet ordre n'est qu'un repli (labels/icônes). L'ordre réel d'affichage est piloté
 * par la base (categories.display_order) via groupMenuItemsByCategory(..., orderedSlugs).
 */
import { sortByMenuCardOrder } from "@/lib/menu/menu-order"
import { resolveCategoryDisplayIcon } from "@/lib/menu/category-display-icon"

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

export type MenuCategoryRow = {
  id?: string
  slug: string
  name: string
  name_ar?: string | null
  icon_emoji?: string | null
  display_order?: number
  section?: string | null
  description?: string | null
}

export function resolveGroupedSection(
  activeCategory: string,
  sectionFilter?: string,
): "food" | "drinks" | "desserts" | null {
  if (activeCategory === "section:food") return "food"
  if (activeCategory === "section:drinks") return "drinks"
  if (activeCategory === "section:desserts") return "desserts"
  if (
    sectionFilter === "food" ||
    sectionFilter === "drinks" ||
    sectionFilter === "desserts"
  ) {
    return sectionFilter
  }
  return null
}

/**
 * Regroupe les produits par catégories DB (ordre = categories.display_order).
 * Libellés, icônes et sous-titres proviennent de la base — aucune liste produit en dur.
 */
export function groupMenuItemsByDbCategories<T extends { category: string }>(
  items: T[],
  categories: MenuCategoryRow[],
): GroupedMenuItems<T>[] {
  const sorted = [...categories].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  )

  const byCategory = new Map<string, T[]>()
  for (const item of items) {
    const list = byCategory.get(item.category) ?? []
    list.push(item)
    byCategory.set(item.category, list)
  }

  const groups: GroupedMenuItems<T>[] = []
  const used = new Set<string>()

  for (const cat of sorted) {
    if (used.has(cat.slug)) continue
    used.add(cat.slug)
    const groupItems = byCategory.get(cat.slug) ?? []
    if (groupItems.length === 0) continue
    groups.push({
      key: cat.slug,
      labelDe: cat.name,
      labelAr: cat.name_ar ?? "",
      icon: resolveCategoryDisplayIcon(cat.slug, cat.icon_emoji),
      subtitle: cat.description?.trim() || undefined,
      items: sortByMenuCardOrder(groupItems),
    })
  }

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
      items: sortByMenuCardOrder(orphan),
    })
  }

  return groups
}

/**
 * Regroupe les produits par catégorie pour une section (Boissons / Desserts).
 *
 * L'ordre des sous-groupes est piloté par la base : passez `orderedSlugs`
 * (slugs des catégories de la section, déjà triés par categories.display_order).
 * Les libellés/icônes proviennent des définitions ci-dessus (avec repli sur le slug).
 * Sans `orderedSlugs`, on retombe sur l'ordre des définitions.
 */
/** Sections principales du menu (ordre client / QR / admin). */
export const ADMIN_MENU_SECTIONS = [
  { id: "food" as const, labelDe: "Food", labelAr: "مأكولات", icon: "🍽️" },
  { id: "drinks" as const, labelDe: "Drinks", labelAr: "مشروبات", icon: "🥤" },
  { id: "desserts" as const, labelDe: "Desserts", labelAr: "حلويات", icon: "🍰" },
  { id: "special" as const, labelDe: "Shisha", labelAr: "شيشة", icon: "💨" },
]

export type AdminMenuSectionId = (typeof ADMIN_MENU_SECTIONS)[number]["id"]
export type AdminMenuSectionFilter = "all" | AdminMenuSectionId

export type AdminMenuSectionBlock<T extends { category: string }> = {
  section: AdminMenuSectionId
  labelDe: string
  labelAr: string
  icon: string
  groups: GroupedMenuItems<T>[]
}

/**
 * Regroupe les produits admin par section puis sous-catégorie DB (display_order).
 * Aucune liste produit en dur — piloté par categories.section + categories.display_order.
 */
export function groupProductsForAdminMenu<
  TProduct extends {
    category?: { slug?: string | null; section?: string | null } | null
  },
>(
  products: TProduct[],
  categories: MenuCategoryRow[],
  sectionFilter: AdminMenuSectionFilter,
): AdminMenuSectionBlock<TProduct & { category: string }>[] {
  const slugToSection = new Map(categories.map((c) => [c.slug, c.section ?? "food"]))

  const withSlug = products.map((p) => ({
    ...p,
    category: p.category?.slug ?? "",
  }))

  const sectionsToShow: AdminMenuSectionId[] =
    sectionFilter === "all" ? ADMIN_MENU_SECTIONS.map((s) => s.id) : [sectionFilter]

  const blocks: AdminMenuSectionBlock<TProduct & { category: string }>[] = []

  for (const sectionId of sectionsToShow) {
    const meta = ADMIN_MENU_SECTIONS.find((s) => s.id === sectionId)
    if (!meta) continue

    const sectionCats = categories.filter((c) => (c.section ?? "food") === sectionId)
    const sectionProducts = withSlug.filter((p) => {
      if (!p.category) return false
      const sec = slugToSection.get(p.category) ?? "food"
      return sec === sectionId
    })

    const groups = groupMenuItemsByDbCategories(sectionProducts, sectionCats)
    if (groups.length === 0) continue

    blocks.push({
      section: sectionId,
      labelDe: meta.labelDe,
      labelAr: meta.labelAr,
      icon: meta.icon,
      groups,
    })
  }

  return blocks
}

/** Catégories admin groupées par section (ordre = categories.display_order). */
export function groupCategoriesBySectionForAdmin<T extends MenuCategoryRow & { id: string }>(
  categories: T[],
  sectionFilter: AdminMenuSectionFilter,
): Array<{
  section: AdminMenuSectionId
  labelDe: string
  labelAr: string
  icon: string
  categories: T[]
}> {
  const sorted = [...categories].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  )

  const sectionsToShow: AdminMenuSectionId[] =
    sectionFilter === "all" ? ADMIN_MENU_SECTIONS.map((s) => s.id) : [sectionFilter]

  const blocks: Array<{
    section: AdminMenuSectionId
    labelDe: string
    labelAr: string
    icon: string
    categories: T[]
  }> = []

  for (const sectionId of sectionsToShow) {
    const meta = ADMIN_MENU_SECTIONS.find((s) => s.id === sectionId)
    if (!meta) continue

    const sectionCats = sorted.filter((c) => (c.section ?? "food") === sectionId)
    if (sectionCats.length === 0) continue

    blocks.push({
      section: sectionId,
      labelDe: meta.labelDe,
      labelAr: meta.labelAr,
      icon: meta.icon,
      categories: sectionCats,
    })
  }

  return blocks
}

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
      items: sortByMenuCardOrder(groupItems),
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
      items: sortByMenuCardOrder(orphan),
    })
  }

  return groups
}
