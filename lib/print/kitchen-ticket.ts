/**
 * Station tickets (Kitchen / Bar / Shisha) — 80 mm thermal.
 * Classic receipt layout (monospace) via browser print → Epson TM-m30III.
 */

/** Bump when ticket HTML/CSS changes — visible in printed HTML for cache debugging. */
export const TICKET_LAYOUT_VERSION = "classic-receipt-v8-no-price"

import type { KitchenOrder, OrderItem, OrderType } from "@/lib/hooks/useRealtimeOrders"
import type { Station } from "@/lib/stations/config"
import { resolveOrderProductNames } from "@/lib/orders/order-product-name"
import { buildTicketOptionsHtmlFromItem } from "@/lib/print/ticket-notes"
import { normalizeOrderNumber } from "@/lib/orders/sanitize-display-text"
import { resolveOrderCustomerDisplay } from "@/lib/orders/customer-display"

export type PrintOptions = {
  restaurantName?: string
  locale?: "fr" | "en" | "ar" | "de"
  autoClose?: boolean
  title?: string
  station?: Station
}

const STATION_PRINT: Record<
  Station,
  {
    emoji: string
    titles: Record<"fr" | "en" | "ar" | "de", string>
  }
> = {
  KITCHEN: {
    emoji: "🍽️",
    titles: {
      fr: "TICKET CUISINE",
      en: "KITCHEN TICKET",
      ar: "تذكرة المطبخ",
      de: "KÜCHENTICKET",
    },
  },
  BAR: {
    emoji: "🍹",
    titles: {
      fr: "TICKET BAR",
      en: "BAR TICKET",
      ar: "تذكرة البار",
      de: "BAR-TICKET",
    },
  },
  SHISHA: {
    emoji: "💨",
    titles: {
      fr: "TICKET CHICHA",
      en: "SHISHA TICKET",
      ar: "تذكرة الشيشة",
      de: "SHISHA-TICKET",
    },
  },
}

const LABELS = {
  fr: {
    table: "Table",
    type: "Type",
    received: "Reçue",
    client: "Client",
    printed: "Imprimé le",
    types: {
      qr_self_service: "QR (self-service)",
      server: "Serveur",
      pos: "Caisse",
      delivery: "Livraison",
    },
  },
  en: {
    table: "Table",
    type: "Type",
    received: "Received",
    client: "Client",
    printed: "Printed at",
    types: {
      qr_self_service: "QR (self-service)",
      server: "Waiter",
      pos: "POS",
      delivery: "Delivery",
    },
  },
  ar: {
    table: "طاولة",
    type: "نوع",
    received: "استُلم",
    client: "العميل",
    printed: "طُبعت في",
    types: {
      qr_self_service: "QR (خدمة ذاتية)",
      server: "نادل",
      pos: "صندوق",
      delivery: "توصيل",
    },
  },
  de: {
    table: "Tisch",
    type: "Typ",
    received: "Empfangen",
    client: "Kunde",
    printed: "Gedruckt am",
    types: {
      qr_self_service: "QR (Self-Service)",
      server: "Kellner",
      pos: "Kasse",
      delivery: "Lieferung",
    },
  },
} as const

const PRINT_HINT: Record<"fr" | "en" | "ar" | "de", string> = {
  fr: "Si l'impression ne démarre pas, pressez Ctrl+P / Cmd+P",
  en: "If printing does not start, press Ctrl+P / Cmd+P",
  ar: "إذا لم تبدأ الطباعة، اضغط Ctrl+P / Cmd+P",
  de: "Falls der Druck nicht startet, Strg+P / Cmd+P",
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function resolveIntlLocale(locale: string): string {
  switch (locale) {
    case "ar":
      return "ar-TN"
    case "en":
      return "en-GB"
    case "de":
      return "de-DE"
    default:
      return "fr-FR"
  }
}

function formatOrderTime(iso: string, locale: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString(resolveIntlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function formatDateTime(iso: string, locale: string): string {
  const d = new Date(iso)
  return d.toLocaleString(resolveIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function resolveStation(order: KitchenOrder, station?: Station): Station {
  if (station) return station
  if (
    order.items.length > 0 &&
    order.items.every((it) => it.station === order.items[0].station)
  ) {
    return order.items[0].station
  }
  return "KITCHEN"
}

function orderTypeLabel(locale: PrintOptions["locale"], orderType: OrderType): string {
  const L = LABELS[locale ?? "fr"]
  return L.types[orderType] ?? orderType
}

function buildClassicItemHtml(item: OrderItem): string {
  const { de, ar } = resolveOrderProductNames(item)
  const qty = `${Math.max(1, Math.floor(Number(item.quantity) || 1))}x`
  const label = (de || "—").toUpperCase()

  const optsHtml = buildTicketOptionsHtmlFromItem({
    options_snapshot: item.options_snapshot,
    notes: item.notes,
    logContext: de,
  })

  const legacyNotes =
    item.notes && !optsHtml
      ? `<div class="item-notes">&rarr; ${escapeHtml(item.notes)}</div>`
      : ""

  const arLine =
    ar && ar !== de
      ? `<div class="name-ar" dir="rtl">${escapeHtml(ar)}</div>`
      : ""

  return [
    `<div class="item product-row">`,
    `<div class="item-main">`,
    `<span class="qty">${qty}</span>`,
    `<span class="name">${escapeHtml(label)}</span>`,
    `</div>`,
    arLine,
    optsHtml,
    legacyNotes,
    `</div>`,
  ].join("")
}

const TICKET_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page {
    size: 80mm auto;
    margin: 2mm;
  }
  html,
  body {
    width: 76mm;
    max-width: 76mm;
    margin: 0;
    padding: 0;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    overflow-x: visible;
  }
  body {
    font-family: "Courier New", Consolas, monospace;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }
  .ticket,
  .header,
  .meta,
  .items,
  .footer,
  .item,
  .product-row,
  .item-main,
  .item-options-box,
  .options-box {
    width: 100%;
    max-width: none;
    box-sizing: border-box;
  }
  .ticket {
    margin: 0;
    padding: 0;
    overflow: visible;
  }
  .header {
    text-align: center;
    padding-bottom: 8px;
    border-bottom: 2px dashed #000;
    margin-bottom: 8px;
  }
  .restaurant {
    font-size: 14px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
    color: #000;
  }
  .station-badge {
    display: inline-block;
    margin: 4px 0;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #000;
    background: #fff;
    border: 2px solid #000;
  }
  .title {
    font-size: 16px;
    font-weight: 900;
    margin: 6px 0;
    letter-spacing: 2px;
    color: #000;
  }
  .order-number {
    font-size: 24px;
    font-weight: 900;
    margin: 6px 0 0;
    padding: 8px 0;
    border: 3px solid #000;
    display: block;
    width: 100%;
    color: #000;
    letter-spacing: 0.5px;
  }
  .meta {
    margin: 8px 0;
    font-size: 12px;
    line-height: 1.5;
    color: #000;
  }
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 3px;
  }
  .meta-row strong {
    font-weight: 900;
    flex-shrink: 0;
    color: #000;
  }
  .meta-row span {
    font-weight: 700;
    text-align: right;
    word-break: break-word;
    color: #000;
  }
  .items {
    padding: 8px 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
    margin: 8px 0;
  }
  .item {
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dotted #000;
    overflow: visible;
  }
  .item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  .item-main {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    font-weight: 900;
    color: #000;
  }
  .qty {
    flex-shrink: 0;
    min-width: 28px;
    font-weight: 900;
    color: #000;
  }
  .name {
    flex: 1;
    min-width: 0;
    text-transform: uppercase;
    word-break: break-word;
    color: #000;
  }
  .name-ar {
    margin-top: 2px;
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    font-size: 12px;
    font-weight: 900;
    text-align: right;
    direction: rtl;
    unicode-bidi: isolate;
    word-break: break-word;
    color: #000;
  }
  .item-notes {
    margin-top: 4px;
    padding: 4px 0;
    border-top: 1px dotted #000;
    font-size: 11px;
    font-weight: 700;
    font-style: italic;
    color: #000;
  }
  .item-options-box,
  .options-box {
    margin-top: 4px;
    padding: 4px 0;
    border: 1px solid #000;
    background: #fff;
    color: #000;
  }
  .opt-group { margin-top: 3px; width: 100%; }
  .opt-group:first-child { margin-top: 0; }
  .opt-group-head,
  .opt-val-de,
  .opt-val-ar,
  .opt-group-de,
  .opt-group-ar,
  .opt-group-sep {
    color: #000;
    font-weight: 800;
  }
  .opt-val-ar,
  .opt-group-ar {
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    direction: rtl;
    unicode-bidi: isolate;
    text-align: right;
  }
  .footer {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px dashed #000;
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    color: #000;
  }
  @media screen {
    html, body {
      width: 76mm;
      max-width: 76mm;
    }
    body {
      margin: 12px auto;
      box-shadow: 0 4px 24px #00000030;
    }
    .print-hint {
      text-align: center;
      padding: 8px 4px;
      margin-bottom: 10px;
      background: #000;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      border-radius: 4px;
    }
  }
  @media print {
    .print-hint { display: none !important; }
    html, body {
      width: 76mm !important;
      max-width: 76mm !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
    }
    .ticket,
    .header,
    .meta,
    .items,
    .footer,
    .item,
    .product-row,
    .item-main,
    .item-options-box,
    .options-box {
      width: 100% !important;
      max-width: none !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      box-sizing: border-box !important;
    }
    .ticket {
      margin: 0 !important;
      padding: 0 !important;
    }
  }
`

export function buildStationTicketHTML(order: KitchenOrder, options: PrintOptions = {}): string {
  const { restaurantName = "Jannat Bloudan", locale = "fr" } = options
  const L = LABELS[locale]
  const printHint = PRINT_HINT[locale]
  const isRtl = locale === "ar"

  const effectiveStation = resolveStation(order, options.station)
  const stationCfg = STATION_PRINT[effectiveStation]
  const ticketTitle = options.title ?? stationCfg.titles[locale]
  const emoji = stationCfg.emoji
  const orderNumber = normalizeOrderNumber(order.order_number)

  const itemsHtml = order.items.map((item) => buildClassicItemHtml(item)).join("")
  const receivedTime = formatOrderTime(order.created_at, locale)
  const printedAt = formatDateTime(new Date().toISOString(), locale)

  const tableMetaRow =
    order.table_number !== null && order.table_number !== undefined
      ? `<div class="meta-row"><strong>${L.table}:</strong><span>${escapeHtml(String(order.table_number))}</span></div>`
      : ""

  const clientDisplay = resolveOrderCustomerDisplay(
    order.customer_name,
    order.table_number,
    locale,
  )
  const clientMetaRow = clientDisplay
    ? `<div class="meta-row"><strong>${L.client}:</strong><span>${escapeHtml(clientDisplay)}</span></div>`
    : ""

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${isRtl ? "rtl" : "ltr"}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(ticketTitle)} #${escapeHtml(orderNumber)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@700;900&display=swap" rel="stylesheet" />
<style>${TICKET_STYLES}</style>
</head>
<body data-ticket-layout="${TICKET_LAYOUT_VERSION}">
  <!-- ticket-layout:${TICKET_LAYOUT_VERSION} -->
  <div class="print-hint">${printHint}</div>
  <div class="ticket">
    <header class="header">
      <div class="restaurant">${escapeHtml(restaurantName)}</div>
      <div class="station-badge">${emoji} ${escapeHtml(ticketTitle)}</div>
      <div class="title">*** ${escapeHtml(ticketTitle)} ***</div>
      <div class="order-number">#${escapeHtml(orderNumber)}</div>
    </header>

    <section class="meta">
      ${tableMetaRow}
      <div class="meta-row">
        <strong>${L.type}:</strong>
        <span>${escapeHtml(orderTypeLabel(locale, order.order_type))}</span>
      </div>
      <div class="meta-row">
        <strong>${L.received}:</strong>
        <span>${receivedTime}</span>
      </div>
      ${clientMetaRow}
    </section>

    <section class="items">${itemsHtml}</section>

    <footer class="footer">${L.printed}: ${printedAt}</footer>
  </div>
</body>
</html>`
}

/** @deprecated Use buildStationTicketHTML */
export function buildKitchenTicketHTML(order: KitchenOrder, options: PrintOptions = {}): string {
  return buildStationTicketHTML(order, options)
}

export function printStationTicket(order: KitchenOrder, options: PrintOptions = {}): Promise<boolean> {
  return printKitchenTicket(order, options)
}

function openPrintWindow(html: string, autoClose = true): boolean {
  try {
    const win = window.open("", "_blank", "width=360,height=720,scrollbars=yes")
    if (!win) {
      console.warn("[printKitchenTicket] popup bloque")
      return false
    }
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()

    const doPrint = () => {
      try {
        win.print()
        if (autoClose) {
          setTimeout(() => {
            try {
              win.close()
            } catch {
              /* ignore */
            }
          }, 500)
        }
      } catch (err) {
        console.warn("[printKitchenTicket] print failed:", err)
      }
    }

    const delay = 400
    if (win.document.readyState === "complete") {
      setTimeout(doPrint, delay)
    } else {
      win.addEventListener("load", () => setTimeout(doPrint, delay))
    }

    return true
  } catch (err) {
    console.error("[printKitchenTicket] exception:", err)
    return false
  }
}

/** Fetch fresh HTML from server (avoids stale client bundle), then print. */
export async function printKitchenTicket(
  order: KitchenOrder,
  options: PrintOptions = {},
): Promise<boolean> {
  const { autoClose = true, restaurantName, locale, station, title } = options
  let html: string | null = null

  try {
    const res = await fetch("/api/stations/print-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order,
        restaurantName,
        locale,
        station,
        title,
      }),
      cache: "no-store",
    })
    if (res.ok) {
      const payload = (await res.json()) as { html?: string }
      if (typeof payload.html === "string" && payload.html.includes("order-number")) {
        html = payload.html
      }
    }
  } catch (err) {
    console.warn("[printKitchenTicket] server HTML fallback:", err)
  }

  if (!html) {
    html = buildStationTicketHTML(order, options)
  }

  return openPrintWindow(html, autoClose)
}
