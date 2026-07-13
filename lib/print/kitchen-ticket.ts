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

const PRINT_HINT: Record<"fr" | "en" | "ar" | "de", string> = {
  fr: "Si l'impression ne démarre pas, pressez Ctrl+P / Cmd+P",
  en: "If printing does not start, press Ctrl+P / Cmd+P",
  ar: "إذا لم تبدأ الطباعة، اضغط Ctrl+P / Cmd+P",
  de: "Falls der Druck nicht startet, Strg+P / Cmd+P",
}

const TICKET_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page {
    size: 80mm auto;
    margin: 0;
  }
  html {
    width: 80mm;
    max-width: 80mm;
  }
  body {
    width: 100%;
    max-width: 80mm;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    font-weight: 700;
    font-size: 14px;
    line-height: 1.22;
    margin: 0 auto;
    padding: 1mm 0;
    overflow-wrap: break-word;
    word-wrap: break-word;
    overflow-x: visible;
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
    padding-bottom: 4px;
    margin-bottom: 6px;
    border-bottom: 2px solid #000;
    width: 100%;
  }
  .restaurant {
    font-size: 18px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    color: #000;
  }
  .station-title-ar {
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    font-size: 20px;
    font-weight: 900;
    line-height: 1.18;
    direction: rtl;
    color: #000;
  }
  .station-title-de {
    font-size: 19px;
    font-weight: 900;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-top: 2px;
    color: #000;
  }
  .order-ref {
    margin-top: 6px;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 0.5px;
    color: #000;
  }

  .table-block {
    text-align: center;
    margin: 8px 0 10px;
    padding: 6px 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
    width: 100%;
  }
  .table-label-ar {
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    font-size: 12px;
    font-weight: 900;
    direction: rtl;
    line-height: 1.18;
    color: #000;
  }
  .table-label-de {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-top: 2px;
    color: #000;
  }
  .table-number {
    font-size: 36px;
    font-weight: 900;
    line-height: 1;
    margin-top: 4px;
    letter-spacing: 1px;
    color: #000;
  }

  .items {
    margin: 4px 0;
    width: 100%;
  }
  .prep-item {
    padding: 6px 0 4px;
    width: 100%;
    max-width: 100%;
    overflow: visible;
  }
  .item-qty {
    font-size: 17px;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 4px;
    color: #000;
  }
  .item-names {
    width: 100%;
    max-width: 100%;
    overflow: visible;
  }
  .item-name-ar {
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    font-size: 14px;
    font-weight: 900;
    line-height: 1.22;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    white-space: normal;
    text-align: right;
    direction: rtl;
    unicode-bidi: isolate;
    margin-bottom: 3px;
    width: 100%;
    max-width: 100%;
    overflow: visible;
    color: #000;
  }
  .item-name-de {
    font-size: 12px;
    font-weight: 900;
    line-height: 1.22;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    white-space: normal;
    width: 100%;
    max-width: 100%;
    overflow: visible;
    color: #000;
  }
  .item-opts {
    margin-top: 5px;
    padding-top: 4px;
    border-top: 1px dashed #000;
    width: 100%;
    max-width: 100%;
    overflow: visible;
    color: #000;
  }
  .opt-group {
    margin-top: 4px;
    width: 100%;
    max-width: 100%;
    overflow: visible;
  }
  .opt-group-head {
    font-weight: 900;
    line-height: 1.22;
    margin-bottom: 2px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    white-space: normal;
    width: 100%;
    max-width: 100%;
    overflow: visible;
    color: #000;
  }
  .opt-group-de {
    font-size: 9px;
  }
  .opt-group-ar {
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    font-size: 9px;
    direction: rtl;
    unicode-bidi: isolate;
  }
  .opt-group-sep {
    font-size: 8px;
  }
  .opt-val-de {
    font-size: 10px;
    font-weight: 800;
    line-height: 1.28;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    white-space: normal;
    width: 100%;
    max-width: 100%;
    overflow: visible;
    color: #000;
  }
  .opt-val-ar {
    font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif;
    font-size: 10px;
    font-weight: 800;
    line-height: 1.28;
    text-align: right;
    direction: rtl;
    unicode-bidi: isolate;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    white-space: normal;
    width: 100%;
    max-width: 100%;
    overflow: visible;
    color: #000;
  }
  .item-sep {
    border-bottom: 2px dashed #000;
    margin: 4px 0;
  }
  .items .prep-item:last-of-type + .item-sep {
    display: none;
  }

  .order-time {
    text-align: center;
    font-size: 11px;
    font-weight: 900;
    margin-top: 8px;
    padding-top: 6px;
    border-top: 2px solid #000;
    color: #000;
  }

  @media screen {
    html {
      width: auto;
      max-width: none;
    }
    body {
      width: 80mm;
      max-width: 80mm;
      margin: 12px auto;
      padding: 2mm 0;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
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
      padding: 0 !important;
      overflow: visible !important;
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
  const printHint = PRINT_HINT[locale]

  const effectiveStation: Station =
    options.station ??
    (ticket.items.length > 0 &&
    ticket.items.every((it) => it.station === ticket.items[0].station)
      ? ticket.items[0].station
      : "KITCHEN")

  const stationCfg = STATION_PRINT[effectiveStation]
  const stationTitle = options.title ?? `${stationCfg.titleAr} / ${stationCfg.titleDe}`

  const itemsHtml = ticket.items
    .map((item) => buildPrepTicketItemHtml(item, item.quantity))
    .join("")

  const tableDisplay =
    ticket.table_number !== null && ticket.table_number !== undefined
      ? escapeHtml(String(ticket.table_number))
      : "—"

  const orderTime = formatOrderTime(ticket.created_at, locale)

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=80mm, initial-scale=1" />
<title>${escapeHtml(stationTitle)} #${escapeHtml(ticket.order_number)}</title>
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
      <div class="station-title-ar" dir="rtl">${escapeHtml(stationCfg.titleAr)}</div>
      <div class="station-title-de">${escapeHtml(stationCfg.titleDe)}</div>
      <div class="order-ref">#${escapeHtml(ticket.order_number)}</div>
    </header>

    <section class="table-block">
      <div class="table-label-ar" dir="rtl">رقم الطاولة</div>
      <div class="table-label-de">TISCH / TABLE</div>
      <div class="table-number">${tableDisplay}</div>
    </section>

    <section class="items">${itemsHtml}</section>

    <footer class="order-time">${orderTime}</footer>
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
