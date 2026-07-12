/**
 * Standalone tax tests (no TS runner required).
 * Run: node scripts/test-tax.mjs
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function normalizeVatRatePercent(rate) {
  if (!Number.isFinite(rate) || rate < 0) return 19
  if (rate > 0 && rate < 1) return rate * 100
  return rate
}

function calculateTaxFromTtc(ttcAmount, vatRatePercent = 19) {
  if (!Number.isFinite(ttcAmount) || ttcAmount < 0) {
    throw new Error("Invalid TTC amount")
  }
  if (ttcAmount === 0) return { ht: 0, tva: 0, ttc: 0 }
  const rate = normalizeVatRatePercent(vatRatePercent)
  const ttcCents = Math.round((ttcAmount + Number.EPSILON) * 100)
  const htCents = Math.round(ttcCents / (1 + rate / 100))
  const tvaCents = ttcCents - htCents
  return { ht: htCents / 100, tva: tvaCents / 100, ttc: ttcCents / 100 }
}

describe("calculateTaxFromTtc", () => {
  it("splits 10.00 € TTC at 19% VAT", () => {
    const r = calculateTaxFromTtc(10, 19)
    assert.equal(r.ht, 8.4)
    assert.equal(r.tva, 1.6)
    assert.equal(r.ttc, 10)
  })

  it("splits 9.00 € TTC at 19% VAT", () => {
    const r = calculateTaxFromTtc(9, 19)
    assert.equal(r.ht, 7.56)
    assert.equal(r.tva, 1.44)
    assert.equal(r.ttc, 9)
  })

  it("returns zeros for 0.00 € TTC", () => {
    assert.deepEqual(calculateTaxFromTtc(0, 19), { ht: 0, tva: 0, ttc: 0 })
  })
})
