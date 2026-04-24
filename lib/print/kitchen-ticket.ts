/**
 * Station Ticket Printer
 * -----------------------
 * Ouvre une fenetre pop-up discrete avec un ticket formate pour imprimante
 * (58mm ou 80mm thermique, ou imprimante bureau A4).
 *
 * Supporte 3 types de tickets :
 *   - KITCHEN : ticket cuisine (ambre)
 *   - BAR     : ticket bar (cyan)
 *   - SHISHA  : ticket chicha (violet)
 *
 * Utilisation:
 *   printKitchenTicket(order, { restaurantName: "Joseph Bechara", locale: "fr", station: "BAR" })
 *
 * Le pop-up declenche window.print() automatiquement puis se ferme.
 */

import type { KitchenOrder } from "@/lib/hooks/useRealtimeOrders"
import type { Station } from "@/lib/stations/config"

export type PrintOptions = {
  restaurantName?: string
  locale?: "fr" | "en" | "ar" | "de"
  /** Si true, ferme la fenetre apres impression. Default: true */
  autoClose?: boolean
  /** Texte personnalise pour le label "TICKET CUISINE" */
  title?: string
  /** Station concernee — ajuste titre, emoji et couleur */
  station?: Station
}

/**
 * Configuration visuelle par station — titre, emoji, couleur accent.
 * Les titres sont remplaces par leur traduction i18n si disponible.
 */
const STATION_PRINT: Record<
  Station,
  {
    emoji: string
    accent: string
    titles: Record<"fr" | "en" | "ar" | "de", string>
  }
> = {
  KITCHEN: {
    emoji: "🍽️",
    accent: "#d97706", // amber-600
    titles: {
      fr: "TICKET CUISINE",
      en: "KITCHEN TICKET",
      ar: "تذكرة المطبخ",
      de: "KÜCHENTICKET",
    },
  },
  BAR: {
    emoji: "🍹",
    accent: "#0891b2", // cyan-600
    titles: {
      fr: "TICKET BAR",
      en: "BAR TICKET",
      ar: "تذكرة البار",
      de: "BAR-TICKET",
    },
  },
  SHISHA: {
    emoji: "💨",
    accent: "#7c3aed", // violet-600
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
    title: "TICKET CUISINE",
    order: "Commande",
    table: "Table",
    type: "Type",
    received: "Recue",
    notes: "Notes",
    total: "Total",
    printed: "Imprime le",
    types: {
      qr_self_service: "QR (self-service)",
      server: "Serveur",
      pos: "Caisse",
      delivery: "Livraison",
    },
  },
  en: {
    title: "KITCHEN TICKET",
    order: "Order",
    table: "Table",
    type: "Type",
    received: "Received",
    notes: "Notes",
    total: "Total",
    printed: "Printed at",
    types: {
      qr_self_service: "QR (self-service)",
      server: "Waiter",
      pos: "POS",
      delivery: "Delivery",
    },
  },
  ar: {
    title: "تذكرة المطبخ",
    order: "طلب",
    table: "طاولة",
    type: "نوع",
    received: "استُلم",
    notes: "ملاحظات",
    total: "المجموع",
    printed: "طُبعت في",
    types: {
      qr_self_service: "QR (خدمة ذاتية)",
      server: "نادل",
      pos: "صندوق",
      delivery: "توصيل",
    },
  },
  de: {
    title: "KÜCHENTICKET",
    order: "Bestellung",
    table: "Tisch",
    type: "Typ",
    received: "Erhalten",
    notes: "Notizen",
    total: "Gesamt",
    printed: "Gedruckt am",
    types: {
      qr_self_service: "QR (Selbstbedienung)",
      server: "Kellner",
      pos: "Kasse",
      delivery: "Lieferung",
    },
  },
} as const

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

function formatTime(iso: string, locale: string): string {
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

const PRINT_HINT: Record<"fr" | "en" | "ar" | "de", string> = {
  fr: "Si l'impression ne demarre pas, pressez Ctrl+P / Cmd+P",
  en: "If printing does not start, press Ctrl+P / Cmd+P",
  ar: "إذا لم تبدأ الطباعة، اضغط Ctrl+P / Cmd+P",
  de: "Falls der Druck nicht startet, drücken Sie Strg+P / Cmd+P",
}

export function buildKitchenTicketHTML(order: KitchenOrder, options: PrintOptions = {}): string {
  const { restaurantName = "Joseph Bechara", locale = "fr", station } = options
  const L = LABELS[locale]
  const isRtl = locale === "ar"
  const printHint = PRINT_HINT[locale]

  // Si une station est specifiee, on adapte le titre + l'emoji + la couleur.
  // Sinon, on deduit la station depuis les items (si tous d'une meme station).
  const effectiveStation: Station =
    station ??
    (order.items.length > 0 &&
    order.items.every((it) => it.station === order.items[0].station)
      ? order.items[0].station
      : "KITCHEN")

  const stationCfg = STATION_PRINT[effectiveStation]
  const ticketTitle = options.title ?? stationCfg.titles[locale]
  const accent = stationCfg.accent
  const emoji = stationCfg.emoji

  const itemsHtml = order.items
    .map(
      (item) => `
        <div class="item">
          <div class="item-main">
            <span class="qty">${item.quantity}x</span>
            <span class="name">${escapeHtml(item.name)}</span>
          </div>
          ${item.notes ? `<div class="item-notes">&rarr; ${escapeHtml(item.notes)}</div>` : ""}
        </div>
      `,
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${isRtl ? "rtl" : "ltr"}">
<head>
<meta charset="UTF-8" />
<title>${ticketTitle} #${escapeHtml(order.order_number)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page {
    size: 80mm auto;
    margin: 4mm;
  }
  body {
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 13px;
    color: #000;
    background: #fff;
    padding: 8px;
    width: 72mm;
  }
  .ticket { width: 100%; }
  .header {
    text-align: center;
    padding-bottom: 8px;
    border-bottom: 2px dashed #000;
    margin-bottom: 10px;
  }
  .restaurant {
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .station-badge {
    display: inline-block;
    margin: 4px 0;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #fff;
    background: ${accent};
    border-radius: 4px;
  }
  .title {
    font-size: 16px;
    font-weight: bold;
    margin: 6px 0;
    letter-spacing: 2px;
    color: ${accent};
  }
  .order-number {
    font-size: 24px;
    font-weight: bold;
    margin: 6px 0;
    padding: 6px;
    border: 3px solid ${accent};
    display: inline-block;
    min-width: 80%;
    color: ${accent};
  }
  .meta {
    margin: 10px 0;
    font-size: 12px;
    line-height: 1.6;
  }
  .meta-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .meta-row strong { font-weight: bold; }
  .items {
    padding: 10px 0;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    margin: 10px 0;
  }
  .item {
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dotted #999;
  }
  .item:last-child { border-bottom: none; }
  .item-main {
    display: flex;
    gap: 8px;
    font-size: 14px;
    font-weight: bold;
  }
  .qty {
    min-width: 30px;
    background: #000;
    color: #fff;
    padding: 2px 6px;
    text-align: center;
    font-weight: bold;
  }
  .name { flex: 1; text-transform: uppercase; }
  .item-notes {
    margin-top: 4px;
    padding: 4px 8px;
    background: #ffff99;
    border: 1px solid #999;
    font-size: 11px;
    font-style: italic;
  }
  .total {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-weight: bold;
    font-size: 14px;
    border-top: 2px dashed #000;
    margin-top: 6px;
  }
  .footer {
    margin-top: 10px;
    padding-top: 6px;
    border-top: 1px dashed #999;
    font-size: 10px;
    text-align: center;
    color: #666;
  }
  @media screen {
    body {
      max-width: 360px;
      margin: 16px auto;
      padding: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      background: #fff;
    }
    .print-hint {
      text-align: center;
      padding: 8px;
      margin-bottom: 12px;
      background: #fef3c7;
      color: #92400e;
      font-size: 11px;
      border-radius: 4px;
    }
  }
  @media print {
    .print-hint { display: none; }
    body { margin: 0; padding: 2mm; box-shadow: none; max-width: none; }
  }
</style>
</head>
<body>
  <div class="print-hint">${printHint}</div>
  <div class="ticket">
    <div class="header">
      <div class="restaurant">${escapeHtml(restaurantName)}</div>
      <div class="station-badge">${emoji} ${ticketTitle}</div>
      <div class="title">*** ${ticketTitle} ***</div>
      <div class="order-number">#${escapeHtml(order.order_number)}</div>
    </div>

    <div class="meta">
      ${
        order.table_number !== null && order.table_number !== undefined
          ? `<div class="meta-row"><strong>${L.table}:</strong><span>${escapeHtml(String(order.table_number))}</span></div>`
          : ""
      }
      <div class="meta-row">
        <strong>${L.type}:</strong>
        <span>${L.types[order.order_type] ?? order.order_type}</span>
      </div>
      <div class="meta-row">
        <strong>${L.received}:</strong>
        <span>${formatTime(order.created_at, locale)}</span>
      </div>
      ${
        order.customer_name
          ? `<div class="meta-row"><strong>Client:</strong><span>${escapeHtml(order.customer_name)}</span></div>`
          : ""
      }
    </div>

    <div class="items">${itemsHtml}</div>

    <div class="total">
      <span>${L.total}</span>
      <span>${order.total.toFixed(2)} DT</span>
    </div>

    <div class="footer">
      ${L.printed}: ${formatDateTime(new Date().toISOString(), locale)}
    </div>
  </div>
</body>
</html>`
}

/**
 * Ouvre une fenetre pop-up et lance l'impression.
 * Fonctionne sans popup-blocker si appelee dans un event handler user-initiated.
 */
export function printKitchenTicket(order: KitchenOrder, options: PrintOptions = {}): boolean {
  const { autoClose = true } = options
  const html = buildKitchenTicketHTML(order, options)

  try {
    const win = window.open("", "_blank", "width=420,height=640,scrollbars=yes")
    if (!win) {
      console.warn("[printKitchenTicket] popup bloque")
      return false
    }
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()

    // Lance l'impression apres le chargement
    const doPrint = () => {
      try {
        win.print()
        if (autoClose) {
          // petit delai pour laisser l'impression se lancer
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
      setTimeout(doPrint, 100)
    } else {
      win.addEventListener("load", () => setTimeout(doPrint, 100))
    }

    return true
  } catch (err) {
    console.error("[printKitchenTicket] exception:", err)
    return false
  }
}
