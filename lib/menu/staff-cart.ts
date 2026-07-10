import type { DigitalMenuProduct } from "@/lib/menu/digital-menu-product"
import {
  buildCartLineId,
  formatKitchenTicketNotes,
  type CartExtra,
  type CartVariant,
} from "@/lib/menu/cart-line"

export type StaffMenuAddPayload = {
  product: DigitalMenuProduct
  quantity: number
  unitPrice: number
  variant: CartVariant | null
  extras: CartExtra[]
}

export type StaffCartLine = {
  lineId: string
  product: DigitalMenuProduct
  quantity: number
  unitPrice: number
  variant: CartVariant | null
  extras: CartExtra[]
  note?: string
}

export function staffCartLineFromAdd(payload: StaffMenuAddPayload, note?: string): StaffCartLine {
  return {
    lineId: buildCartLineId(payload.product.id, payload.extras, payload.variant, note),
    product: payload.product,
    quantity: payload.quantity,
    unitPrice: payload.unitPrice,
    variant: payload.variant,
    extras: payload.extras,
    note,
  }
}

export function mergeStaffCartLine(prev: StaffCartLine[], line: StaffCartLine): StaffCartLine[] {
  const existing = prev.find((l) => l.lineId === line.lineId)
  if (existing) {
    return prev.map((l) =>
      l.lineId === line.lineId ? { ...l, quantity: l.quantity + line.quantity } : l,
    )
  }
  return [...prev, line]
}

export function staffCartTotal(lines: StaffCartLine[]): number {
  return lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
}

export function staffCartToOrderItems(lines: StaffCartLine[]) {
  return lines.map((l) => ({
    productId: l.product.id,
    name: l.product.name,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    variantId: l.variant?.id ?? null,
    notes: formatKitchenTicketNotes(l.extras, l.variant, l.note) ?? undefined,
  }))
}
