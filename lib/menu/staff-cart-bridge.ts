import type { DigitalMenuProduct } from "@/lib/menu/digital-menu-product"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import type { StaffMenuAddPayload } from "@/lib/menu/staff-cart"

/** Maps QR visual item → staff cart payload using canonical catalog row. */
export function staffCartLineFromQrItem(
  item: QrMenuItem,
  catalog: DigitalMenuProduct[],
): StaffMenuAddPayload {
  const product = catalog.find((p) => p.id === item.id)
  if (!product) {
    throw new Error(`Product ${item.id} not in catalog`)
  }
  return {
    product,
    quantity: 1,
    unitPrice: product.price,
    variant: null,
    extras: [],
  }
}
