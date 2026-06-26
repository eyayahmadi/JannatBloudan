/** Statut menu admin : disponible / épuisé (visible) / masqué (QR). */
export type ProductMenuStatus = "available" | "sold_out" | "hidden"

export function menuStatusFromRow(row: {
  is_available?: boolean | null
  is_archived?: boolean | null
}): ProductMenuStatus {
  if (row.is_archived) return "hidden"
  if (row.is_available === false) return "sold_out"
  return "available"
}

export function rowFromMenuStatus(status: ProductMenuStatus): {
  is_available: boolean
  is_archived: boolean
} {
  if (status === "hidden") return { is_available: false, is_archived: true }
  if (status === "sold_out") return { is_available: false, is_archived: false }
  return { is_available: true, is_archived: false }
}

export const MENU_STATUS_LABELS: Record<ProductMenuStatus, { de: string; en: string }> = {
  available: { de: "Verfügbar", en: "Available" },
  sold_out: { de: "Ausverkauft", en: "Sold Out" },
  hidden: { de: "Versteckt", en: "Hidden" },
}
