/**
 * Tests for invoice remaining / paid amount logic.
 * Run: node --test scripts/test-invoice-remaining.mjs
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"

function invoiceAmountPaid(inv) {
  const status = String(inv.status ?? "").toLowerCase()
  const total = Number(inv.total ?? 0)
  const split = Array.isArray(inv.payment_split) ? inv.payment_split : []
  const splitPaid = split.reduce((sum, part) => sum + Number(part.amount ?? 0), 0)
  if (status === "paid") return split.length > 0 ? splitPaid : total
  return Math.max(0, splitPaid)
}

function invoiceRemaining(inv) {
  const total = Number(inv.total ?? 0)
  return Math.max(0, total - invoiceAmountPaid(inv))
}

describe("invoiceRemaining", () => {
  it("returns 0 for paid invoice without payment_split", () => {
    assert.equal(invoiceRemaining({ status: "paid", total: 17.85, payment_split: null }), 0)
  })

  it("uses payment_split when present on paid invoice", () => {
    assert.equal(
      invoiceRemaining({
        status: "paid",
        total: 20,
        payment_split: [{ method: "card", amount: 12 }, { method: "cash", amount: 8 }],
      }),
      0,
    )
  })

  it("returns remainder for open draft", () => {
    assert.equal(invoiceRemaining({ status: "draft", total: 15, payment_split: null }), 15)
  })

  it("subtracts partial split payments", () => {
    assert.equal(
      invoiceRemaining({
        status: "validated",
        total: 20,
        payment_split: [{ method: "cash", amount: 5 }],
      }),
      15,
    )
  })
})

describe("invoiceAmountPaid", () => {
  it("falls back to total when paid and split empty", () => {
    assert.equal(invoiceAmountPaid({ status: "paid", total: 10.71, payment_split: null }), 10.71)
  })
})
