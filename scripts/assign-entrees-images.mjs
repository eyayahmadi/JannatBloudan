#!/usr/bin/env node
/**
 * Upload Entrées product images → Supabase Storage + update products.image_url
 *
 * Usage:
 *   node --env-file=.env.local scripts/assign-entrees-images.mjs
 *
 * Expects square-ready sources in data/menu-images/entrees/{slug}.png
 * Outputs 1200×1200 WebP to Supabase bucket menu-product-images/products/entrees/
 */
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const SRC_DIR = join(ROOT, "data/menu-images/entrees")
const BUCKET = "menu-product-images"

const ENTREES_SLUGS = [
  "hummus",
  "hummus-mit-hackfleisch",
  "baba-ghanoug",
  "mutabbal",
  "muhammara",
  "veganer-weinblaetter",
  "zigarrenburak",
  "gewuerzter-reis",
  "pommes-teller",
  "chicken-nuggets-pommes",
  "kebbeh-frittiert",
  "gegrillte-kibbeh",
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
  if (!existsSync(src)) {
    throw new Error(`Image manquante: ${src}`)
  }
  const input = readFileSync(src)
  return sharp(input)
    .rotate()
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 88, effort: 4 })
    .toBuffer()
}

async function uploadAndLink(slug, buf) {
  const objectPath = `products/entrees/${slug}.webp`

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, buf, {
    contentType: "image/webp",
    upsert: true,
  })
  if (upErr) throw new Error(`Upload ${slug}: ${upErr.message}`)

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
  const imageUrl = pub.publicUrl

  const { error: dbErr } = await supabase.from("products").update({ image_url: imageUrl }).eq("slug", slug)
  if (dbErr) throw new Error(`DB ${slug}: ${dbErr.message}`)

  return imageUrl
}

console.log("🍽️  Entrées — upload images menu\n")

let ok = 0
for (const slug of ENTREES_SLUGS) {
  try {
    const buf = await prepareSquareWebp(slug)
    const imageUrl = await uploadAndLink(slug, buf)
    console.log(`  ✅  ${slug}  (${(buf.length / 1024).toFixed(0)} KB) → ${imageUrl}`)
    ok++
  } catch (e) {
    console.error(`  ❌  ${slug}: ${e.message}`)
  }
}

console.log(`\nTerminé: ${ok}/${ENTREES_SLUGS.length} produits mis à jour.`)
