#!/usr/bin/env node
/**
 * Upload Samoon sandwich images for Zinger, Fajita, Mexicano, Falafel only.
 *
 * Usage:
 *   node --env-file=.env.local scripts/assign-sandwich-samoon-images.mjs
 */
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const SRC_DIR = join(ROOT, "data/menu-images/sandwiches")
const BUCKET = "menu-product-images"

const SLUGS = ["zinger-sandwich", "fajita-sandwich", "mexicano-sandwich", "falafel-sandwich"]
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
  if (!existsSync(src)) throw new Error(`Missing image: ${src}`)
  return sharp(readFileSync(src))
    .rotate()
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 88, effort: 4 })
    .toBuffer()
}

async function uploadAndLink(slug, buf) {
  const objectPath = `products/sandwiches/${slug}.webp`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, buf, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "3600",
  })
  if (upErr) throw new Error(`Upload ${slug}: ${upErr.message}`)

  const cacheBust = `?v=${Date.now()}`
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
  const imageUrl = `${pub.publicUrl}${cacheBust}`

  const { error: dbErr } = await supabase.from("products").update({ image_url: imageUrl }).eq("slug", slug)
  if (dbErr) throw new Error(`DB ${slug}: ${dbErr.message}`)
  return imageUrl
}

console.log("🥪  Samoon sandwich images — Zinger, Fajita, Mexicano, Falafel\n")
let ok = 0
for (const slug of SLUGS) {
  try {
    const buf = await prepareSquareWebp(slug)
    const imageUrl = await uploadAndLink(slug, buf)
    console.log(`  ✅  ${slug}  (${(buf.length / 1024).toFixed(0)} KB)`)
    console.log(`      ${imageUrl}`)
    ok++
  } catch (e) {
    console.error(`  ❌  ${slug}: ${e.message}`)
  }
}
console.log(`\nDone: ${ok}/${SLUGS.length} products updated.`)
process.exit(ok === SLUGS.length ? 0 : 1)
