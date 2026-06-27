#!/usr/bin/env node
/**
 * Audit all product image_url values.
 * Usage: node --env-file=.env.local scripts/audit-product-images.mjs
 */
import pg from "pg"
import { createClient } from "@supabase/supabase-js"

const { Client } = pg
const dbUrl = process.env.DATABASE_URL ?? ""
const useSsl =
  process.env.PGSSLMODE === "require" ||
  (dbUrl.includes("supabase.co") && process.env.PGSSLMODE !== "disable")
const db = new Client({
  connectionString: dbUrl,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
})

function isBadUrl(url) {
  if (!url || !String(url).trim()) return true
  const u = String(url).trim()
  if (u === "/placeholder.svg" || u.endsWith("/placeholder.svg")) return true
  return false
}

await db.connect()
const { rows } = await db.query(`
  SELECT p.slug, p.name, c.slug AS category, p.image_url
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  ORDER BY c.display_order NULLS LAST, p.display_order NULLS LAST, p.name
`)

const missing = []
const broken = []
const ok = []

async function headOk(url, retries = 3) {
  let lastErr
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" })
      if (res.status < 400) return res.status
      lastErr = new Error(`HTTP ${res.status}`)
    } catch (e) {
      lastErr = e
    }
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)))
  }
  throw lastErr
}

for (const r of rows) {
  if (isBadUrl(r.image_url)) {
    missing.push(r)
    continue
  }
  try {
    await headOk(r.image_url)
    ok.push(r)
  } catch (e) {
    broken.push({ ...r, status: e.message })
  }
}

console.log(`Total: ${rows.length} | OK: ${ok.length} | Missing/placeholder: ${missing.length} | Broken HTTP: ${broken.length}`)
if (missing.length) {
  console.log("\n--- Missing / placeholder ---")
  missing.forEach((r) => console.log(`  ${r.slug} (${r.category})`))
}
if (broken.length) {
  console.log("\n--- Broken ---")
  broken.forEach((r) => console.log(`  ${r.slug} (${r.status})`))
}

await db.end()
