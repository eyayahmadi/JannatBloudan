import {
  DRINKS_CATEGORY_GROUPS,
  DESSERTS_CATEGORY_GROUPS,
} from "@/lib/menu/menu-category-groups"

const DRINK_CATEGORY_SLUGS = new Set<string>(DRINKS_CATEGORY_GROUPS.map((g) => g.slug))
const DESSERT_CATEGORY_SLUGS = new Set<string>(DESSERTS_CATEGORY_GROUPS.map((g) => g.slug))
export type QrMenuCategoryRow = {
  id: string
  name: string
  slug: string
  section?: string | null
  display_order?: number
  icon_emoji?: string | null
  description?: string | null
}

export type QrTableCategoryChip = {
  id: string
  label: string
  icon: string
}

const SECTION_CHIPS: Array<{ section: string; id: string; label: string; icon: string }> = [
  { section: "food", id: "section:food", label: "Plats", icon: "🍽️" },
  { section: "desserts", id: "section:desserts", label: "Desserts", icon: "🍰" },
  { section: "drinks", id: "section:drinks", label: "Boissons", icon: "🥤" },
  { section: "special", id: "section:special", label: "Chicha", icon: "💨" },
]

/** Chips QR table : Tout, Populaire, puis sections Plats / Desserts / Boissons / Chicha. */
export function buildQrTableCategoryChips(_categories: QrMenuCategoryRow[]): QrTableCategoryChip[] {
  const chips: QrTableCategoryChip[] = [
    { id: "all", label: "Tout", icon: "🍽️" },
    { id: "popular", label: "Populaire", icon: "⭐" },
  ]

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
    if (section === "food") {
      return items.filter((i) => i.section === "food")
    }
    if (section === "drinks") {
      return items.filter((i) => i.section === "drinks" || DRINK_CATEGORY_SLUGS.has(i.category))
    }
    if (section === "desserts") {
      return items.filter((i) => i.section === "desserts" || DESSERT_CATEGORY_SLUGS.has(i.category))
    }
    return items.filter((i) => i.section === section)
  }
  return items.filter((i) => i.category === activeCategory)
}
