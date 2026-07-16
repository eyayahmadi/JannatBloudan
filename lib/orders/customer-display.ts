import type { Locale } from "@/lib/i18n/config"

/** Canonical DB value — display layer translates by locale. */
export const TABLE_GUEST_CUSTOMER_PREFIX = "table_guest:"

export function tableGuestCustomerName(tableNumber: number): string {
  return `${TABLE_GUEST_CUSTOMER_PREFIX}${tableNumber}`
}

export function parseTableGuestTableNumber(
  customerName: string | null | undefined,
): number | null {
  if (!customerName) return null
  const trimmed = customerName.trim()
  if (trimmed.startsWith(TABLE_GUEST_CUSTOMER_PREFIX)) {
    const n = Number(trimmed.slice(TABLE_GUEST_CUSTOMER_PREFIX.length))
    return Number.isFinite(n) ? n : null
  }
  const legacy = trimmed.match(
    /^(?:client\s+table|guest\s+table|gast\s+tisch|client\s+table|table)\s*#?\s*(\d+)$/i,
  )
  if (legacy) {
    const n = Number(legacy[1])
    return Number.isFinite(n) ? n : null
  }
  return null
}

const GUEST_AT_TABLE: Record<Locale, string> = {
  fr: "Client table {n}",
  en: "Guest table {n}",
  de: "Gast Tisch {n}",
  ar: "عميل طاولة {n}",
}

export function formatGuestAtTableLabel(
  tableNumber: number,
  locale: Locale = "fr",
): string {
  return GUEST_AT_TABLE[locale].replace("{n}", String(tableNumber))
}

/** Resolve customer line for KDS / tickets — locale-aware for table QR guests. */
export function resolveOrderCustomerDisplay(
  customerName: string | null | undefined,
  tableNumber: number | null | undefined,
  locale: Locale = "fr",
): string | null {
  const fromName = parseTableGuestTableNumber(customerName)
  const table = fromName ?? tableNumber
  if (table != null && Number.isFinite(table)) {
    if (
      fromName != null ||
      (customerName &&
        /^(?:client\s+table|guest\s+table|gast\s+tisch|table)\s*#?\s*\d+$/i.test(
          customerName.trim(),
        ))
    ) {
      return formatGuestAtTableLabel(table, locale)
    }
  }
  const clean = customerName?.trim()
  return clean || null
}
