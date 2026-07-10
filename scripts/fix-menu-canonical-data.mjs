#!/usr/bin/env node
/**
 * Patches data/jannat-bloudan-menu.json with full official names,
 * canonical category order, and per-category product display_order.
 *
 * Run: node scripts/fix-menu-canonical-data.mjs
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const JSON_PATH = join(__dirname, "../data/jannat-bloudan-menu.json")
const menu = JSON.parse(readFileSync(JSON_PATH, "utf8"))

/** Full disambiguated names — printed menu section + variant name. */
const NAME_FIXES = {
  "fruit-salad-bloudan": {
    name: "Fruchtsalat Bloudan",
    name_ar: "سلطة فواكه بلودان",
    description: "Fruchtsalat Spezialität Bloudan",
  },
  "fruit-salad-lotus": {
    name: "Fruchtsalat Lotus",
    name_ar: "سلطة فواكه لوتس",
    description: "Fruchtsalat mit Lotus",
  },
  "fruit-salad-dubai": {
    name: "Fruchtsalat Dubai",
    name_ar: "سلطة فواكه دبي",
    description: "Fruchtsalat Dubai Style",
  },
  "eis-vanille": {
    name: "Vanilleeis",
    name_ar: "آيس كريم فانيليا",
    description: "Vanilleeis",
  },
  "eis-fraise": {
    name: "Erdbeereis",
    name_ar: "آيس كريم فراولة",
    description: "Erdbeereis",
  },
  "eis-chocolat": {
    name: "Schokoladeneis",
    name_ar: "آيس كريم شوكولاتة",
    description: "Schokoladeneis",
  },
  "cheesecake-bloudan": {
    name: "Cheesecake Bloudan",
    name_ar: "تشيز كيك بلودان",
    description: "Cheesecake Spezialität Bloudan",
  },
  "cheesecake-lotus": {
    name: "Cheesecake Lotus",
    name_ar: "تشيز كيك لوتس",
    description: "Cheesecake mit Lotus",
  },
  "cheesecake-dubai": {
    name: "Cheesecake Dubai",
    name_ar: "تشيز كيك دبي",
    description: "Cheesecake Dubai Style",
  },
  "cheesecake-oreo": {
    name: "Cheesecake Oreo",
    name_ar: "تشيز كيك أوريو",
    description: "Cheesecake mit Oreo",
  },
  "gemischter-grill-1kg": {
    name: "Gemischter Grill (1kg)",
    name_ar: "مشاوي مشكلة (1 كغ)",
  },
  "kebab-1kg": {
    name: "Kebab (1kg)",
    name_ar: "كباب (1 كغ)",
  },
  "schisch-tawouk-1kg": {
    name: "Schisch Tawouk (1kg)",
    name_ar: "شيش طاووق (1 كغ)",
  },
  "haehnchenfluegel-1kg": {
    name: "Hähnchenflügel (1kg)",
    name_ar: "أجنحة دجاج (1 كغ)",
  },
  "shisha-bloudan": {
    name: "Shisha Bloudan",
    name_ar: "شيشة بلودان",
    description: "Shisha Spezialität Bloudan",
  },
  "shisha-double-apple": {
    name: "Doppel-Apfel",
    name_ar: "تفاحتين",
    description: "Klassisches Doppel-Apfel-Aroma",
  },
  "shisha-grape-mint": {
    name: "Traube Minze",
    name_ar: "عنب ونعناع",
    description: "Traube mit Minze",
  },
  "shisha-watermelon": {
    name: "Wassermelone",
    name_ar: "بطيخ",
    description: "Wassermelonen-Aroma",
  },
  "shisha-fruits": {
    name: "Früchte Mix",
    name_ar: "فواكه",
    description: "Fruchtmix-Aroma",
  },
  "shisha-polo": {
    name: "Shisha Polo",
    name_ar: "شيشة بولو",
    description: "Polo Aroma",
  },
  "cumin-lemon-tea": {
    name: "Kreuzkümmel-Zitronen-Tee",
    name_ar: "شاي كمون وليمون",
    description: "Tee mit Kreuzkümmel und Zitrone",
  },
  "stillwasser": {
    name: "Stillwasser",
    name_ar: "مياه معدنية",
    description: "Natürliches stilles Mineralwasser, perfekt gekühlt und die ideale Begleitung zu jeder Mahlzeit.",
  },
  "mineralwasser": {
    name: "Mineralwasser",
    name_ar: "مياه غازية",
    description: "Erfrischendes Mineralwasser mit Kohlensäure.",
  },
  "waffle-nature": { name: "Waffle Nature", name_ar: "وافل طبيعي" },
  "crepe-nature": { name: "Crêpe Nature", name_ar: "كريب طبيعي" },
  "pancake-nature": { name: "Pancake Nature", name_ar: "بان كيك طبيعي" },
  "crispy-chicken-sandwich": {
    name: "Crispy Chicken Sandwich",
    name_ar: "ساندويش كرسبي تشيكن",
  },
}

/** User-specified 29-category order (tea merged into Hot Drinks, Imperator last). */
const CATEGORY_ORDER = [
  { slug: "entrees", name: "Entrées", name_ar: "المقبلات", section: "food", display_order: 10 },
  { slug: "salades", name: "Salades", name_ar: "السلطات", section: "food", display_order: 20 },
  { slug: "manakish", name: "Manakish", name_ar: "المناقيش", section: "food", display_order: 30 },
  { slug: "plats", name: "Plats", name_ar: "الوجبات", section: "food", display_order: 40 },
  { slug: "shawarma", name: "Shawarma", name_ar: "الشاورما", section: "food", display_order: 50 },
  { slug: "grillades", name: "Grillades", name_ar: "المشاوي", section: "food", display_order: 60 },
  { slug: "pizza", name: "Pizza", name_ar: "البيتزا", section: "food", display_order: 70 },
  { slug: "burgers", name: "Burgers", name_ar: "البرغر", section: "food", display_order: 80 },
  { slug: "sandwiches", name: "Sandwiches", name_ar: "الساندويش", section: "food", display_order: 90 },
  { slug: "water", name: "Water", name_ar: "المياه", section: "drinks", display_order: 100 },
  { slug: "juices", name: "Juices", name_ar: "العصائر", section: "drinks", display_order: 110 },
  { slug: "soft-drinks", name: "Soft Drinks", name_ar: "المشروبات الغازية", section: "drinks", display_order: 120 },
  { slug: "ice-tea", name: "Ice Tea", name_ar: "شاي بارد", section: "drinks", display_order: 130 },
  { slug: "cocktails", name: "Cocktails", name_ar: "كوكتيلات", section: "drinks", display_order: 140 },
  { slug: "smoothies", name: "Smoothies", name_ar: "السموذي", section: "drinks", display_order: 150 },
  { slug: "milkshakes", name: "Milkshakes", name_ar: "ميلك شيك", section: "drinks", display_order: 160 },
  {
    slug: "banana-milk-cocktails",
    name: "Banana Milk Cocktails",
    name_ar: "كوكتيلات موز وحليب",
    section: "drinks",
    display_order: 170,
  },
  { slug: "coffee", name: "Hot Drinks", name_ar: "مشروبات ساخنة", section: "drinks", display_order: 180 },
  { slug: "iced-coffee", name: "Iced Coffee", name_ar: "قهوة باردة", section: "drinks", display_order: 190 },
  { slug: "waffeln", name: "Waffles", name_ar: "وافل", section: "desserts", display_order: 200 },
  { slug: "crepes", name: "Crepes", name_ar: "كريب", section: "desserts", display_order: 210 },
  { slug: "pancakes", name: "Pancakes", name_ar: "بان كيك", section: "desserts", display_order: 220 },
  { slug: "fruit-salads", name: "Fruit Salads", name_ar: "سلطات الفواكه", section: "desserts", display_order: 230 },
  { slug: "snacks", name: "Snacks", name_ar: "سناكات", section: "desserts", display_order: 240 },
  { slug: "ice-cream", name: "Ice Cream", name_ar: "آيس كريم", section: "desserts", display_order: 250 },
  { slug: "cheesecakes", name: "Cheesecakes", name_ar: "تشيز كيك", section: "desserts", display_order: 260 },
  { slug: "cakes", name: "Cakes", name_ar: "تورتة", section: "desserts", display_order: 270 },
  { slug: "shisha", name: "Shisha", name_ar: "أراكيل", section: "special", display_order: 280 },
  { slug: "imperator", name: "Imperator", name_ar: "إمبراطور", section: "special", display_order: 290 },
  // Legacy tea category — products moved to Hot Drinks; keep inactive for FK safety
  { slug: "tea", name: "Tea", name_ar: "الشاي", section: "drinks", display_order: 9999, is_active: false },
]

const catBySlug = new Map(CATEGORY_ORDER.map((c) => [c.slug, c]))
for (const c of menu.categories) {
  const canon = catBySlug.get(c.slug)
  if (canon) Object.assign(c, canon)
}

const TEA_SLUGS = new Set([
  "schwarzer-tee",
  "gruen-tee",
  "ingwer-zitrone",
  "kamille-tee",
  "mate",
  "cumin-lemon-tea",
])

// Apply name fixes
for (const p of menu.products) {
  const fix = NAME_FIXES[p.slug]
  if (fix) Object.assign(p, fix)
  // Tea products belong under Hot Drinks; images remain in products/tea/
  if (p.category === "tea" || TEA_SLUGS.has(p.slug)) {
    p.imageCategory = "tea"
    p.category = "coffee"
  }
}

// Assign display_order within each category (JSON order preserved)
const perCat = new Map()
for (const p of menu.products) {
  const n = (perCat.get(p.category) ?? 0) + 1
  perCat.set(p.category, n)
  p.display_order = n * 10
}

writeFileSync(JSON_PATH, JSON.stringify(menu, null, 2) + "\n", "utf8")

const short = menu.products.filter((p) =>
  ["Bloudan", "Lotus", "Dubai", "Vanille", "Fraise", "Chocolat", "Oreo", "Polo", "Burger", "1kg"].includes(p.name)
)
console.log(`Updated ${JSON_PATH}`)
console.log(`Categories: ${menu.categories.length} | Products: ${menu.products.length}`)
console.log(`Remaining ambiguous short names: ${short.length}`)
if (short.length) short.forEach((p) => console.log(" ", p.category, p.slug, p.name))
