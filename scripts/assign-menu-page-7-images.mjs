#!/usr/bin/env node
/**
 * Upload Page 7 dessert images → Supabase Storage
 * Sets image_url ONLY when missing or placeholder.
 *
 * Usage:
 *   node --env-file=.env.local scripts/assign-menu-page-7-images.mjs
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
  { slug: "pan-cake-bloudan", folder: "pancakes" },
  { slug: "pan-cake-lotus", folder: "pancakes" },
  { slug: "pan-cake-dubai", folder: "pancakes" },
  { slug: "bloudan-eisbecher", folder: "ice-cream" },
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.")
  process.exit(1)
}

const supabase = createClient(url, key)

function isMissingImage(imageUrl) {
  if (!imageUrl) return true
  const u = imageUrl.trim()
  return u === "" || u === "/placeholder.svg" || u.includes("placeholder")
}

async function prepareSquareWebp(srcPath) {
  return sharp(readFileSync(srcPath))
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
  const { error: dbErr } = await supabase
    .from("products")
    .update({ image_url: pub.publicUrl })
    .eq("slug", slug)
  if (dbErr) throw new Error(`DB ${slug}: ${dbErr.message}`)
  return pub.publicUrl
}

console.log("🍰  Menu Page 7 — dessert images (new products only)\n")

let ok = 0
let skipped = 0

for (const { slug, folder } of PRODUCTS) {
  const { data: row, error: fetchErr } = await supabase
    .from("products")
    .select("image_url")
    .eq("slug", slug)
    .maybeSingle()
  if (fetchErr) {
    console.error(`  ❌  ${slug}: ${fetchErr.message}`)
    continue
  }
  if (!row) {
    console.warn(`  ⚠️  ${slug}: produit introuvable en base`)
    continue
  }
  if (!isMissingImage(row.image_url)) {
    console.log(`  ⏭️  ${slug}: image existante conservée`)
    skipped++
    continue
  }

  const src = join(ROOT, "data/menu-images", folder, `${slug}.png`)
  if (!existsSync(src)) {
    console.warn(`  ⚠️  ${slug}: source manquante (${src})`)
    continue
  }

  try {
    const buf = await prepareSquareWebp(src)
    await uploadAndLink(slug, folder, buf)
    console.log(`  ✅  ${slug}  (${(buf.length / 1024).toFixed(0)} KB)`)
    ok++
  } catch (e) {
    console.error(`  ❌  ${slug}: ${e.message}`)
  }
}

console.log(`\nTerminé: ${ok} upload(s), ${skipped} conservé(s).`)
