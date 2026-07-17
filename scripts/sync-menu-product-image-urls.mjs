#!/usr/bin/env node
/**
 * Restore products.image_url from files already in Supabase Storage.
 * Use after migrations accidentally reset image_url to /placeholder.svg.
 *
 * Usage:
 *   node --env-file=.env.local scripts/sync-menu-product-image-urls.mjs
 */
import { createClient } from "@supabase/supabase-js"

const BUCKET = "menu-product-images"
const PREFIXES = ["products/manakish", "products/entrees", "products/salades", "products/plats", "products/shawarma", "products/grillades", "products/pizza", "products/burgers", "products/sandwiches", "products/tajine", "products/hauptgerichte", "products/tea", "products/waffeln", "products/crepes", "products/pancakes", "products/fruit-salads", "products/snacks", "products/ice-cream", "products/cheesecakes", "products/cakes", "products/shisha", "products/water", "products/juices", "products/soft-drinks", "products/ice-tea", "products/cocktails", "products/smoothies", "products/milkshakes", "products/banana-milk-cocktails", "products/iced-coffee", "products/coffee", "products/imperator"]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.")
  process.exit(1)
}

const supabase = createClient(url, key)

function slugFromStorageName(name) {
  return name.replace(/\.webp$/i, "").replace(/\.(png|jpe?g)$/i, "")
}

async function listAll(prefix) {
  const out = []
  let offset = 0
  const limit = 100
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit, offset })
    if (error) throw new Error(`${prefix}: ${error.message}`)
    if (!data?.length) break
    out.push(...data.filter((f) => f.name && !f.name.startsWith(".")))
    if (data.length < limit) break
    offset += limit
  }
  return out
}

console.log("🖼️  Sync product image_url from Supabase Storage\n")

let ok = 0
let missing = 0

for (const prefix of PREFIXES) {
  const files = await listAll(prefix)
  console.log(`  ${prefix}: ${files.length} fichier(s)`)

  for (const file of files) {
    const slug = slugFromStorageName(file.name)
    const objectPath = `${prefix}/${file.name}`
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
    const imageUrl = pub.publicUrl

    const { data: row, error: selErr } = await supabase.from("products").select("id, image_url").eq("slug", slug).maybeSingle()
    if (selErr) {
      console.error(`  ❌  ${slug}: ${selErr.message}`)
      continue
    }
    if (!row) {
      console.warn(`  ⚠  ${slug}: produit introuvable en base`)
      missing++
      continue
    }
    if (row.image_url === imageUrl) {
      console.log(`  ⏭  ${slug} (déjà à jour)`)
      ok++
      continue
    }

    const { error: upErr } = await supabase.from("products").update({ image_url: imageUrl }).eq("id", row.id)
    if (upErr) {
      console.error(`  ❌  ${slug}: ${upErr.message}`)
      continue
    }
    console.log(`  ✅  ${slug}`)
    ok++
  }
}

// Verify public HTTP access for one linked image
const { data: sample } = await supabase
  .from("products")
  .select("slug, image_url")
  .like("image_url", "%supabase%")
  .limit(1)
  .maybeSingle()

if (sample?.image_url) {
  try {
    const res = await fetch(sample.image_url, { method: "HEAD" })
    console.log(`\n  HTTP ${res.status} — ${sample.slug} (${sample.image_url.slice(0, 72)}…)`)
  } catch (e) {
    console.warn("\n  ⚠  HEAD check failed:", e instanceof Error ? e.message : e)
  }
}

console.log(`\nTerminé: ${ok} liens image_url, ${missing} slug(s) sans produit.`)
