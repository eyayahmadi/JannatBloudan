import { cn } from "@/lib/utils"

/** Produit commandé avec libellés DE (+ AR optionnel). */
export type BilingualOrderProduct = {
  name?: string | null
  name_ar?: string | null
  product_name?: string | null
  product_name_ar?: string | null
}

export function resolveOrderProductNames(item: BilingualOrderProduct): {
  de: string
  ar: string | null
} {
  const de = String(item.name ?? item.product_name ?? "").trim()
  const arRaw = String(item.name_ar ?? item.product_name_ar ?? "").trim()

  if (!de && arRaw) {
    return { de: arRaw, ar: null }
  }
  if (!de) {
    return { de: "", ar: null }
  }
  if (arRaw && arRaw !== de) {
    return { de, ar: arRaw }
  }
  return { de, ar: null }
}

export function formatOrderProductNamePlain(item: BilingualOrderProduct): string {
  const { de, ar } = resolveOrderProductNames(item)
  if (!de) return "—"
  return ar ? `${de}\n${ar}` : de
}

export function escapeOrderProductHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** HTML pour tickets imprimés (cuisine / caisse). */
export function buildOrderProductNameHtml(
  item: BilingualOrderProduct,
  opts?: { uppercaseDe?: boolean },
): string {
  const { de, ar } = resolveOrderProductNames(item)
  if (!de) return `<span class="name-de">—</span>`
  const deClass = opts?.uppercaseDe ? "name-de name-de-upper" : "name-de"
  return [
    `<div class="name-de-wrap"><span class="${deClass}">${escapeOrderProductHtml(de)}</span></div>`,
    ar ? `<div class="name-ar-wrap"><span class="name-ar" dir="rtl">${escapeOrderProductHtml(ar)}</span></div>` : "",
  ].join("")
}

/**
 * HTML ligne article pour tickets station (58/80mm) :
 *   Ligne 1 : nom DE + quantité à droite
 *   Ligne 2 : nom AR (RTL), si présent
 */
export function buildTicketItemNameHtml(
  item: BilingualOrderProduct,
  quantity: number,
): string {
  const { de, ar } = resolveOrderProductNames(item)
  const qty = `${Math.max(1, Math.floor(Number(quantity) || 1))}x`
  const label = de || "—"

  return [
    `<div class="item-name">`,
    `<div class="name-de-row">`,
    `<span class="name-de">${escapeOrderProductHtml(label)}</span>`,
    `<span class="qty-inline">${qty}</span>`,
    `</div>`,
    ar
      ? `<div class="name-ar-wrap"><span class="name-ar" dir="rtl">${escapeOrderProductHtml(ar)}</span></div>`
      : "",
    `</div>`,
  ].join("")
}

export const ORDER_PRODUCT_NAME_STYLES = {
  deSm: "font-medium text-inherit",
  deMd: "font-semibold text-inherit",
  arSm: "text-[11px] leading-snug text-slate-500 dark:text-slate-400",
  arMd: "text-xs leading-snug text-slate-500 dark:text-slate-400",
} as const

export function orderProductNameClassNames(
  size: "sm" | "md" = "sm",
  truncate?: boolean,
): { de: string; ar: string; root: string } {
  return {
    root: cn("min-w-0", truncate && "max-w-full"),
    de: cn(
      size === "sm" ? ORDER_PRODUCT_NAME_STYLES.deSm : ORDER_PRODUCT_NAME_STYLES.deMd,
      truncate && "truncate",
    ),
    ar: cn(
      size === "sm" ? ORDER_PRODUCT_NAME_STYLES.arSm : ORDER_PRODUCT_NAME_STYLES.arMd,
      truncate && "line-clamp-2 break-words",
    ),
  }
}
