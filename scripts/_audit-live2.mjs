#!/usr/bin/env node
import pg from "pg"
const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
await db.connect()
const r = await db.query(`
  SELECT p.slug, p.name, p.name_ar, c.slug AS cat
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE p.name IN ('Burger','Bloudan','Dubai','Lotus','1kg','Vanille','Polo','Love 66','Fraise','Chocolat','Oreo')
  ORDER BY c.slug, p.slug
`)
console.log("short exact names:", r.rows.length)
r.rows.forEach((x) => console.log(x.cat, x.slug, "|", x.name))

const tc = await db.query(`
  SELECT left(source_text, 80) AS s, left(translated_text, 100) AS t, target_lang
  FROM translation_cache
  WHERE translated_text ILIKE '%heart began%'
     OR source_text ILIKE '%heart began%'
     OR translated_text ILIKE '%amount that has been paid%'
     OR source_text ILIKE '%amount that has been paid%'
  LIMIT 20
`)
console.log("\ntranslation_cache garbage:", tc.rows.length)
tc.rows.forEach((x) => console.log(x))

const extra = await db.query(`
  SELECT slug, name FROM products
  WHERE name ILIKE '%heart%' OR description ILIKE '%heart%'
     OR name ILIKE '%amount that has been paid%'
     OR description ILIKE '%paid (including%'
  LIMIT 20
`)
console.log("\nproduct garbage:", extra.rows.length)
extra.rows.forEach((x) => console.log(x))

await db.end()
