#!/usr/bin/env node
import pg from "pg"
import fs from "fs"

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await db.connect()

const GARBAGE = /heart began|amount that has been paid|Emoji Cheat|lorem ipsum|<\/?[a-z]|svg|xml/i

const { rows } = await db.query(`
  SELECT p.slug, p.name, p.name_ar, p.description, p.description_ar, c.slug AS cat, c.display_order, p.display_order AS prod_order
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  ORDER BY c.display_order NULLS LAST, p.display_order, p.name
`)

console.log("Total:", rows.length)
const bad = rows.filter((r) =>
  GARBAGE.test(`${r.name}${r.name_ar}${r.description}${r.description_ar}`),
)
console.log("Garbage:", bad.length)
bad.forEach((r) => console.log(r.slug, "|", r.name, "|", (r.description || "").slice(0, 80)))

const menu = JSON.parse(fs.readFileSync("data/jannat-bloudan-menu.json", "utf8"))
const bySlug = new Map(menu.products.map((p) => [p.slug, p]))

let nameMismatch = 0
for (const r of rows) {
  const exp = bySlug.get(r.slug)
  if (!exp) continue
  if (r.name !== exp.name || r.name_ar !== exp.name_ar) {
    nameMismatch++
    if (nameMismatch <= 30) console.log("NAME", r.slug, "DB:", r.name, "JSON:", exp.name)
  }
}

const { rows: cats } = await db.query(
  `SELECT slug, name, name_ar, display_order, section FROM categories WHERE is_active=true ORDER BY display_order`,
)
console.log("\nCategories:")
cats.forEach((c) => console.log(c.display_order, c.slug, c.name, c.name_ar))

await db.end()
