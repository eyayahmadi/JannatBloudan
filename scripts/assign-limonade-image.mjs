#!/usr/bin/env node
/**
 * Upload Limonade image → Supabase Storage
 * Sets image_url ONLY when missing or placeholder.
 *
 * Usage:
 *   node --env-file=.env.local scripts/assign-limonade-image.mjs
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
const SLUG = "limonade"
const FOLDER = "juices"

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

const src = join(ROOT, "data/menu-images", FOLDER, `${SLUG}.png`)
if (!existsSync(src)) {
  console.error(`❌  Source manquante: ${src}`)
  process.exit(1)
}

const { data: row } = await supabase.from("products").select("image_url").eq("slug", SLUG).maybeSingle()
if (!row) {
  console.error("❌  Produit limonade introuvable — run FIX-ADD-LIMONADE.sql d'abord.")
  process.exit(1)
}
if (!isMissingImage(row.image_url)) {
  console.log("⏭️  limonade: image existante conservée")
  process.exit(0)
}

const buf = await sharp(readFileSync(src))
  .rotate()
  .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
  .webp({ quality: 88, effort: 4 })
  .toBuffer()

const objectPath = `products/${FOLDER}/${SLUG}.webp`
const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, buf, {
  contentType: "image/webp",
  upsert: true,
})
if (upErr) throw new Error(upErr.message)

const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
const { error: dbErr } = await supabase.from("products").update({ image_url: pub.publicUrl }).eq("slug", SLUG)
if (dbErr) throw new Error(dbErr.message)

console.log(`✅  limonade → ${pub.publicUrl}`)
