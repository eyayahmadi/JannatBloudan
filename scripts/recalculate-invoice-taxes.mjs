#!/usr/bin/env node
/**
 * Recalcule HT / TVA / TTC pour toutes les factures (prix menu = TTC).
 *
 * Usage:
 *   node --env-file=.env.local scripts/recalculate-invoice-taxes.mjs
 *   node --env-file=.env.local scripts/recalculate-invoice-taxes.mjs --dry-run
 */

import { createClient } from "@supabase/supabase-js"

const NON_BILLABLE = new Set(["cancelled", "waste", "refused", "replaced"])
const EPS = 0.02
const dryRun = process.argv.includes("--dry-run")

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function normalizeVatRatePercent(rate) {
  if (!Number.isFinite(rate) || rate < 0) return 19
  if (rate > 0 && rate < 1) return rate * 100
  return rate
}

function calculateTaxFromTtc(ttcAmount, vatRatePercent = 19) {
  if (!Number.isFinite(ttcAmount) || ttcAmount < 0) throw new Error("Invalid TTC")
  if (ttcAmount === 0) return { ht: 0, tva: 0, ttc: 0 }
  const rate = normalizeVatRatePercent(vatRatePercent)
  const ttcCents = Math.round((ttcAmount + Number.EPSILON) * 100)
  const htCents = Math.round(ttcCents / (1 + rate / 100))
  const tvaCents = ttcCents - htCents
  return { ht: htCents / 100, tva: tvaCents / 100, ttc: ttcCents / 100 }
}

function sumActiveSubtotal(items) {
  let s = 0
  for (const row of items) {
    const st = String(row.line_status ?? "").toLowerCase()
    if (NON_BILLABLE.has(st)) continue
    const sub = Number(row.subtotal ?? 0)
    if (Number.isFinite(sub)) s += sub
  }
  return roundMoney(s)
}

function deriveTotals(items, discountTtc, vatRate) {
  const gross = sumActiveSubtotal(items)
  const disc = Math.min(Math.max(0, Number(discountTtc) || 0), gross)
  const payable = roundMoney(Math.max(0, gross - disc))
  const breakdown = calculateTaxFromTtc(payable, vatRate)
  return {
    grossTtc: gross,
    subtotalHt: breakdown.ht,
    discount_amount: disc,
    tva_amount: breakdown.tva,
    total: breakdown.ttc,
  }
}

function needsRefresh(inv, items, vatRate) {
  const expected = deriveTotals(items, inv.discount_amount ?? 0, vatRate)
  return (
    Math.abs(Number(inv.total ?? 0) - expected.total) > EPS ||
    Math.abs(Number(inv.subtotal ?? 0) - expected.subtotalHt) > EPS ||
    Math.abs(Number(inv.tva_amount ?? 0) - expected.tva_amount) > EPS ||
    Math.abs(Number(inv.gross_before_discount ?? 0) - expected.grossTtc) > EPS
  )
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, key)

const { data: invoices, error } = await supabase
  .from("invoices")
  .select("id, status, subtotal, tva_rate, tva_amount, discount_amount, total, gross_before_discount, invoice_items(subtotal, line_status)")
  .not("status", "in", '("cancelled","refunded")')

if (error) {
  console.error(error.message)
  process.exit(1)
}

let updated = 0
let skipped = 0

for (const inv of invoices ?? []) {
  const items = inv.invoice_items ?? []
  if (!items.length) {
    skipped += 1
    continue
  }
  const vatRate = Number(inv.tva_rate ?? 0.19)
  if (!needsRefresh(inv, items, vatRate)) {
    skipped += 1
    continue
  }

  const totals = deriveTotals(items, inv.discount_amount ?? 0, vatRate)
  console.log(
    `${dryRun ? "[dry-run] " : ""}${inv.id}: total ${inv.total} → ${totals.total}, HT ${inv.subtotal} → ${totals.subtotalHt}`,
  )

  if (!dryRun) {
    const { error: upErr } = await supabase
      .from("invoices")
      .update({
        subtotal: totals.subtotalHt,
        discount_amount: totals.discount_amount,
        tva_amount: totals.tva_amount,
        total: totals.total,
        gross_before_discount: totals.grossTtc,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inv.id)
    if (upErr) {
      console.error(`  failed: ${upErr.message}`)
      continue
    }
  }
  updated += 1
}

console.log(`Done. Updated: ${updated}, unchanged/skipped: ${skipped}${dryRun ? " (dry-run)" : ""}`)
