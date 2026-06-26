import type { DigitalMenuProduct, MenuClientFilters, MenuSortId } from "@/lib/menu/digital-menu-product"
import { attributeSearchHaystack } from "@/lib/menu/product-attributes"
import { DRINKS_CATEGORY_GROUPS, DESSERTS_CATEGORY_GROUPS } from "@/lib/menu/menu-category-groups"

const DRINK_CATEGORY_SLUGS = new Set<string>(DRINKS_CATEGORY_GROUPS.map((g) => g.slug))
const DESSERT_CATEGORY_SLUGS = new Set<string>(DESSERTS_CATEGORY_GROUPS.map((g) => g.slug))

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function matchesSearch(p: DigitalMenuProduct, q: string): boolean {
  if (!q.trim()) return true
  const needle = norm(q.trim())
  const hay = [
    p.name,
    p.name_ar ?? "",
    p.description,
    p.categoryName,
    p.category,
    ...p.tags,
    attributeSearchHaystack(p.tags),
  ]
    .join(" ")
    .toLowerCase()
  return norm(hay).includes(needle)
}

function isSpicy(p: DigitalMenuProduct): boolean {
  return (p.tags ?? []).includes("spicy")
}

/**
 * Filtre liste menu (tout est calculé côté client pour recherche instantanée).
 */
export function filterMenuProducts(items: DigitalMenuProduct[], f: MenuClientFilters): DigitalMenuProduct[] {
  return items.filter((p) => {
    if (!matchesSearch(p, f.search)) return false
    if (f.section !== "all" && f.section !== "drinks" && f.section !== "desserts" && p.section !== f.section) return false
    if (f.section === "drinks" && p.section !== "drinks" && !DRINK_CATEGORY_SLUGS.has(p.category)) return false
    if (f.section === "desserts" && p.section !== "desserts" && !DESSERT_CATEGORY_SLUGS.has(p.category)) return false
    if (f.categorySlug !== "all" && p.category !== f.categorySlug) return false
    if (f.priceMin != null && Number.isFinite(f.priceMin) && p.price < f.priceMin) return false
    if (f.priceMax != null && Number.isFinite(f.priceMax) && p.price > f.priceMax) return false
    if (f.availableOnly && !p.can_order) return false
    if (f.popularOnly && !(p.tags ?? []).some((t) => t === "popular" || t === "best_seller")) return false
    if (f.newOnly && !(p.tags ?? []).includes("new")) return false
    if (f.spicyOnly && !isSpicy(p)) return false
    if (f.vegetarianOnly && !(p.tags ?? []).some((t) => t === "vegetarian" || t === "vegan")) return false
    if (f.station !== "all" && (p.station ?? "KITCHEN") !== f.station) return false
    return true
  })
}

export function sortMenuProducts(items: DigitalMenuProduct[], sort: MenuSortId): DigitalMenuProduct[] {
  const copy = [...items]
  switch (sort) {
    case "price_asc":
      copy.sort((a, b) => a.price - b.price || norm(a.name).localeCompare(norm(b.name)))
      break
    case "price_desc":
      copy.sort((a, b) => b.price - a.price || norm(a.name).localeCompare(norm(b.name)))
      break
    case "popular":
      copy.sort((a, b) => (b.order_count || 0) - (a.order_count || 0) || norm(a.name).localeCompare(norm(b.name)))
      break
    case "new":
      copy.sort((a, b) => {
        const prio = Number(b.is_new) - Number(a.is_new)
        if (prio !== 0) return prio
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        if (tb !== ta) return tb - ta
        return norm(a.name).localeCompare(norm(b.name))
      })
      break
    case "name":
    default:
      copy.sort((a, b) => norm(a.name).localeCompare(norm(b.name)))
  }
  return copy
}

/** Produits même catégorie, pondérés par recouvrement de tags */
export function similarProducts(all: DigitalMenuProduct[], id: string, limit = 4): DigitalMenuProduct[] {
  const it = all.find((x) => x.id === id)
  if (!it) return []
  const tagSet = new Set(it.tags.map((t) => norm(t)))
  const sameCat = all.filter((p) => p.id !== id && p.category === it.category)
  const scoreOf = (p: DigitalMenuProduct) =>
    p.tags.reduce((acc, t) => acc + (tagSet.has(norm(t)) ? 1 : 0), 0)
  return [...sameCat].sort((a, b) => scoreOf(b) - scoreOf(a) || norm(a.name).localeCompare(norm(b.name))).slice(0, limit)
}
