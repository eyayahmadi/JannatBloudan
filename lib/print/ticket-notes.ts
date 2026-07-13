/** Parse `special_instructions` / cart notes into structured prep-ticket lines. */

export type ParsedTicketSize = {
  de: string
  ar: string | null
}

export type ParsedTicketExtra = {
  de: string
  ar: string | null
}

export type ParsedKitchenTicketNotes = {
  size: ParsedTicketSize | null
  extras: ParsedTicketExtra[]
  note: string | null
}

function splitBilingualValue(raw: string): { de: string; ar: string | null } {
  const trimmed = raw.trim()
  if (!trimmed) return { de: "", ar: null }
  const slash = trimmed.indexOf(" / ")
  if (slash === -1) return { de: trimmed, ar: null }
  const de = trimmed.slice(0, slash).trim()
  const ar = trimmed.slice(slash + 3).trim()
  return { de: de || trimmed, ar: ar || null }
}

/** Lines from `formatKitchenTicketNotes`: Size:, + extra, Note: */
export function parseKitchenTicketNotes(raw: string | null | undefined): ParsedKitchenTicketNotes {
  const result: ParsedKitchenTicketNotes = { size: null, extras: [], note: null }
  if (!raw?.trim()) return result

  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (/^size:/i.test(trimmed)) {
      const value = trimmed.replace(/^size:\s*/i, "")
      const { de, ar } = splitBilingualValue(value)
      if (de) result.size = { de, ar }
      continue
    }

    if (trimmed.startsWith("+")) {
      const value = trimmed.replace(/^\+\s*/, "")
      const { de, ar } = splitBilingualValue(value)
      if (de) result.extras.push({ de, ar })
      continue
    }

    if (/^note:/i.test(trimmed)) {
      result.note = trimmed.replace(/^note:\s*/i, "").trim() || null
    }
  }

  return result
}

export function escapeTicketHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function buildTicketOptionsHtml(parsed: ParsedKitchenTicketNotes): string {
  const lines: string[] = []

  if (parsed.size) {
    lines.push(
      `<div class="opt-row opt-row-ar" dir="rtl">`,
      `<span class="opt-label">الحجم:</span>`,
      `<span class="opt-value">${escapeTicketHtml(parsed.size.ar ?? parsed.size.de)}</span>`,
      `</div>`,
      `<div class="opt-row opt-row-de">`,
      `<span class="opt-label">Größe:</span>`,
      `<span class="opt-value">${escapeTicketHtml(parsed.size.de)}</span>`,
      `</div>`,
    )
  }

  if (parsed.extras.length > 0) {
    const extrasAr = parsed.extras.map((e) => e.ar ?? e.de).join("، ")
    const extrasDe = parsed.extras.map((e) => e.de).join(", ")
    lines.push(
      `<div class="opt-row opt-row-ar" dir="rtl">`,
      `<span class="opt-label">إضافات:</span>`,
      `<span class="opt-value">${escapeTicketHtml(extrasAr)}</span>`,
      `</div>`,
      `<div class="opt-row opt-row-de">`,
      `<span class="opt-label">Extras:</span>`,
      `<span class="opt-value">${escapeTicketHtml(extrasDe)}</span>`,
      `</div>`,
    )
  }

  if (parsed.note) {
    lines.push(
      `<div class="opt-row opt-row-ar" dir="rtl">`,
      `<span class="opt-label">ملاحظة:</span>`,
      `<span class="opt-value">${escapeTicketHtml(parsed.note)}</span>`,
      `</div>`,
      `<div class="opt-row opt-row-de">`,
      `<span class="opt-label">Notiz:</span>`,
      `<span class="opt-value">${escapeTicketHtml(parsed.note)}</span>`,
      `</div>`,
    )
  }

  if (!lines.length) return ""
  return `<div class="item-opts">${lines.join("")}</div>`
}
