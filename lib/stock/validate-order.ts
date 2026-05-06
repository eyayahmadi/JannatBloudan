import { computeMaxServings, type IngRow, type RecipeLine } from "@/lib/menu/availability"

type ProductForValidation = {
  id: string
  stock_quantity?: number | string | null
  is_available?: boolean | null
  product_ingredients?: Array<{
    quantity: string | number
    ingredients: IngRow | null
  }> | null
}

export function canFulfillLine(product: ProductForValidation, quantity: number): {
  ok: boolean
  reason?: string
} {
  if (product.is_available === false) {
    return { ok: false, reason: "Produit desactive" }
  }
  const stock = Number(product.stock_quantity) || 0
  const recipe = product.product_ingredients
  const { availability, maxOrderable } = computeMaxServings(
    (recipe as RecipeLine[] | undefined) ?? undefined,
    stock,
  )
  if (availability === "out" || maxOrderable < quantity) {
    return { ok: false, reason: "Stock insuffisant pour un ou plusieurs produits" }
  }
  return { ok: true }
}
