#!/usr/bin/env node
/**
 * Copy Tajine + Hauptgerichte PNGs → data/menu-images + public WebP for fallback catalog.
 *
 * Usage:
 *   node scripts/prepare-tajine-hauptgerichte-public-images.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const ASSETS =
  process.env.MENU_IMAGE_ASSETS ??
  "C:\\Users\\MSI\\.cursor\\projects\\c-Users-MSI-Downloads-pfe-main\\assets"
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

let ok = 0
for (const { slug, folder } of PRODUCTS) {
  const src = join(ASSETS, `${slug}.png`)
  if (!existsSync(src)) {
    console.error(`  ❌  missing: ${src}`)
    continue
  }

  const dataDir = join(ROOT, "data/menu-images", folder)
  const publicDir = join(ROOT, "public/images/menu", folder)
  mkdirSync(dataDir, { recursive: true })
  mkdirSync(publicDir, { recursive: true })

  copyFileSync(src, join(dataDir, `${slug}.png`))

  const webp = await sharp(readFileSync(src))
    .rotate()
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 88, effort: 4 })
    .toBuffer()

  writeFileSync(join(publicDir, `${slug}.webp`), webp)
  console.log(`  ✅  ${slug}  (${(webp.length / 1024).toFixed(0)} KB → public/images/menu/${folder}/)`)
  ok++
}

console.log(`\nDone: ${ok}/${PRODUCTS.length} images ready.`)
