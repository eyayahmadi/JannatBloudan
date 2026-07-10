import {
  DESSERTS_CATEGORY_GROUPS,
  DRINKS_CATEGORY_GROUPS,
  groupMenuItemsByDbCategories,
  type GroupedMenuItems,
} from "@/lib/menu/menu-category-groups"
import { productHasTag } from "@/lib/menu/product-attributes"
import type { QrMenuCategoryRow } from "@/lib/menu/qr-table-category-chips"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"

/** Navigation & printed-menu labels (DE + AR) — canonical QR order. */
export const QR_DEFAULT_CATEGORY_SLUG = "entrees"

export const QR_NAV_CATEGORIES = [
  { slug: "entrees", labelDe: "Vorspeisen", labelAr: "المقبلات", icon: "🍽", kind: "food" as const },
  { slug: "salades", labelDe: "Salate", labelAr: "السلطات", icon: "🥗", kind: "food" as const },
  { slug: "manakish", labelDe: "Manakish", labelAr: "المناقيش", icon: "🫓", kind: "food" as const },
  { slug: "plats", labelDe: "Gerichte", labelAr: "الوجبات", icon: "🍛", kind: "food" as const },
  { slug: "shawarma", labelDe: "Shawarma", labelAr: "الشاورما", icon: "🌯", kind: "food" as const },
  { slug: "grillades", labelDe: "Grillgerichte", labelAr: "المشاوي", icon: "🥩", kind: "food" as const },
  { slug: "pizza", labelDe: "Pizza", labelAr: "البيتزا", icon: "🍕", kind: "food" as const },
  { slug: "burgers", labelDe: "Burger", labelAr: "البرغر", icon: "🍔", kind: "food" as const },
  { slug: "sandwiches", labelDe: "Sandwiches", labelAr: "الساندويش", icon: "🥪", kind: "food" as const },
  { slug: "drinks", labelDe: "Getränke", labelAr: "المشروبات", icon: "🥤", kind: "drinks" as const },
  { slug: "desserts", labelDe: "Desserts", labelAr: "الحلويات", icon: "🍰", kind: "desserts" as const },
  { slug: "shisha", labelDe: "Shisha", labelAr: "أراكيل", icon: "🚬", kind: "special" as const },
] as const

export type QrNavCategory = (typeof QR_NAV_CATEGORIES)[number]

const DRINK_SLUGS = new Set<string>(DRINKS_CATEGORY_GROUPS.map((g) => g.slug))
const DESSERT_SLUGS = new Set<string>(DESSERTS_CATEGORY_GROUPS.map((g) => g.slug))

export type QrPrintedMenuBlock = {
  id: string
  labelDe: string
  labelAr: string
  icon: string
  groups: GroupedMenuItems<QrMenuItem>[]
}

export function qrSectionDomId(slug: string): string {
  if (slug === "drinks") return "qr-section-drinks"
  if (slug === "desserts") return "qr-section-desserts"
  return `qr-cat-${slug}`
}

export function qrNavSlugFromSectionId(sectionId: string): QrNavCategory["slug"] | null {
  if (sectionId === "qr-section-drinks") return "drinks"
  if (sectionId === "qr-section-desserts") return "desserts"
  if (sectionId.startsWith("qr-cat-")) {
    const slug = sectionId.slice("qr-cat-".length)
    return QR_NAV_CATEGORIES.some((c) => c.slug === slug) ? (slug as QrNavCategory["slug"]) : null
  }
  return null
}

export function buildQrPrintedMenuSections(
  items: QrMenuItem[],
  categories: QrMenuCategoryRow[],
): QrPrintedMenuBlock[] {
  const blocks: QrPrintedMenuBlock[] = []
  const catBySlug = new Map(categories.map((c) => [c.slug, c]))

  for (const nav of QR_NAV_CATEGORIES) {
    if (nav.kind === "food" || nav.kind === "special") {
      const cat = catBySlug.get(nav.slug)
      const groupItems = items.filter((i) => i.category === nav.slug)
      if (groupItems.length === 0) continue
      const groups = withLabelOverrides(groupMenuItemsByDbCategories(groupItems, cat ? [cat] : []))
      if (groups.length === 0) continue
      blocks.push({
        id: qrSectionDomId(nav.slug),
        labelDe: nav.labelDe,
        labelAr: nav.labelAr,
        icon: nav.icon,
        groups,
      })
      continue
    }

    if (nav.kind === "drinks") {
      const drinkCats = categories
        .filter((c) => (c.section ?? "food") === "drinks" || DRINK_SLUGS.has(c.slug))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      const drinkItems = items.filter(
        (i) => i.section === "drinks" || DRINK_SLUGS.has(i.category),
      )
      const groups = withLabelOverrides(groupMenuItemsByDbCategories(drinkItems, drinkCats))
      if (groups.length === 0) continue
      blocks.push({
        id: qrSectionDomId("drinks"),
        labelDe: nav.labelDe,
        labelAr: nav.labelAr,
        icon: nav.icon,
        groups,
      })
      continue
    }

    if (nav.kind === "desserts") {
      const dessertCats = categories
        .filter((c) => (c.section ?? "food") === "desserts" || DESSERT_SLUGS.has(c.slug))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      const dessertItems = items.filter(
        (i) => i.section === "desserts" || DESSERT_SLUGS.has(i.category),
      )
      const groups = withLabelOverrides(groupMenuItemsByDbCategories(dessertItems, dessertCats))
      if (groups.length === 0) continue
      blocks.push({
        id: qrSectionDomId("desserts"),
        labelDe: nav.labelDe,
        labelAr: nav.labelAr,
        icon: nav.icon,
        groups,
      })
    }
  }

  return blocks
}

/** Single printed-menu block for the active top-nav category. */
export function getPrintedBlockForCategory(
  items: QrMenuItem[],
  categories: QrMenuCategoryRow[],
  slug: string,
): QrPrintedMenuBlock | null {
  const targetId =
    slug === "drinks"
      ? qrSectionDomId("drinks")
      : slug === "desserts"
        ? qrSectionDomId("desserts")
        : qrSectionDomId(slug)
  return buildQrPrintedMenuSections(items, categories).find((b) => b.id === targetId) ?? null
}

export function isValidQrNavCategorySlug(slug: string): slug is QrNavCategory["slug"] {
  return QR_NAV_CATEGORIES.some((c) => c.slug === slug)
}

export type QrFeaturedSectionDef = {
  id: string
  icon: string
  labelDe: string
  labelAr: string
  subtitleDe?: string
  scrollTargetId: string
  gradient: string
}

export const QR_FEATURED_SECTIONS: QrFeaturedSectionDef[] = [
  {
    id: "bestseller",
    icon: "⭐",
    labelDe: "Bestseller",
    labelAr: "الأكثر مبيعاً",
    scrollTargetId: "qr-featured-bestseller",
    gradient: "from-amber-700 via-amber-600 to-orange-700",
  },
  {
    id: "today",
    icon: "🔥",
    labelDe: "Heute empfohlen",
    labelAr: "موصى به اليوم",
    scrollTargetId: "qr-featured-today",
    gradient: "from-rose-900 via-amber-800 to-amber-700",
  },
  {
    id: "grill",
    icon: "🥩",
    labelDe: "Tellergerichte",
    labelAr: "أطباق رئيسية",
    scrollTargetId: qrSectionDomId("grillades"),
    gradient: "from-stone-800 via-red-950 to-amber-900",
  },
  {
    id: "desserts",
    icon: "🍰",
    labelDe: "Desserts & Süßes",
    labelAr: "حلويات",
    scrollTargetId: qrSectionDomId("desserts"),
    gradient: "from-fuchsia-900 via-rose-900 to-amber-800",
  },
  {
    id: "cold-drinks",
    icon: "🍹",
    labelDe: "Kalte Getränke",
    labelAr: "مشروبات باردة",
    scrollTargetId: qrSectionDomId("drinks"),
    gradient: "from-sky-900 via-cyan-900 to-teal-800",
  },
  {
    id: "shisha",
    icon: "🚬",
    labelDe: "Shisha Spezial",
    labelAr: "أراكيل مميزة",
    scrollTargetId: qrSectionDomId("shisha"),
    gradient: "from-violet-950 via-purple-950 to-stone-900",
  },
]

const COLD_DRINK_SLUGS = new Set([
  "water",
  "juices",
  "soft-drinks",
  "ice-tea",
  "cocktails",
  "smoothies",
  "milkshakes",
  "iced-coffee",
])

export function pickQrFeaturedProducts(
  sectionId: string,
  items: QrMenuItem[],
  limit = 6,
): QrMenuItem[] {
  const available = items.filter((i) => !i.soldOut && i.canOrder)

  switch (sectionId) {
    case "bestseller":
      return available
        .filter(
          (i) =>
            productHasTag(i.tags, "best_seller") ||
            productHasTag(i.tags, "popular") ||
            productHasTag(i.tags, "featured"),
        )
        .slice(0, limit)
    case "today":
      return available
        .filter(
          (i) =>
            productHasTag(i.tags, "today_recommended") ||
            productHasTag(i.tags, "chef_recommendation") ||
            productHasTag(i.tags, "featured") ||
            productHasTag(i.tags, "promotion"),
        )
        .slice(0, limit)
    case "grill":
      return available.filter((i) => i.category === "grillades").slice(0, limit)
    case "desserts":
      return available
        .filter((i) => i.section === "desserts" || DESSERT_SLUGS.has(i.category))
        .slice(0, limit)
    case "cold-drinks":
      return available
        .filter((i) => COLD_DRINK_SLUGS.has(i.category) || i.section === "drinks")
        .slice(0, limit)
    case "shisha":
      return available
        .filter((i) => i.category === "shisha" || i.section === "special")
        .slice(0, limit)
    default:
      return []
  }
}

export type QrProductHighlight = {
  id: string
  icon: string
  labelDe: string
  labelAr: string
  tag: string
}

export const QR_PRODUCT_HIGHLIGHTS: QrProductHighlight[] = [
  { id: "promotion", icon: "🎁", labelDe: "Angebot", labelAr: "عرض", tag: "promotion" },
  { id: "new", icon: "✨", labelDe: "Neu", labelAr: "جديد", tag: "new" },
  { id: "seasonal", icon: "🌿", labelDe: "Saisonal", labelAr: "موسمي", tag: "seasonal" },
  { id: "today_recommended", icon: "🔥", labelDe: "Heute", labelAr: "اليوم", tag: "today_recommended" },
  { id: "best_seller", icon: "🏆", labelDe: "Bestseller", labelAr: "الأكثر مبيعاً", tag: "best_seller" },
]

export function pickQrHighlightProducts(items: QrMenuItem[], tag: string, limit = 1): QrMenuItem[] {
  return items
    .filter((i) => !i.soldOut && productHasTag(i.tags, tag))
    .slice(0, limit)
}

export function productMatchesQrHighlight(item: QrMenuItem, highlightId: string): boolean {
  const def = QR_PRODUCT_HIGHLIGHTS.find((h) => h.id === highlightId)
  if (!def) return false
  return productHasTag(item.tags, def.tag)
}

export function navCategoryFromSlug(slug: string): QrNavCategory | undefined {
  return QR_NAV_CATEGORIES.find((c) => c.slug === slug)
}

/** Printed-menu DE/AR labels for DB slugs (overrides English DB names). */
const QR_CATEGORY_LABEL_OVERRIDES: Record<string, { labelDe: string; labelAr: string }> = {
  entrees: { labelDe: "Vorspeisen", labelAr: "المقبلات" },
  salades: { labelDe: "Salate", labelAr: "السلطات" },
  plats: { labelDe: "Gerichte", labelAr: "الوجبات" },
  grillades: { labelDe: "Grillgerichte", labelAr: "المشاوي" },
  burgers: { labelDe: "Burger", labelAr: "البرغر" },
  water: { labelDe: "Wasser", labelAr: "المياه" },
  juices: { labelDe: "Säfte", labelAr: "العصائر" },
  "soft-drinks": { labelDe: "Softdrinks", labelAr: "المشروبات الغازية" },
  "ice-tea": { labelDe: "Eistee", labelAr: "الشاي المثلج" },
  coffee: { labelDe: "Heiße Getränke", labelAr: "المشروبات الساخنة" },
  "iced-coffee": { labelDe: "Eiskaffee", labelAr: "القهوة الباردة" },
  cocktails: { labelDe: "Cocktails", labelAr: "الكوكتيلات" },
  smoothies: { labelDe: "Smoothies", labelAr: "السموذي" },
  milkshakes: { labelDe: "Milchshakes", labelAr: "الميلك شيك" },
  waffeln: { labelDe: "Waffeln", labelAr: "وافل" },
  crepes: { labelDe: "Crêpes", labelAr: "كريب" },
  pancakes: { labelDe: "Pancakes", labelAr: "بان كيك" },
  "fruit-salads": { labelDe: "Fruchtsalate", labelAr: "سلطات الفواكه" },
  "ice-cream": { labelDe: "Eis", labelAr: "آيس كريم" },
  cheesecakes: { labelDe: "Käsekuchen", labelAr: "تشيز كيك" },
  cakes: { labelDe: "Kuchen", labelAr: "كيك" },
}

function withLabelOverrides(groups: GroupedMenuItems<QrMenuItem>[]): GroupedMenuItems<QrMenuItem>[] {
  return groups.map((g) => {
    const override = QR_CATEGORY_LABEL_OVERRIDES[g.key]
    if (!override) return g
    return { ...g, labelDe: override.labelDe, labelAr: override.labelAr }
  })
}

export function countItemsInNavCategory(items: QrMenuItem[], nav: QrNavCategory): number {
  if (nav.kind === "food" || nav.kind === "special") {
    return items.filter((i) => i.category === nav.slug).length
  }
  if (nav.kind === "drinks") {
    return items.filter((i) => i.section === "drinks" || DRINK_SLUGS.has(i.category)).length
  }
  return items.filter((i) => i.section === "desserts" || DESSERT_SLUGS.has(i.category)).length
}
