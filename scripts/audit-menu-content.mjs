#!/usr/bin/env node
/**
 * Full menu content audit: names, descriptions, tags, recommendations, images, categories.
 * Usage: node --env-file=.env.local scripts/audit-menu-content.mjs
 */
import pg from "pg"

const { Client } = pg
const dbUrl = process.env.DATABASE_URL ?? ""
const useSsl =
  process.env.PGSSLMODE === "require" ||
  (dbUrl.includes("supabase.co") && process.env.PGSSLMODE !== "disable")
const db = new Client({
  connectionString: dbUrl,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
})

function isBlank(v) {
  return v == null || String(v).trim() === ""
}

function isBadImage(url) {
  if (isBlank(url)) return true
  const u = String(url).trim()
  return u === "/placeholder.svg" || u.endsWith("/placeholder.svg")
}

await db.connect()

const { rows: products } = await db.query(`
  SELECT
    p.id,
    p.slug,
    p.name,
    p.name_ar,
    p.description,
    p.description_ar,
    p.image_url,
    p.tags,
    p.category_id,
    c.slug AS category_slug,
    c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  ORDER BY c.display_order NULLS LAST, p.display_order NULLS LAST, p.name
`)

const { rows: recs } = await db.query(`
  SELECT product_id, COUNT(*)::int AS cnt
  FROM product_recommendations
  GROUP BY product_id
`)
const recCount = new Map(recs.map((r) => [r.product_id, r.cnt]))

const { rows: categories } = await db.query(`
  SELECT id, slug, name FROM categories ORDER BY display_order NULLS LAST, name
`)

const issues = {
  missing_name_ar: [],
  missing_description: [],
  missing_description_ar: [],
  missing_tags: [],
  missing_recommendations: [],
  missing_image: [],
  broken_image: [],
  missing_category: [],
}

const ok = []

for (const p of products) {
  const local = []
  if (isBlank(p.name_ar)) local.push("name_ar")
  if (isBlank(p.description)) local.push("description")
  if (isBlank(p.description_ar)) local.push("description_ar")
  const tags = Array.isArray(p.tags) ? p.tags : typeof p.tags === "string" ? JSON.parse(p.tags || "[]") : []
  if (!tags.length) local.push("tags")
  if ((recCount.get(p.id) ?? 0) === 0) local.push("recommendations")
  if (!p.category_id) local.push("category")
  if (isBadImage(p.image_url)) local.push("image_url")

  if (local.length) {
    for (const k of local) {
      if (k === "name_ar") issues.missing_name_ar.push(p.slug)
      else if (k === "description") issues.missing_description.push(p.slug)
      else if (k === "description_ar") issues.missing_description_ar.push(p.slug)
      else if (k === "tags") issues.missing_tags.push(p.slug)
      else if (k === "recommendations") issues.missing_recommendations.push(p.slug)
      else if (k === "category") issues.missing_category.push(p.slug)
      else if (k === "image_url") issues.missing_image.push(p.slug)
    }
  } else {
    ok.push(p)
  }
}

console.log(`\n📋 Menu content audit — ${products.length} products\n`)

for (const p of products.filter((x) => !isBadImage(x.image_url))) {
  try {
    const res = await fetch(p.image_url, { method: "HEAD", redirect: "follow" })
    if (res.status >= 400) issues.broken_image.push({ slug: p.slug, status: res.status })
  } catch (e) {
    issues.broken_image.push({ slug: p.slug, status: e.message })
  }
}

const catsWithProducts = new Set(products.filter((p) => p.category_id).map((p) => p.category_id))
const emptyCategories = categories.filter((c) => !catsWithProducts.has(c.id))

console.log(`✅ Complete: ${ok.length}/${products.length}`)
console.log(`⚠️  Missing name_ar: ${issues.missing_name_ar.length}`)
console.log(`⚠️  Missing description: ${issues.missing_description.length}`)
console.log(`⚠️  Missing description_ar: ${issues.missing_description_ar.length}`)
console.log(`⚠️  Missing tags: ${issues.missing_tags.length}`)
console.log(`⚠️  Missing recommendations: ${issues.missing_recommendations.length}`)
console.log(`⚠️  Missing/placeholder image: ${issues.missing_image.length}`)
console.log(`⚠️  Broken image HTTP: ${issues.broken_image.length}`)
console.log(`⚠️  Products without category: ${issues.missing_category.length}`)
console.log(`⚠️  Empty categories: ${emptyCategories.length}`)

function printList(title, list, limit = 15) {
  if (!list.length) return
  console.log(`\n--- ${title} (${list.length}) ---`)
  list.slice(0, limit).forEach((x) => console.log(`  ${typeof x === "string" ? x : `${x.slug} (${x.status})`}`))
  if (list.length > limit) console.log(`  … and ${list.length - limit} more`)
}

printList("Missing name_ar", issues.missing_name_ar)
printList("Missing description_ar", issues.missing_description_ar)
printList("Missing tags", issues.missing_tags)
printList("Missing recommendations", issues.missing_recommendations)
printList("Missing images", issues.missing_image)
printList("Broken images", issues.broken_image)

if (emptyCategories.length) {
  console.log(`\n--- Empty categories (${emptyCategories.length}) ---`)
  emptyCategories.forEach((c) => console.log(`  ${c.slug}`))
}

const failCount =
  issues.missing_name_ar.length +
  issues.missing_description.length +
  issues.missing_description_ar.length +
  issues.missing_tags.length +
  issues.missing_recommendations.length +
  issues.missing_image.length +
  issues.broken_image.length +
  issues.missing_category.length

await db.end()
process.exit(failCount > 0 ? 1 : 0)
