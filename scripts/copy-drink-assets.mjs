#!/usr/bin/env node
/** Copy generated assets/*.png into data/menu-images/{folder}/ */
import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const ASSETS = "C:\\Users\\MSI\\.cursor\\projects\\c-Users-MSI-Downloads-pfe-main\\assets"

const SLUG_FOLDER = {
  stillwasser: "water", mineralwasser: "water",
  ananassaft: "juices", apfelsaft: "juices", orangensaft: "juices", mangosaft: "juices",
  erdbeersaft: "juices", maracujasaft: "juices", kiba: "juices",
  "coca-cola": "soft-drinks", "coca-cola-zero": "soft-drinks", fanta: "soft-drinks", sprite: "soft-drinks",
  "red-bull": "soft-drinks", "red-bull-sugar-free": "soft-drinks", "red-bull-white": "soft-drinks",
  "eistee-pfirsich": "ice-tea", "eistee-zitrone": "ice-tea", "eistee-wassermelone": "ice-tea",
  mojito: "cocktails", "erdbeer-mojito": "cocktails", "maracuja-splash": "cocktails",
  "sweet-ananas": "cocktails", ipanema: "cocktails", jamaica: "cocktails",
  "bloudan-smoothie": "smoothies", "mango-smoothie": "smoothies", "erdbeer-smoothie": "smoothies",
  "ananas-smoothie": "smoothies", "polo-smoothie": "smoothies",
  "bloudan-milkshake": "milkshakes", "erdbeer-milkshake": "milkshakes",
  "schokoladen-milkshake": "milkshakes", "oreo-milkshake": "milkshakes",
  "banane-milch-avocado": "banana-milk-cocktails", "banane-milch-erdbeere": "banana-milk-cocktails",
  "banane-milch-schokolade": "banana-milk-cocktails",
  "iced-latte-macchiato": "iced-coffee", "iced-latte-chocolate": "iced-coffee",
  "iced-latte-vanilla": "iced-coffee", "iced-latte-caramel": "iced-coffee",
  frappuccino: "iced-coffee", "iced-mocha": "iced-coffee",
  "arabic-coffee": "coffee", espresso: "coffee", "espresso-macchiato": "coffee",
  cappuccino: "coffee", "latte-macchiato": "coffee", "chocolate-latte": "coffee",
  "vanilla-latte": "coffee", "caramel-latte": "coffee", "al-pacchino": "coffee",
  americano: "coffee", "flat-white": "coffee", mocha: "coffee", "hot-chocolate": "coffee", sahlab: "coffee",
  "imperator-avoca-free": "imperator", "imperator-pinastro-flix": "imperator",
  "imperator-x4": "imperator", "imperator-thundermix": "imperator",
}

let copied = 0
for (const [slug, folder] of Object.entries(SLUG_FOLDER)) {
  const src = join(ASSETS, `${slug}.png`)
  if (!existsSync(src)) continue
  const dstDir = join(ROOT, "data/menu-images", folder)
  mkdirSync(dstDir, { recursive: true })
  copyFileSync(src, join(dstDir, `${slug}.png`))
  copied++
}
console.log(`Copied ${copied} images from assets to data/menu-images/`)
