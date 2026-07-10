#!/usr/bin/env node
/**
 * Upload Avoca Free product image → Supabase + products.image_url
 *
 * Usage:
 *   node --env-file=.env.local scripts/assign-avoca-free-image.mjs
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import {
  uploadMenuProductImage,
  MENU_IMAGE_SIZE,
  MENU_IMAGE_WEBP_QUALITY,
} from "./lib/menu-image-upload.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const SLUG = "imperator-avoca-free"
const FOLDER = "imperator"
const SRC = join(ROOT, "data", "menu-images", FOLDER, `${SLUG}.png`)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.")
  process.exit(1)
}

const supabase = createClient(url, key)

const buf = await sharp(readFileSync(SRC))
  .rotate()
  .resize(MENU_IMAGE_SIZE, MENU_IMAGE_SIZE, { fit: "cover", position: "centre" })
  .webp({ quality: MENU_IMAGE_WEBP_QUALITY, effort: 4 })
  .toBuffer()

const result = await uploadMenuProductImage(supabase, {
  slug: SLUG,
  folder: FOLDER,
  buffer: buf,
  skipIfCurrent: false,
})

console.log(`✅  Avoca Free (${SLUG})`)
console.log(`    ${result.url}`)
console.log(`    ${(result.bytes / 1024).toFixed(0)} KB`)
