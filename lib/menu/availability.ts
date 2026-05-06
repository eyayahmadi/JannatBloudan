/**
 * Disponibilité d'un produit à partir d'une recette (product_ingredients) ou du stock produit.
 */

export type StockAvailability = "available" | "limited" | "out"

export type IngRow = {
  id: string
  stock_quantity: string | number
  threshold_low?: string | number | null
  unit?: string | null
}

export type RecipeLine = {
  quantity: string | number
  ingredients: IngRow | null
}

export function computeMaxServings(
  recipe: RecipeLine[] | null | undefined,
  productStock: number,
): { availability: StockAvailability; maxOrderable: number; limitedReason?: string } {
  if (recipe && recipe.length > 0) {
    let minServings = Number.POSITIVE_INFINITY
    for (const line of recipe) {
      const ing = line.ingredients
      const need = Number(line.quantity) || 0
      if (!ing || need <= 0) continue
      const stock = Number(ing.stock_quantity) || 0
      if (stock <= 0) {
        return { availability: "out", maxOrderable: 0, limitedReason: "ingredient" }
      }
      const canMake = Math.floor(stock / need)
      if (canMake < minServings) minServings = canMake
    }
    if (!Number.isFinite(minServings) || minServings < 1) {
      return { availability: "out", maxOrderable: 0 }
    }
    const hasLow = recipe.some((line) => {
      const ing = line.ingredients
      if (!ing) return false
      const th = ing.threshold_low != null ? Number(ing.threshold_low) : null
      if (th == null || !Number.isFinite(th)) return false
      return Number(ing.stock_quantity) <= th
    })
    if (minServings <= 3 && hasLow) {
      return { availability: "limited", maxOrderable: minServings, limitedReason: "low" }
    }
    return { availability: "available", maxOrderable: minServings }
  }
  if (productStock <= 0) {
    return { availability: "out", maxOrderable: 0 }
  }
  if (productStock < 5) {
    return { availability: "limited", maxOrderable: productStock, limitedReason: "product_stock" }
  }
  return { availability: "available", maxOrderable: productStock }
}

export function productTags(
  p: {
    is_popular?: boolean | null
    is_new?: boolean | null
    is_vegetarian?: boolean | null
    spice_level?: string | null
    tags?: string[] | null
  },
): string[] {
  const out = new Set<string>(Array.isArray(p.tags) ? p.tags : [])
  if (p.is_popular) out.add("popular")
  if (p.is_new) out.add("new")
  if (p.is_vegetarian) out.add("vegetarian")
  if (p.spice_level && p.spice_level !== "doux" && p.spice_level !== "") out.add("spicy")
  return Array.from(out)
}
