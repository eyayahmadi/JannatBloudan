#!/usr/bin/env node
/**
 * Upload Pizza product images → Supabase Storage + update products.image_url
 *
 * Usage:
 *   node --env-file=.env.local scripts/assign-pizza-images.mjs
 */
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const SRC_DIR = join(ROOT, "data/menu-images/pizza")
const BUCKET = "menu-product-images"

const PIZZA_SLUGS = [
  "pizza-margherita",
  "pizza-quattro-stagioni",
  "pizza-hollandaise",
  "pizza-sucuk-ei",
  "pizza-mozzarella-tomaten",
  "pizza-vegetarisch",
  "pizza-putenmortadella",
  "pizza-mexikano",
  "pizza-salami",
  "pizza-tonno",
]

const SIZE = 1200

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.")
  process.exit(1)
}

const supabase = createClient(url, key)

async function prepareSquareWebp(slug) {
  const src = join(SRC_DIR, `${slug}.png`)
  if (!existsSync(src)) throw new Error(`Image manquante: ${src}`)
  return sharp(readFileSync(src))
    .rotate()
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 88, effort: 4 })
    .toBuffer()
}

async function uploadAndLink(slug, buf) {
  const objectPath = `products/pizza/${slug}.webp`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, buf, {
    contentType: "image/webp",
    upsert: true,
  })
  if (upErr) throw new Error(`Upload ${slug}: ${upErr.message}`)
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
  const { error: dbErr } = await supabase.from("products").update({ image_url: pub.publicUrl }).eq("slug", slug)
  if (dbErr) throw new Error(`DB ${slug}: ${dbErr.message}`)
  return pub.publicUrl
}

console.log("🍕  Pizza — upload images menu\n")
let ok = 0
for (const slug of PIZZA_SLUGS) {
  try {
    const buf = await prepareSquareWebp(slug)
    await uploadAndLink(slug, buf)
    console.log(`  ✅  ${slug}  (${(buf.length / 1024).toFixed(0)} KB)`)
    ok++
  } catch (e) {
    console.error(`  ❌  ${slug}: ${e.message}`)
  }
}
console.log(`\nTerminé: ${ok}/${PIZZA_SLUGS.length} produits mis à jour.`)
