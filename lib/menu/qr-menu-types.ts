import type { ProductModifier, ProductVariant } from "@/lib/menu/digital-menu-product"

/** Produit enrichi pour le menu QR table (client uniquement). */
export type QrMenuItem = {
  id: string
  slug: string
  name: string
  name_ar: string | null
  description: string
  price: number
  image: string
  category: string
  section: string
  station: string
  tags: string[]
  isPopular: boolean
  isNew: boolean
  isVegetarian: boolean
  spiceLevel: string | null
  orderCount: number
  canOrder: boolean
  soldOut: boolean
  stationStatus?: string
  stationAcceptingOrders?: boolean
  unavailableLabel?: string | null
  isCustomizable: boolean
  hasVariants: boolean
  modifiers: ProductModifier[]
  variants: ProductVariant[]
}

export type QrCartEntry = {
  lineId: string
  productId: string
  name: string
  name_ar?: string | null
  image: string
  basePrice: number
  price: number
  variant: import("@/lib/menu/cart-line").CartVariant | null
  extras: import("@/lib/menu/cart-line").CartExtra[]
  quantity: number
  note?: string
}
