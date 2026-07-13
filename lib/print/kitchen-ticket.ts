/**
 * Station production tickets (Kitchen / Bar / Shisha) — 80 mm thermal.
 * Print popup → window.print() (Epson TM-m30III via browser driver).
 *
 * Preparation only — never prices, totals, tax, discounts, or payment info.
 */

import type { KitchenOrder, OrderItem } from "@/lib/hooks/useRealtimeOrders"
import type { Station } from "@/lib/stations/config"
import { buildPrepTicketItemHtml } from "@/lib/orders/order-product-name"

/** Fields allowed on production tickets — excludes all financial data. */
type ProductionTicketItem = Pick<
  OrderItem,
  "id" | "name" | "name_ar" | "quantity" | "notes" | "options_snapshot" | "station"
>

type ProductionTicketOrder = {
  order_number: string
  table_number: number | null
  created_at: string
  items: ProductionTicketItem[]
}

/** Strip totals, unit prices, and other payment fields before rendering. */
export function sanitizeProductionTicketOrder(order: KitchenOrder): ProductionTicketOrder {
  return {
    order_number: order.order_number,
    table_number: order.table_number,
    created_at: order.created_at,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      name_ar: item.name_ar,
      quantity: item.quantity,
      notes: item.notes,
      options_snapshot: item.options_snapshot,
      station: item.station,
    })),
  }
}

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
    titleAr: string
    titleDe: string
  }
> = {
  KITCHEN: { titleAr: "مطبخ", titleDe: "KÜCHE" },
  BAR: { titleAr: "بار", titleDe: "BAR" },
  SHISHA: { titleAr: "شيشة", titleDe: "SHISHA" },
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

const LABELS = {
  fr: { order: "N° ticket", table: "Table", received: "Reçu à", printed: "Imprimé le" },
  en: { order: "Ticket #", table: "Table", received: "Received", printed: "Printed at" },
  ar: { order: "رقم التذكرة", table: "طاولة", received: "وقت الاستلام", printed: "طُبعت في" },
  de: { order: "Ticket-Nr.", table: "Tisch", received: "Empfangen", printed: "Gedruckt am" },
} as const

const PRINT_HINT: Record<"fr" | "en" | "ar" | "de", string> = {
  fr: "Si l'impression ne démarre pas, pressez Ctrl+P / Cmd+P",
  en: "If printing does not start, press Ctrl+P / Cmd+P",
  ar: "إذا لم تبدأ الطباعة، اضغط Ctrl+P / Cmd+P",
  de: "Falls der Druck nicht startet, Strg+P / Cmd+P",
}

const TICKET_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: 80mm auto; margin: 0; }
  html { width: 80mm; max-width: 80mm; }
  body {
    width: 100%;
    max-width: 80mm;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    font-weight: 700;
    font-size: 13px;
    line-height: 1.3;
    margin: 0 auto;
    padding: 1mm 0;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }
  .ticket {
    width: 96%;
    max-width: 96%;
    margin: 0 auto;
    padding: 0;
    overflow: visible;
  }

  .header {
    text-align: center;
    padding-bottom: 6px;
    margin-bottom: 8px;
    border-bottom: 2px solid #000;
    width: 100%;
  }
  .restaurant {
    font-size: 16px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    color: #000;
  }
  .station-title {
    font-size: 15px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
    color: #000;
  }
  .station-title-ar {
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    font-weight: 900;
    direction: rtl;
    display: inline;
    color: #000;
  }
  .station-title-sep {
    margin: 0 4px;
    color: #000;
  }
  .order-number {
    font-size: 22px;
    font-weight: 900;
    margin: 4px auto 0;
    padding: 8px 6px;
    border: 3px solid #000;
    display: inline-block;
    min-width: 88%;
    color: #000;
    letter-spacing: 0.5px;
  }

  .meta {
    margin: 8px 0;
    font-size: 12px;
    line-height: 1.5;
    width: 100%;
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
  .meta-table-val {
    font-size: 22px;
    font-weight: 900;
    color: #000;
  }

  .items {
    padding: 8px 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
    margin: 8px 0;
    width: 100%;
  }
  .item {
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dotted #000;
    width: 100%;
    overflow: visible;
  }
  .item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  .item-main {
    width: 100%;
    color: #000;
  }
  .item-name {
    width: 100%;
    min-width: 0;
  }
  .name-de-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 6px;
    width: 100%;
  }
  .name-de {
    flex: 1;
    min-width: 0;
    font-size: 16px;
    font-weight: 900;
    line-height: 1.25;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    color: #000;
  }
  .qty-inline {
    flex-shrink: 0;
    font-size: 18px;
    font-weight: 900;
    white-space: nowrap;
    color: #000;
  }
  .name-ar-wrap {
    margin-top: 2px;
    width: 100%;
  }
  .name-ar {
    display: block;
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    font-size: 15px;
    font-weight: 900;
    line-height: 1.25;
    text-align: right;
    direction: rtl;
    unicode-bidi: isolate;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    color: #000;
  }

  .item-options-box {
    margin-top: 5px;
    padding: 5px 6px;
    border: 1px solid #000;
    background: #fff;
    width: 100%;
    color: #000;
  }
  .opt-group {
    margin-top: 3px;
    width: 100%;
  }
  .opt-group:first-child {
    margin-top: 0;
  }
  .opt-group-head {
    font-weight: 900;
    line-height: 1.25;
    margin-bottom: 2px;
    word-break: break-word;
    color: #000;
  }
  .opt-group-de {
    font-size: 11px;
    font-weight: 900;
    color: #000;
  }
  .opt-group-ar {
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    font-size: 11px;
    font-weight: 900;
    direction: rtl;
    unicode-bidi: isolate;
    color: #000;
  }
  .opt-group-sep {
    font-size: 11px;
    color: #000;
  }
  .opt-val-de {
    font-size: 12px;
    font-weight: 800;
    line-height: 1.3;
    word-break: break-word;
    color: #000;
  }
  .opt-val-ar {
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.3;
    text-align: right;
    direction: rtl;
    unicode-bidi: isolate;
    word-break: break-word;
    color: #000;
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
    html { width: auto; max-width: none; }
    body {
      width: 80mm;
      max-width: 80mm;
      margin: 12px auto;
      padding: 2mm 0;
      box-shadow: 0 4px 24px #00000030;
    }
    .print-hint {
      text-align: center;
      padding: 8px;
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
      width: 80mm !important;
      max-width: 80mm !important;
      margin: 0 !important;
      padding: 0.5mm 0 !important;
      box-shadow: none !important;
    }
    .ticket {
      width: 96% !important;
      max-width: 96% !important;
      margin: 0 auto !important;
    }
  }
`

export function buildStationTicketHTML(order: KitchenOrder, options: PrintOptions = {}): string {
  return buildProductionTicketHTML(sanitizeProductionTicketOrder(order), options)
}

/** @deprecated Use buildStationTicketHTML */
export function buildKitchenTicketHTML(order: KitchenOrder, options: PrintOptions = {}): string {
  return buildStationTicketHTML(order, options)
}

function buildProductionTicketHTML(ticket: ProductionTicketOrder, options: PrintOptions = {}): string {
  const { restaurantName = "Jannat Bloudan", locale = "de" } = options
  const L = LABELS[locale]
  const printHint = PRINT_HINT[locale]

  const effectiveStation: Station =
    options.station ??
    (ticket.items.length > 0 &&
    ticket.items.every((it) => it.station === ticket.items[0].station)
      ? ticket.items[0].station
      : "KITCHEN")

  const stationCfg = STATION_PRINT[effectiveStation]

  const itemsHtml = ticket.items
    .map((item) => buildPrepTicketItemHtml(item, item.quantity))
    .join("")

  const tableDisplay =
    ticket.table_number !== null && ticket.table_number !== undefined
      ? escapeHtml(String(ticket.table_number))
      : "—"

  const receivedTime = formatOrderTime(ticket.created_at, locale)
  const printedAt = formatDateTime(new Date().toISOString(), locale)

  const tableMetaRow =
    ticket.table_number !== null && ticket.table_number !== undefined
      ? `<div class="meta-row"><strong>${L.table}:</strong><span class="meta-table-val">${tableDisplay}</span></div>`
      : ""

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=80mm, initial-scale=1" />
<title>${escapeHtml(stationCfg.titleDe)} #${escapeHtml(ticket.order_number)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@700;900&display=swap" rel="stylesheet" />
<style>${TICKET_STYLES}</style>
</head>
<body>
  <div class="print-hint">${printHint}</div>
  <div class="ticket">
    <header class="header">
      <div class="restaurant">${escapeHtml(restaurantName)}</div>
      <div class="station-title">
        <span class="station-title-ar" dir="rtl">${escapeHtml(stationCfg.titleAr)}</span>
        <span class="station-title-sep">/</span>
        <span>${escapeHtml(stationCfg.titleDe)}</span>
      </div>
      <div class="order-number">#${escapeHtml(ticket.order_number)}</div>
    </header>

    <section class="meta">
      <div class="meta-row"><strong>${L.order}:</strong><span>#${escapeHtml(ticket.order_number)}</span></div>
      ${tableMetaRow}
      <div class="meta-row"><strong>${L.received}:</strong><span>${receivedTime}</span></div>
    </section>

    <section class="items">${itemsHtml}</section>

    <footer class="footer">${L.printed}: ${printedAt}</footer>
  </div>
</body>
</html>`
}

export function printStationTicket(order: KitchenOrder, options: PrintOptions = {}): boolean {
  return printKitchenTicket(order, options)
}

export function printKitchenTicket(order: KitchenOrder, options: PrintOptions = {}): boolean {
  const { autoClose = true } = options
  const html = buildStationTicketHTML(order, options)

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

    if (win.document.readyState === "complete") {
      setTimeout(doPrint, 250)
    } else {
      win.addEventListener("load", () => setTimeout(doPrint, 250))
    }

    return true
  } catch (err) {
    console.error("[printKitchenTicket] exception:", err)
    return false
  }
}
