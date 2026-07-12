import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculateTaxFromTtc, calculateInvoiceTotalsFromGrossTtc } from "./calculate-tax"

describe("calculateTaxFromTtc", () => {
  it("splits 10.00 € TTC at 19% VAT", () => {
    const r = calculateTaxFromTtc(10, 19)
    assert.equal(r.ht, 8.4)
    assert.equal(r.tva, 1.6)
    assert.equal(r.ttc, 10)
    assert.equal(r.ht + r.tva, r.ttc)
  })

  it("splits 9.00 € TTC at 19% VAT", () => {
    const r = calculateTaxFromTtc(9, 19)
    assert.equal(r.ht, 7.56)
    assert.equal(r.tva, 1.44)
    assert.equal(r.ttc, 9)
    assert.equal(r.ht + r.tva, r.ttc)
  })

  it("returns zeros for 0.00 € TTC", () => {
    const r = calculateTaxFromTtc(0, 19)
    assert.deepEqual(r, { ht: 0, tva: 0, ttc: 0 })
  })

  it("accepts VAT rate as fraction (0.19)", () => {
    const r = calculateTaxFromTtc(10, 0.19)
    assert.equal(r.ht, 8.4)
    assert.equal(r.tva, 1.6)
    assert.equal(r.ttc, 10)
  })

  it("rejects negative TTC", () => {
    assert.throws(() => calculateTaxFromTtc(-1, 19), /Invalid TTC amount/)
  })
})

describe("calculateInvoiceTotalsFromGrossTtc", () => {
  it("applies discount on TTC then derives HT/TVA", () => {
    const r = calculateInvoiceTotalsFromGrossTtc(10, 2, 0.19)
    assert.equal(r.grossTtc, 10)
    assert.equal(r.discount_amount, 2)
    assert.equal(r.total, 8)
    const tax = calculateTaxFromTtc(8, 19)
    assert.equal(r.subtotalHt, tax.ht)
    assert.equal(r.tva_amount, tax.tva)
  })

  it("caps discount at gross TTC", () => {
    const r = calculateInvoiceTotalsFromGrossTtc(5, 99, 19)
    assert.equal(r.discount_amount, 5)
    assert.equal(r.total, 0)
    assert.equal(r.subtotalHt, 0)
    assert.equal(r.tva_amount, 0)
  })
})
