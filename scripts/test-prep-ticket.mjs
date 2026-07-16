/**
 * Tests for bilingual prep ticket options.
 * Run: node --test scripts/test-prep-ticket.mjs
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

function splitBilingualPair(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return { de: "", ar: null }
  const slash = trimmed.indexOf(" / ")
  if (slash === -1) return { de: trimmed, ar: null }
  return {
    de: trimmed.slice(0, slash).trim(),
    ar: trimmed.slice(slash + 3).trim() || null,
  }
}

function optionsSnapshotFromNotes(raw) {
  const snapshot = { variant: null, modifiers: [], customer_note: null }
  if (!raw?.trim()) return snapshot
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (/^size:/i.test(trimmed)) {
      const { de, ar } = splitBilingualPair(trimmed.replace(/^size:\s*/i, ""))
      if (de) snapshot.variant = { group_name_de: "Größe", group_name_ar: "الحجم", name_de: de, name_ar: ar }
    } else if (trimmed.startsWith("+")) {
      const { de, ar } = splitBilingualPair(trimmed.replace(/^\+\s*/, ""))
      if (de) {
        snapshot.modifiers.push({
          group_name_de: "Extras",
          group_name_ar: "الإضافات",
          name_de: de,
          name_ar: ar,
        })
      }
    } else if (/^note:/i.test(trimmed)) {
      snapshot.customer_note = trimmed.replace(/^note:\s*/i, "").trim() || null
    }
  }
  return snapshot
}

function buildValuePairHtml(nameDe, nameAr) {
  const lines = [`<div class="opt-val-de">${nameDe}</div>`]
  if (nameAr && nameAr !== nameDe) lines.push(`<div class="opt-val-ar" dir="rtl">${nameAr}</div>`)
  return lines.join("")
}

describe("optionsSnapshotFromNotes", () => {
  it("parses bilingual size and extras", () => {
    const raw = "Size: Groß / كبير\n+ Käse / جبنة\nNote: Ohne Zwiebeln"
    const s = optionsSnapshotFromNotes(raw)
    assert.equal(s.variant.name_de, "Groß")
    assert.equal(s.variant.name_ar, "كبير")
    assert.equal(s.modifiers[0].name_de, "Käse")
    assert.equal(s.modifiers[0].name_ar, "جبنة")
    assert.equal(s.customer_note, "Ohne Zwiebeln")
  })

  it("omits Arabic line when translation missing", () => {
    const s = optionsSnapshotFromNotes("Size: Klein\n+ Schokolade")
    const html = buildValuePairHtml(s.variant.name_de, s.variant.name_ar)
    assert.match(html, /Klein/)
    assert.doesNotMatch(html, /opt-val-ar/)
  })
})

describe("kitchen-ticket HTML", () => {
  const src = readFileSync(join(ROOT, "lib/print/kitchen-ticket.ts"), "utf8")

  it("excludes price and total from ticket", () => {
    assert.doesNotMatch(src, /\.total/)
    assert.doesNotMatch(src, /DT/)
    assert.doesNotMatch(src, /unit_price/)
    assert.doesNotMatch(src, /order\.total/)
    assert.match(src, /customer_name/)
    assert.match(src, /order_type/)
  })

  it("uses classic receipt layout with station badge", () => {
    assert.match(src, /size: 80mm auto/)
    assert.match(src, /margin: 2mm/)
    assert.match(src, /width: 76mm/)
    assert.match(src, /station-badge/)
    assert.match(src, /color: #000/)
    assert.doesNotMatch(src, /#0891b2|#d97706|#7c3aed/)
    assert.match(src, /Courier New/)
  })
})

describe("cart-line bilingual extras", () => {
  const src = readFileSync(join(ROOT, "lib/menu/cart-line.ts"), "utf8")
  it("formats extras with name_ar", () => {
    assert.match(src, /formatExtraLabel/)
    assert.match(src, /formatExtraLabel\(e\)/)
  })
})

describe("customer display labels", () => {
  it("formats guest at table per locale", async () => {
    const mod = await import(pathToFileURL(join(ROOT, "lib/orders/customer-display.ts")).href)
    const { formatGuestAtTableLabel, tableGuestCustomerName, resolveOrderCustomerDisplay } = mod

    assert.equal(formatGuestAtTableLabel(55, "de"), "Gast Tisch 55")
    assert.equal(formatGuestAtTableLabel(55, "fr"), "Client table 55")
    assert.equal(tableGuestCustomerName(55), "table_guest:55")
    assert.equal(
      resolveOrderCustomerDisplay("Client Table 55", 55, "de"),
      "Gast Tisch 55",
    )
    assert.equal(
      resolveOrderCustomerDisplay("table_guest:55", 55, "de"),
      "Gast Tisch 55",
    )
  })
})

describe("ticket-notes uses snapshot groups", () => {
  const src = readFileSync(join(ROOT, "lib/print/ticket-notes.ts"), "utf8")
  it("renders group headers from snapshot not hardcoded product names", () => {
    assert.match(src, /group_name_de/)
    assert.match(src, /buildValuePairHtml/)
    assert.doesNotMatch(src, /Größe:/)
  })
})
