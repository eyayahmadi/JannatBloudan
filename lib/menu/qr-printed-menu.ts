import {
  groupMenuItemsByDbCategories,
  type GroupedMenuItems,
} from "@/lib/menu/menu-category-groups"
import type { MenuCategoryRow } from "@/lib/menu/menu-catalog-types"
import {
  buildQrCategoryNavCardsFromDb,
  buildQrCategoryNavItemsFromDb,
  categoriesInNavGroup,
  navMetaFromSlug,
  QR_VIRTUAL_NAV_GROUPS,
  resolveQrNavCategorySlugFromDb,
  qrSectionDomId,
  type QrCategoryNavCard,
  type QrCategoryNavItem,
} from "@/lib/menu/build-qr-nav-from-db"
import { productHasTag } from "@/lib/menu/product-attributes"
import type { QrMenuCategoryRow } from "@/lib/menu/qr-table-category-chips"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"

export { qrSectionDomId, defaultQrCategorySlug } from "@/lib/menu/build-qr-nav-from-db"
export type { QrCategoryNavItem, QrCategoryNavCard }

/** Legacy fallback when DB empty. */
export const QR_DEFAULT_CATEGORY_SLUG = "entrees"

/** Legacy QR nav slug — redirects to cold-drinks. */
export const QR_LEGACY_BAR_NAV_SLUG = "bar"

function asMenuCategories(categories: QrMenuCategoryRow[]): MenuCategoryRow[] {
  return categories as MenuCategoryRow[]
}

/** Navigation QR — construite depuis Supabase (Admin = source de vérité). */
export function buildQrCategoryNavItems(
  categories: MenuCategoryRow[] = [],
  menuItems: Array<{ category: string }> = [],
): QrCategoryNavItem[] {
  const productSlugs =
    menuItems.length > 0 ? new Set(menuItems.map((i) => i.category)) : undefined
  return buildQrCategoryNavItemsFromDb(categories, productSlugs)
}

/** Cartes catégories homepage QR — depuis Supabase. */
export function buildQrCategoryNavCards(
  categories: MenuCategoryRow[] = [],
  menuItems: Array<{ category: string }> = [],
): QrCategoryNavCard[] {
  return buildQrCategoryNavCardsFromDb(categories, menuItems)
}

export type QrPrintedMenuBlock = {
  id: string
  labelDe: string
  labelAr: string
  icon: string
  groups: GroupedMenuItems<QrMenuItem>[]
}

export function qrNavSlugFromSectionId(sectionId: string, categories: MenuCategoryRow[] = []): string | null {
  if (sectionId === "qr-section-desserts") return "desserts"
  if (sectionId === "qr-section-hot-drinks") return "hot-drinks"
  if (sectionId === "qr-section-cold-drinks" || sectionId === "qr-section-bar") return "cold-drinks"
  if (sectionId.startsWith("qr-cat-")) {
    const slug = sectionId.slice("qr-cat-".length)
    return resolveQrNavCategorySlugFromDb(slug, categories)
  }
  return null
}

export function isQrDrinkSectionId(sectionId: string): boolean {
  return sectionId === "qr-section-hot-drinks" || sectionId === "qr-section-cold-drinks"
}

export function buildQrPrintedMenuSections(
  items: QrMenuItem[],
  categories: QrMenuCategoryRow[],
): QrPrintedMenuBlock[] {
  const menuCats = asMenuCategories(categories)
  const navItems = buildQrCategoryNavItemsFromDb(menuCats)
  const catBySlug = new Map(categories.map((c) => [c.slug, c]))
  const blocks: QrPrintedMenuBlock[] = []

  for (const nav of navItems) {
    let groupItems: QrMenuItem[]
    let groupCats: QrMenuCategoryRow[]

    if (QR_VIRTUAL_NAV_GROUPS[nav.slug]) {
      groupCats = categoriesInNavGroup(menuCats, nav.slug) as QrMenuCategoryRow[]
      const slugs = new Set(groupCats.map((c) => c.slug))
      groupItems = items.filter((i) => slugs.has(i.category))
    } else {
      groupCats = catBySlug.has(nav.slug) ? [catBySlug.get(nav.slug)!] : []
      groupItems = items.filter((i) => i.category === nav.slug)
    }

    if (groupItems.length === 0) continue
    const groups = groupMenuItemsByDbCategories(groupItems, groupCats)
    if (groups.length === 0) continue

    blocks.push({
      id: qrSectionDomId(nav.slug),
      labelDe: nav.labelDe,
      labelAr: nav.labelAr,
      icon: nav.icon,
      groups,
    })
  }

  return blocks
}

/** Single printed-menu block for the active top-nav category. */
export function getPrintedBlockForCategory(
  items: QrMenuItem[],
  categories: QrMenuCategoryRow[],
  slug: string,
): QrPrintedMenuBlock | null {
  const targetId = qrSectionDomId(slug)
  return buildQrPrintedMenuSections(items, categories).find((b) => b.id === targetId) ?? null
}

export function isValidQrNavCategorySlug(slug: string, categories: MenuCategoryRow[] = []): boolean {
  return resolveQrNavCategorySlugFromDb(slug, categories) != null
}

/** Resolve nav slug — legacy /menu/bar opens Kalte Getränke. */
export function resolveQrNavCategorySlug(slug: string, categories: MenuCategoryRow[] = []): string | null {
  return resolveQrNavCategorySlugFromDb(slug, categories)
}

export function navCategoryFromSlug(
  slug: string,
  categories: MenuCategoryRow[] = [],
): { slug: string; labelDe: string; labelAr: string; icon: string } | undefined {
  return navMetaFromSlug(slug, categories)
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
]

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
