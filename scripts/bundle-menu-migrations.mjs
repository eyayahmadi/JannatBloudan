#!/usr/bin/env node
/**
 * Bundle menu migrations for Supabase SQL Editor (when pooler auth is broken).
 *
 * Usage:
 *   node scripts/bundle-menu-migrations.mjs
 *
 * Output:
 *   scripts/APPLY-MENU-MIGRATIONS-69-79.sql
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const here = __dirname

const FILES = [
  "FIX-LEGACY-CATEGORY-NAMES.sql",
  "69-menu-unified-catalog.sql",
  "70-menu-page-1-vorspeisen-salate.sql",
  "71-menu-page-2-burger-kleine-saj.sql",
  "72-menu-page-3-hauptgerichte-menu.sql",
  "73-menu-page-4-grillgerichte.sql",
  "74-menu-page-5-manakish-saj.sql",
  "75-menu-page-6-pizza.sql",
  "76-menu-page-7-desserts.sql",
  "77-menu-page-8-waffel-crepes-cocktails.sql",
  "78-menu-page-9-smoothies-milkshakes-drinks.sql",
  "79-menu-page-10-heissgetraenke-tee.sql",
]

const parts = [
  "-- =============================================================================",
  "-- APPLY MENU MIGRATIONS 69–79 (paste in Supabase Dashboard → SQL Editor → Run)",
  "-- Safe to re-run: each migration uses idempotent UPDATE/INSERT ON CONFLICT.",
  "-- After success, schema_migrations rows are inserted at the bottom.",
  "-- =============================================================================",
  "",
]

for (const file of FILES) {
  const sql = readFileSync(join(here, file), "utf8").trim()
  parts.push(`-- ── ${file} ──`, sql, "")
}

parts.push(
  "-- Mark as applied (skip if schema_migrations does not exist yet — run once)",
  "CREATE TABLE IF NOT EXISTS schema_migrations (",
  "  filename TEXT PRIMARY KEY,",
  "  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()",
  ");",
  "",
  "INSERT INTO schema_migrations (filename) VALUES",
  ...FILES.map((f, i) => `  ('${f}')${i < FILES.length - 1 ? "," : ""}`),
  "ON CONFLICT (filename) DO NOTHING;",
  "",
)

const out = join(here, "APPLY-MENU-MIGRATIONS-69-79.sql")
writeFileSync(out, parts.join("\n"), "utf8")
console.log(`✅  Bundled ${FILES.length} files → ${out}`)
console.log("   Open Supabase Dashboard → SQL → New query → paste file → Run")
