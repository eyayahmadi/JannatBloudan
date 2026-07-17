#!/usr/bin/env node
/**
 * Upload Tajine + Hauptgerichte images → Supabase Storage + products.image_url
 *
 * Usage:
 *   node --env-file=.env.local scripts/assign-tajine-hauptgerichte-images.mjs
 *
 * Expects PNG sources:
 *   data/menu-images/tajine/{slug}.png
 *   data/menu-images/hauptgerichte/{slug}.png
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

const PRODUCTS = [
  { slug: "tajine-kebab-hindi-mit-weissem-reis", folder: "tajine" },
  { slug: "tajine-mandi-mit-lammfleisch", folder: "tajine" },
  { slug: "tajine-mandi-mit-haehnchen", folder: "tajine" },
  { slug: "tajine-shish", folder: "tajine" },
  { slug: "tajine-lahmeh-bil-sahn-mit-tomaten", folder: "tajine" },
  { slug: "tajine-lahmeh-bil-sahn-mit-tahini", folder: "tajine" },
  { slug: "shakriyeh-mit-weissem-reis", folder: "hauptgerichte" },
  { slug: "kibbeh-labaniyeh-mit-weissem-reis", folder: "hauptgerichte" },
  { slug: "shish-barak", folder: "hauptgerichte" },
  { slug: "basha-wa-asakro", folder: "hauptgerichte" },
  { slug: "jaddi-bil-zeit", folder: "hauptgerichte" },
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.")
  process.exit(1)
}

const supabase = createClient(url, key)

async function prepareSquareWebp(slug, folder) {
  const src = join(ROOT, "data/menu-images", folder, `${slug}.png`)
  if (!existsSync(src)) throw new Error(`Image manquante: ${src}`)
  return sharp(readFileSync(src))
    .rotate()
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 88, effort: 4 })
    .toBuffer()
}

async function uploadAndLink(slug, folder, buf) {
  const objectPath = `products/${folder}/${slug}.webp`
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

console.log("🍲  Tajine + Hauptgerichte — upload images menu\n")
let ok = 0
for (const { slug, folder } of PRODUCTS) {
  try {
    const buf = await prepareSquareWebp(slug, folder)
    await uploadAndLink(slug, folder, buf)
    console.log(`  ✅  ${slug}  (${(buf.length / 1024).toFixed(0)} KB)`)
    ok++
  } catch (e) {
    console.error(`  ❌  ${slug}: ${e.message}`)
  }
}
console.log(`\nTerminé: ${ok}/${PRODUCTS.length} produits mis à jour.`)
