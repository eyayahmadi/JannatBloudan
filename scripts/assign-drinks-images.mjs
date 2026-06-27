#!/usr/bin/env node
/**
 * Upload missing drink/beverage images → Supabase Storage + update products.image_url
 *
 * Usage:
 *   node --env-file=.env.local scripts/assign-drinks-images.mjs
 */
import { readFileSync, existsSync } from "node:fs"
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
const ASSETS = join("C:", "Users", "MSI", ".cursor", "projects", "c-Users-MSI-Downloads-pfe-main", "assets")
const BUCKET = "menu-product-images"
const SIZE = MENU_IMAGE_SIZE

/** slug → storage folder under products/ */
const SLUG_FOLDER = {
  stillwasser: "water",
  mineralwasser: "water",
  ananassaft: "juices",
  apfelsaft: "juices",
  orangensaft: "juices",
  mangosaft: "juices",
  erdbeersaft: "juices",
  maracujasaft: "juices",
  kiba: "juices",
  "coca-cola": "soft-drinks",
  "coca-cola-zero": "soft-drinks",
  fanta: "soft-drinks",
  sprite: "soft-drinks",
  "red-bull": "soft-drinks",
  "red-bull-sugar-free": "soft-drinks",
  "red-bull-white": "soft-drinks",
  "eistee-pfirsich": "ice-tea",
  "eistee-zitrone": "ice-tea",
  "eistee-wassermelone": "ice-tea",
  mojito: "cocktails",
  "erdbeer-mojito": "cocktails",
  "maracuja-splash": "cocktails",
  "sweet-ananas": "cocktails",
  ipanema: "cocktails",
  jamaica: "cocktails",
  "bloudan-smoothie": "smoothies",
  "mango-smoothie": "smoothies",
  "erdbeer-smoothie": "smoothies",
  "ananas-smoothie": "smoothies",
  "polo-smoothie": "smoothies",
  "bloudan-milkshake": "milkshakes",
  "erdbeer-milkshake": "milkshakes",
  "schokoladen-milkshake": "milkshakes",
  "oreo-milkshake": "milkshakes",
  "banane-milch-avocado": "banana-milk-cocktails",
  "banane-milch-erdbeere": "banana-milk-cocktails",
  "banane-milch-schokolade": "banana-milk-cocktails",
  "iced-latte-macchiato": "iced-coffee",
  "iced-latte-chocolate": "iced-coffee",
  "iced-latte-vanilla": "iced-coffee",
  "iced-latte-caramel": "iced-coffee",
  frappuccino: "iced-coffee",
  "iced-mocha": "iced-coffee",
  "arabic-coffee": "coffee",
  espresso: "coffee",
  "espresso-macchiato": "coffee",
  cappuccino: "coffee",
  "latte-macchiato": "coffee",
  "chocolate-latte": "coffee",
  "vanilla-latte": "coffee",
  "caramel-latte": "coffee",
  "al-pacchino": "coffee",
  americano: "coffee",
  "flat-white": "coffee",
  mocha: "coffee",
  "hot-chocolate": "coffee",
  sahlab: "coffee",
  "imperator-avoca-free": "imperator",
  "imperator-pinastro-flix": "imperator",
  "imperator-x4": "imperator",
  "imperator-thundermix": "imperator",
}

const SLUGS = Object.keys(SLUG_FOLDER)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.")
  process.exit(1)
}

const supabase = createClient(url, key)

function resolveSourcePng(slug, folder) {
  const candidates = [
    join(ROOT, "data", "menu-images", folder, `${slug}.png`),
    join(ASSETS, `${slug}.png`),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

async function prepareSquareWebp(slug, folder) {
  const src = resolveSourcePng(slug, folder)
  if (!src) throw new Error(`Image manquante pour ${slug}`)
  return sharp(readFileSync(src))
    .rotate()
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: MENU_IMAGE_WEBP_QUALITY, effort: 4 })
    .toBuffer()
}

async function uploadAndLink(slug, folder, buf) {
  return uploadMenuProductImage(supabase, { slug, folder, buffer: buf, skipIfCurrent: true })
}

console.log("🥤  Drinks & beverages — upload images menu\n")
let ok = 0
for (const slug of SLUGS) {
  const folder = SLUG_FOLDER[slug]
  try {
    const buf = await prepareSquareWebp(slug, folder)
    const result = await uploadAndLink(slug, folder, buf)
    const tag = result.skipped ? "⏭" : "✅"
    console.log(`  ${tag}  ${slug}  (${(result.bytes / 1024).toFixed(0)} KB)${result.skipped ? " — unchanged" : ""}`)
    ok++
  } catch (e) {
    console.error(`  ❌  ${slug}: ${e.message}`)
  }
}
console.log(`\nTerminé: ${ok}/${SLUGS.length} produits mis à jour.`)
