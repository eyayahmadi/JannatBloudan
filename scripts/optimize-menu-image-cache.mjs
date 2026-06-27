#!/usr/bin/env node
/**
 * Re-apply Cache-Control headers on all menu product images in Storage.
 * Downloads each WebP and re-uploads with upsert + cacheControl (no DB changes if URL unchanged).
 *
 * Usage: node --env-file=.env.local scripts/optimize-menu-image-cache.mjs
 */
import { createClient } from "@supabase/supabase-js"
import { MENU_IMAGE_BUCKET, MENU_IMAGE_CACHE_CONTROL } from "./lib/menu-image-upload.mjs"

const PREFIXES = [
  "products/manakish", "products/entrees", "products/salades", "products/plats",
  "products/shawarma", "products/grillades", "products/pizza", "products/burgers",
  "products/sandwiches", "products/tea", "products/waffeln", "products/crepes",
  "products/pancakes", "products/fruit-salads", "products/snacks", "products/ice-cream",
  "products/cheesecakes", "products/cakes", "products/shisha", "products/water",
  "products/juices", "products/soft-drinks", "products/ice-tea", "products/cocktails",
  "products/smoothies", "products/milkshakes", "products/banana-milk-cocktails",
  "products/iced-coffee", "products/coffee", "products/imperator",
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.")
  process.exit(1)
}

const supabase = createClient(url, key)

async function listAll(prefix) {
  const out = []
  let offset = 0
  for (;;) {
    const { data, error } = await supabase.storage.from(MENU_IMAGE_BUCKET).list(prefix, { limit: 100, offset })
    if (error) throw error
    if (!data?.length) break
    out.push(...data.filter((f) => f.name && !f.name.startsWith(".")))
    if (data.length < 100) break
    offset += 100
  }
  return out
}

console.log("🗄️  Optimizing menu image cache headers\n")
let ok = 0
let skipped = 0

for (const prefix of PREFIXES) {
  const files = await listAll(prefix)
  if (!files.length) continue
  console.log(`${prefix}: ${files.length} file(s)`)

  for (const file of files) {
    const objectPath = `${prefix}/${file.name}`
    const { data: blob, error: dlErr } = await supabase.storage.from(MENU_IMAGE_BUCKET).download(objectPath)
    if (dlErr || !blob) {
      console.error(`  ❌  download ${objectPath}: ${dlErr?.message}`)
      continue
    }
    const buf = Buffer.from(await blob.arrayBuffer())
    const { error: upErr } = await supabase.storage.from(MENU_IMAGE_BUCKET).upload(objectPath, buf, {
      contentType: file.name.endsWith(".webp") ? "image/webp" : "image/png",
      cacheControl: MENU_IMAGE_CACHE_CONTROL,
      upsert: true,
    })
    if (upErr) {
      console.error(`  ❌  upload ${objectPath}: ${upErr.message}`)
      continue
    }
    ok++
  }
}

console.log(`\nDone: ${ok} object(s) refreshed with Cache-Control max-age=${MENU_IMAGE_CACHE_CONTROL}`)
