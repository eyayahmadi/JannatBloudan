/**
 * Bilingual HTML for order item options on 80 mm prep tickets.
 * Uses DB snapshot fields — no hardcoded product translations.
 */

import {
  CUSTOMER_NOTE_LABEL,
  groupModifiersByGroup,
  type OrderItemOptionsSnapshot,
  resolveOrderItemOptions,
} from "@/lib/orders/order-item-options"

export function escapeTicketHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildGroupHeaderHtml(groupDe: string, groupAr: string | null): string {
  const arPart =
    groupAr && groupAr !== groupDe
      ? `<span class="opt-group-ar" dir="rtl">${escapeTicketHtml(groupAr)}</span>`
      : ""
  const sep = arPart ? `<span class="opt-group-sep"> / </span>` : ""
  return [
    `<div class="opt-group-head">`,
    `<span class="opt-group-de">${escapeTicketHtml(groupDe)}</span>`,
    sep,
    arPart,
    `</div>`,
  ].join("")
}

function buildValuePairHtml(nameDe: string, nameAr: string | null): string {
  const lines: string[] = [`<div class="opt-val-de">${escapeTicketHtml(nameDe)}</div>`]
  if (nameAr && nameAr !== nameDe) {
    lines.push(
      `<div class="opt-val-ar" dir="rtl">${escapeTicketHtml(nameAr)}</div>`,
    )
  }
  return lines.join("")
}

export function buildTicketOptionsHtml(snapshot: OrderItemOptionsSnapshot): string {
  const blocks: string[] = []

  if (snapshot.variant) {
    const v = snapshot.variant
    blocks.push(
      `<div class="opt-group">`,
      buildGroupHeaderHtml(v.group_name_de, v.group_name_ar),
      buildValuePairHtml(v.name_de, v.name_ar),
      `</div>`,
    )
  }

  const grouped = groupModifiersByGroup(snapshot.modifiers)
  for (const mods of grouped.values()) {
    if (!mods.length) continue
    const head = mods[0]
    blocks.push(
      `<div class="opt-group">`,
      buildGroupHeaderHtml(head.group_name_de, head.group_name_ar),
    )
    for (const mod of mods) {
      blocks.push(buildValuePairHtml(mod.name_de, mod.name_ar))
    }
    blocks.push(`</div>`)
  }

  if (snapshot.customer_note) {
    blocks.push(
      `<div class="opt-group">`,
      buildGroupHeaderHtml(
        CUSTOMER_NOTE_LABEL.group_name_de,
        CUSTOMER_NOTE_LABEL.group_name_ar,
      ),
      `<div class="opt-val-de">${escapeTicketHtml(snapshot.customer_note)}</div>`,
      `</div>`,
    )
  }

  if (!blocks.length) return ""
  return `<div class="item-options-box">${blocks.join("")}</div>`
}

export function buildTicketOptionsHtmlFromItem(input: {
  options_snapshot?: unknown
  notes?: string | null
  logContext?: string
}): string {
  const snapshot = resolveOrderItemOptions(input)
  return buildTicketOptionsHtml(snapshot)
}

/** @deprecated Use resolveOrderItemOptions + buildTicketOptionsHtml */
export { resolveOrderItemOptions as parseKitchenTicketNotes } from "@/lib/orders/order-item-options"
