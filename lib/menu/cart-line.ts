export type CartExtra = {
  id: string
  name: string
  name_ar?: string | null
  price: number
}

export type CartVariant = {
  id: string
  name: string
  name_ar?: string | null
  price: number
}

export function buildCartLineId(
  productId: string,
  extras: CartExtra[],
  variant?: CartVariant | null,
  customerNote?: string | null,
): string {
  const parts = [productId]
  if (variant?.id) parts.push(`v:${variant.id}`)
  if (extras.length > 0) {
    const extraKey = [...extras].map((e) => e.id).sort().join(",")
    parts.push(`e:${extraKey}`)
  }
  const note = customerNote?.trim()
  if (note) parts.push(`n:${note.toLowerCase().replace(/\s+/g, " ")}`)
  return parts.length === 1 ? productId : parts.join("::")
}

export function formatVariantLabel(variant: CartVariant): string {
  return variant.name_ar ? `${variant.name} / ${variant.name_ar}` : variant.name
}

export function formatKitchenTicketNotes(
  extras: CartExtra[],
  variant?: CartVariant | null,
  customerNote?: string | null,
): string | null {
  const lines: string[] = []
  if (variant) lines.push(`Size: ${formatVariantLabel(variant)}`)
  if (extras.length > 0) lines.push(...extras.map((e) => `+ ${e.name}`))
  const note = customerNote?.trim()
  if (note) lines.push(`Note: ${note}`)
  return lines.length > 0 ? lines.join("\n") : null
}

/** Prix unitaire : variante remplace le prix de base ; extras s'ajoutent. */
export function calcUnitPrice(
  basePrice: number,
  extras: CartExtra[],
  variant?: CartVariant | null,
): number {
  const start = variant?.price ?? basePrice
  const extrasTotal = extras.reduce((s, e) => s + e.price, 0)
  return Math.round((start + extrasTotal) * 100) / 100
}

export function minVariantPrice(variants: { price: number }[], fallback: number): number {
  if (!variants.length) return fallback
  return Math.min(...variants.map((v) => v.price))
}
