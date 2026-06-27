#!/usr/bin/env node
/**
 * Upload Tea, Desserts & Shisha images → Supabase Storage + update products.image_url
 *
 * Usage:
 *   node --env-file=.env.local scripts/assign-bar-desserts-images.mjs
 */
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const BUCKET = "menu-product-images"
const SIZE = 1200

/** slug → [source subdir under data/menu-images, storage prefix under products/] */
const IMAGE_MAP = [
  ["schwarzer-tee", "tea", "tea"],
  ["gruen-tee", "tea", "tea"],
  ["ingwer-zitrone", "tea", "tea"],
  ["kamille-tee", "tea", "tea"],
  ["mate", "tea", "tea"],
  ["cumin-lemon-tea", "tea", "tea"],
  ["waffle-nature", "waffeln", "waffeln"],
  ["crepe-nature", "crepes", "crepes"],
  ["pancake-nature", "pancakes", "pancakes"],
  ["fruit-salad-bloudan", "fruit-salads", "fruit-salads"],
  ["fruit-salad-lotus", "fruit-salads", "fruit-salads"],
  ["fruit-salad-dubai", "fruit-salads", "fruit-salads"],
  ["chips-noix", "snacks", "snacks"],
  ["noix", "snacks", "snacks"],
  ["coupe-arabe", "ice-cream", "ice-cream"],
  ["eis-vanille", "ice-cream", "ice-cream"],
  ["eis-fraise", "ice-cream", "ice-cream"],
  ["eis-chocolat", "ice-cream", "ice-cream"],
  ["cheesecake-bloudan", "cheesecakes", "cheesecakes"],
  ["cheesecake-lotus", "cheesecakes", "cheesecakes"],
  ["cheesecake-dubai", "cheesecakes", "cheesecakes"],
  ["cheesecake-oreo", "cheesecakes", "cheesecakes"],
  ["molten-cake", "cakes", "cakes"],
  ["brownie-cake", "cakes", "cakes"],
  ["shisha-bloudan", "shisha", "shisha"],
  ["shisha-double-apple", "shisha", "shisha"],
  ["shisha-grape-mint", "shisha", "shisha"],
  ["shisha-love-66", "shisha", "shisha"],
  ["shisha-cinderella", "shisha", "shisha"],
  ["shisha-watermelon", "shisha", "shisha"],
  ["shisha-raffaello", "shisha", "shisha"],
  ["shisha-fruits", "shisha", "shisha"],
  ["shisha-polo", "shisha", "shisha"],
  ["shisha-royale", "shisha", "shisha"],
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.")
  process.exit(1)
}

const supabase = createClient(url, key)

async function prepareSquareWebp(srcPath) {
  if (!existsSync(srcPath)) throw new Error(`Image manquante: ${srcPath}`)
  return sharp(readFileSync(srcPath))
    .rotate()
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 88, effort: 4 })
    .toBuffer()
}

async function uploadAndLink(slug, prefix, buf) {
  const objectPath = `products/${prefix}/${slug}.webp`
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

console.log("🍵🍰💨  Tea / Desserts / Shisha — upload images\n")
let ok = 0
for (const [slug, srcDir, storagePrefix] of IMAGE_MAP) {
  const src = join(ROOT, "data/menu-images", srcDir, `${slug}.png`)
  try {
    const buf = await prepareSquareWebp(src)
    await uploadAndLink(slug, storagePrefix, buf)
    console.log(`  ✅  ${slug}  (${(buf.length / 1024).toFixed(0)} KB)`)
    ok++
  } catch (e) {
    console.error(`  ❌  ${slug}: ${e.message}`)
  }
}
console.log(`\nTerminé: ${ok}/${IMAGE_MAP.length} produits mis à jour.`)
