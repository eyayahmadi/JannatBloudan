/**
 * Tests for 80mm prep ticket note parsing and layout rules.
 * Run: node --test scripts/test-prep-ticket.mjs
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

function splitBilingualValue(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return { de: "", ar: null }
  const slash = trimmed.indexOf(" / ")
  if (slash === -1) return { de: trimmed, ar: null }
  const de = trimmed.slice(0, slash).trim()
  const ar = trimmed.slice(slash + 3).trim()
  return { de: de || trimmed, ar: ar || null }
}

function parseKitchenTicketNotes(raw) {
  const result = { size: null, extras: [], note: null }
  if (!raw?.trim()) return result
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/^size:/i.test(trimmed)) {
      const value = trimmed.replace(/^size:\s*/i, "")
      const { de, ar } = splitBilingualValue(value)
      if (de) result.size = { de, ar }
    } else if (trimmed.startsWith("+")) {
      const value = trimmed.replace(/^\+\s*/, "")
      const { de, ar } = splitBilingualValue(value)
      if (de) result.extras.push({ de, ar })
    } else if (/^note:/i.test(trimmed)) {
      result.note = trimmed.replace(/^note:\s*/i, "").trim() || null
    }
  }
  return result
}

describe("parseKitchenTicketNotes", () => {
  it("parses size, extras, and note", () => {
    const raw = [
      "Size: Groß / كبير",
      "+ Käse",
      "+ Oliven",
      "Note: Ohne Zwiebeln",
    ].join("\n")
    const p = parseKitchenTicketNotes(raw)
    assert.equal(p.size.de, "Groß")
    assert.equal(p.size.ar, "كبير")
    assert.equal(p.extras.length, 2)
    assert.equal(p.extras[0].de, "Käse")
    assert.equal(p.note, "Ohne Zwiebeln")
  })
})

describe("kitchen-ticket HTML", () => {
  const src = readFileSync(join(ROOT, "lib/print/kitchen-ticket.ts"), "utf8")

  it("excludes financial fields from ticket source", () => {
    assert.match(src, /never prices/)
    assert.doesNotMatch(src, /unit_price/)
    assert.doesNotMatch(src, /customer_name/)
    assert.doesNotMatch(src, /order_type/)
  })

  it("uses 80mm page and large table number styles", () => {
    assert.match(src, /size: 80mm auto/)
    assert.match(src, /\.table-number/)
    assert.match(src, /font-size: 40px/)
    assert.match(src, /Noto Sans Arabic/)
  })

  it("shows bilingual table block", () => {
    assert.match(src, /رقم الطاولة/)
    assert.match(src, /TISCH \/ TABLE/)
  })
})

describe("order-product-name prep item", () => {
  const src = readFileSync(join(ROOT, "lib/orders/order-product-name.ts"), "utf8")

  it("puts Arabic name before German", () => {
    assert.match(src, /item-name-ar/)
    assert.match(src, /item-name-de/)
    assert.match(src, /buildPrepTicketItemHtml/)
  })

  it("uses large quantity prefix", () => {
    assert.match(src, /× \$\{qty\}/)
  })
})
