#!/usr/bin/env node
/**
 * Audit variant groups, variants, modifier groups, and modifiers for missing Arabic.
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-menu-bilingual-options.mjs
 */
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, key)

function missingAr(rows, label, nameField = "name_de") {
  const gaps = []
  for (const row of rows ?? []) {
    const de = String(row[nameField] ?? row.name ?? "").trim()
    const ar = String(row.name_ar ?? "").trim()
    if (de && !ar) gaps.push({ table: label, id: row.id, name_de: de })
  }
  return gaps
}

const tables = [
  ["product_variant_groups", "variant_groups"],
  ["product_variants", "variants"],
  ["product_modifier_groups", "modifier_groups"],
  ["product_modifiers", "modifiers"],
]

let allGaps = []

for (const [table, label] of tables) {
  const { data, error } = await supabase.from(table).select("id, name_de, name_ar")
  if (error) {
    console.error(`${table}: ${error.message}`)
    process.exit(1)
  }
  const gaps = missingAr(data, label)
  allGaps = allGaps.concat(gaps)
  console.log(`${label}: ${(data ?? []).length} rows, ${gaps.length} missing name_ar`)
}

if (allGaps.length === 0) {
  console.log("\n✓ All variant/modifier options have Arabic translations.")
  process.exit(0)
}

console.log(`\n⚠ ${allGaps.length} entries missing Arabic:\n`)
for (const g of allGaps.slice(0, 50)) {
  console.log(`  [${g.table}] ${g.name_de} (${g.id})`)
}
if (allGaps.length > 50) console.log(`  … and ${allGaps.length - 50} more`)
process.exit(1)
