#!/usr/bin/env node
/**
 * Production readiness audit for the menu module.
 * Usage: node --env-file=.env.local scripts/audit-menu-production.mjs
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

const COMPLEMENTARY_SECTIONS = {
  food: new Set(["drinks", "desserts"]),
  drinks: new Set(["food", "desserts"]),
  desserts: new Set(["drinks", "food"]),
  special: new Set(["drinks", "desserts", "food"]),
}

function isBlank(v) {
  return v == null || String(v).trim() === ""
}

function isBadImage(url) {
  if (isBlank(url)) return true
  const u = String(url).trim()
  return u === "/placeholder.svg" || u.endsWith("/placeholder.svg")
}

function parseTags(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw || "[]")
    } catch {
      return []
    }
  }
  return []
}

await db.connect()

const { rows: products } = await db.query(`
  SELECT
    p.id, p.slug, p.name, p.name_ar, p.description, p.description_ar,
    p.image_url, p.tags, p.price, p.station, p.category_id,
    c.slug AS category_slug, c.section, c.is_active AS category_active
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  ORDER BY c.display_order NULLS LAST, p.display_order NULLS LAST, p.name
`)

const { rows: categories } = await db.query(`
  SELECT id, slug, name, is_active FROM categories ORDER BY display_order NULLS LAST, name
`)

const { rows: recRows } = await db.query(`
  SELECT
    pr.product_id,
    pr.recommended_product_id,
    p.slug AS product_slug,
    rp.slug AS rec_slug,
    p.category_id AS product_cat,
    rp.category_id AS rec_cat,
    cp.section AS product_section,
    cr.section AS rec_section
  FROM product_recommendations pr
  JOIN products p ON p.id = pr.product_id
  LEFT JOIN products rp ON rp.id = pr.recommended_product_id
  LEFT JOIN categories cp ON cp.id = p.category_id
  LEFT JOIN categories cr ON cr.id = rp.category_id
`)

const productById = new Map(products.map((p) => [p.id, p]))
const recCount = new Map()
for (const p of products) recCount.set(p.id, 0)
for (const r of recRows) {
  recCount.set(r.product_id, (recCount.get(r.product_id) ?? 0) + 1)
}

const issues = {
  missing_name_ar: [],
  missing_description: [],
  missing_description_ar: [],
  missing_tags: [],
  missing_recommendations: [],
  missing_image: [],
  broken_image: [],
  missing_category: [],
  invalid_category: [],
  missing_station: [],
  missing_price: [],
  duplicate_name_in_category: [],
  self_recommendations: [],
  orphan_recommendations: [],
  same_category_only_recs: [],
}

for (const p of products) {
  if (isBlank(p.name_ar)) issues.missing_name_ar.push(p.slug)
  if (isBlank(p.description)) issues.missing_description.push(p.slug)
  if (isBlank(p.description_ar)) issues.missing_description_ar.push(p.slug)
  if (!parseTags(p.tags).length) issues.missing_tags.push(p.slug)
  if ((recCount.get(p.id) ?? 0) === 0) issues.missing_recommendations.push(p.slug)
  if (isBadImage(p.image_url)) issues.missing_image.push(p.slug)
  if (!p.category_id) issues.missing_category.push(p.slug)
  else if (p.category_active === false) issues.invalid_category.push(p.slug)
  if (isBlank(p.station)) issues.missing_station.push(p.slug)
  if (p.price == null || Number(p.price) < 0) issues.missing_price.push(p.slug)
}

for (const p of products.filter((x) => !isBadImage(x.image_url))) {
  let ok = false
  let lastErr = "fetch failed"
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(p.image_url, { method: "HEAD", redirect: "follow" })
      if (res.status >= 400) {
        lastErr = `HTTP ${res.status}`
      } else {
        ok = true
        break
      }
    } catch (e) {
      lastErr = e.message
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
  }
  if (!ok) issues.broken_image.push({ slug: p.slug, status: lastErr })
}

const { rows: dupNames } = await db.query(`
  SELECT c.slug AS category, p.name, COUNT(*)::int AS cnt
  FROM products p
  JOIN categories c ON c.id = p.category_id
  GROUP BY c.slug, LOWER(TRIM(p.name)), p.name
  HAVING COUNT(*) > 1
`)
for (const d of dupNames) {
  issues.duplicate_name_in_category.push(`${d.name} (${d.category}) x${d.cnt}`)
}

for (const r of recRows) {
  if (r.product_id === r.recommended_product_id) {
    issues.self_recommendations.push(r.product_slug)
  }
  if (!r.rec_slug) {
    issues.orphan_recommendations.push(`${r.product_slug} → missing product ${r.recommended_product_id}`)
  }
}

for (const p of products) {
  const recs = recRows.filter((r) => r.product_id === p.id && r.rec_slug)
  if (recs.length === 0) continue
  const section = p.section ?? "food"
  const complementary = COMPLEMENTARY_SECTIONS[section] ?? COMPLEMENTARY_SECTIONS.food
  const hasComplementary = recs.some((r) => complementary.has(r.rec_section ?? "food"))
  const allSameCat = recs.every((r) => r.rec_cat === p.category_id)
  if (allSameCat && !hasComplementary && recs.length >= 2) {
    issues.same_category_only_recs.push(p.slug)
  }
}

const activeCatIds = new Set(categories.filter((c) => c.is_active).map((c) => c.id))
const emptyLegacy = categories.filter(
  (c) => !activeCatIds.has(c.id) || c.is_active === false,
)
const emptyActive = categories.filter(
  (c) => c.is_active !== false && !products.some((p) => p.category_id === c.id),
)

console.log("\n🏁 Menu production audit\n")
console.log(`Products: ${products.length}`)

const counts = Object.entries(issues).map(([k, v]) => [k, v.length])
for (const [k, n] of counts) {
  const icon = n === 0 ? "✅" : "⚠️ "
  console.log(`${icon} ${k}: ${n}`)
}

function printList(title, list, limit = 12) {
  if (!list.length) return
  console.log(`\n--- ${title} (${list.length}) ---`)
  list.slice(0, limit).forEach((x) =>
    console.log(`  ${typeof x === "string" ? x : `${x.slug} (${x.status})`}`),
  )
  if (list.length > limit) console.log(`  … +${list.length - limit} more`)
}

printList("Missing name_ar", issues.missing_name_ar)
printList("Missing description_ar", issues.missing_description_ar)
printList("Missing tags", issues.missing_tags)
printList("Missing recommendations", issues.missing_recommendations)
printList("Missing images", issues.missing_image)
printList("Broken images", issues.broken_image)
printList("Invalid/inactive category", issues.invalid_category)
printList("Duplicate names", issues.duplicate_name_in_category)
printList("Self recommendations", issues.self_recommendations)
printList("Orphan recommendations", issues.orphan_recommendations)
printList("Same-category-only recs (info)", issues.same_category_only_recs)

if (emptyActive.length) {
  console.log(`\n--- Empty active categories (${emptyActive.length}) ---`)
  emptyActive.forEach((c) => console.log(`  ${c.slug}${c.is_active === false ? " [inactive]" : ""}`))
}

const blocking =
  issues.missing_name_ar.length +
  issues.missing_description.length +
  issues.missing_description_ar.length +
  issues.missing_tags.length +
  issues.missing_recommendations.length +
  issues.missing_image.length +
  issues.broken_image.length +
  issues.missing_category.length +
  issues.invalid_category.length +
  issues.missing_station.length +
  issues.missing_price.length +
  issues.duplicate_name_in_category.length +
  issues.self_recommendations.length +
  issues.orphan_recommendations.length

console.log(blocking === 0 ? "\n✅ Production audit PASSED\n" : `\n❌ Production audit FAILED (${blocking} blocking issues)\n`)

await db.end()
process.exit(blocking === 0 ? 0 : 1)
