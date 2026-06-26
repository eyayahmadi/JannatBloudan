/** Catégorie renvoyée par GET /api/menu */
export type QrMenuCategoryRow = {
  id: string
  name: string
  slug: string
  section?: string | null
  display_order?: number
  icon_emoji?: string | null
}

export type QrTableCategoryChip = {
  id: string
  label: string
  icon: string
}

const SECTION_CHIPS: Array<{ section: string; id: string; label: string; icon: string }> = [
  { section: "desserts", id: "section:desserts", label: "Desserts", icon: "🍰" },
  { section: "drinks", id: "section:drinks", label: "Boissons", icon: "🥤" },
  { section: "special", id: "section:special", label: "Shisha", icon: "💨" },
]

/** Construit les chips QR table : Tout, Populaire, catégories food DB, puis sections agrégées. */
export function buildQrTableCategoryChips(categories: QrMenuCategoryRow[]): QrTableCategoryChip[] {
  const foodCats = categories
    .filter((c) => (c.section ?? "food") === "food")
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

  const chips: QrTableCategoryChip[] = [
    { id: "all", label: "Tout", icon: "🍽️" },
    { id: "popular", label: "Populaire", icon: "⭐" },
  ]

  for (const c of foodCats) {
    chips.push({
      id: c.slug,
      label: c.name,
      icon: c.icon_emoji ?? "🍽️",
    })
  }

  for (const s of SECTION_CHIPS) {
    chips.push({ id: s.id, label: s.label, icon: s.icon })
  }

  return chips
}

export type QrTableMenuItemFilterable = {
  category: string
  section: string
  isPopular: boolean
}

export function filterQrTableMenuItems<T extends QrTableMenuItemFilterable>(
  items: T[],
  activeCategory: string,
): T[] {
  if (activeCategory === "all") return items
  if (activeCategory === "popular") return items.filter((i) => i.isPopular)
  if (activeCategory.startsWith("section:")) {
    const section = activeCategory.slice("section:".length)
    return items.filter((i) => i.section === section)
  }
  return items.filter((i) => i.category === activeCategory)
}
