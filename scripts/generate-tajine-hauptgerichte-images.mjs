#!/usr/bin/env node
/**
 * Generate Tajine + Hauptgerichte product photos via OpenAI → PNG sources
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-tajine-hauptgerichte-images.mjs
 *   node --env-file=.env.local scripts/generate-tajine-hauptgerichte-images.mjs tajine-shish
 *
 * Then:
 *   npm run menu:tajine-hauptgerichte:images
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_API_KEY
const OPENAI_BASE = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")

const STYLE =
  "Premium food photography, soft natural lighting, shallow depth of field, square composition 1:1, warm tones, no text, no watermark, no logo, no people, no hands, restaurant menu quality, appetizing, Syrian Lebanese restaurant"

/** slug → { folder, prompt } */
const PRODUCTS = {
  "tajine-kebab-hindi-mit-weissem-reis": {
    folder: "tajine",
    prompt:
      "Syrian tajine kebab hindi with minced meat and stewed tomatoes and onions in traditional clay tagine pot, served beside white rice on a plate, authentic Middle Eastern restaurant dish",
  },
  "tajine-mandi-mit-lammfleisch": {
    folder: "tajine",
    prompt:
      "Mandi rice tajine with tender lamb meat and daqous sauce in clay pot, aromatic yellow rice, Syrian restaurant presentation",
  },
  "tajine-mandi-mit-haehnchen": {
    folder: "tajine",
    prompt:
      "Mandi rice tajine with juicy chicken and daqous sauce in traditional clay tagine, golden aromatic rice",
  },
  "tajine-shish": {
    folder: "tajine",
    prompt:
      "Creamy chicken and mushroom tajine shish in clay pot, rich white cream sauce with mushrooms, Syrian home-style cooking",
  },
  "tajine-lahmeh-bil-sahn-mit-tomaten": {
    folder: "tajine",
    prompt:
      "Lahmeh bil sahn fried meat with stewed tomatoes served in traditional Syrian clay tajine pot, sizzling meat with tomatoes",
  },
  "tajine-lahmeh-bil-sahn-mit-tahini": {
    folder: "tajine",
    prompt:
      "Lahmeh bil sahn fried meat with creamy tahini sauce in clay tajine pot, golden tahini over seared meat",
  },
  "shakriyeh-mit-weissem-reis": {
    folder: "hauptgerichte",
    prompt:
      "Shakriyeh Syrian dish with cooked yogurt sauce and tender meat served with white rice on plate, creamy white yogurt stew",
  },
  "kibbeh-labaniyeh-mit-weissem-reis": {
    folder: "hauptgerichte",
    prompt:
      "Kibbeh labaniyeh bulgur dumplings in cooked yogurt sauce with white rice, Syrian main course, creamy yogurt broth",
  },
  "shish-barak": {
    folder: "hauptgerichte",
    prompt:
      "Shish barak meat-filled dough parcels in cooked yogurt sauce, Syrian Lebanese main dish, creamy white sauce",
  },
  "basha-wa-asakro": {
    folder: "hauptgerichte",
    prompt:
      "Basha wa asakro Syrian dish with bulgur and dough parcels filled with meat in traditional sauce, rustic main course",
  },
  "jaddi-bil-zeit": {
    folder: "hauptgerichte",
    prompt:
      "Jaddi bil zeit braised meat with potatoes and carrots served with white rice, Syrian olive oil stew on plate",
  },
}

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY or AI_API_KEY required.")
  process.exit(1)
}

const onlySlug = process.argv[2]
const slugs = onlySlug ? [onlySlug] : Object.keys(PRODUCTS)

async function generateImage(slug, folder, prompt) {
  const outDir = join(ROOT, "data/menu-images", folder)
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `${slug}.png`)
  if (existsSync(outPath)) {
    console.log(`  ⏭  ${slug} (exists)`)
    return
  }

  const res = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: `${prompt}. ${STYLE}`,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
      quality: "hd",
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`)
  }

  const json = await res.json()
  const b64 = json.data?.[0]?.b64_json
  if (!b64) throw new Error("No image data returned")

  writeFileSync(outPath, Buffer.from(b64, "base64"))
  console.log(`  ✅  ${slug}`)
}

console.log("🍲  Tajine + Hauptgerichte — generate images\n")
let ok = 0
for (const slug of slugs) {
  const def = PRODUCTS[slug]
  if (!def) {
    console.error(`  ❌  Unknown slug: ${slug}`)
    continue
  }
  try {
    await generateImage(slug, def.folder, def.prompt)
    ok++
    await new Promise((r) => setTimeout(r, 1500))
  } catch (e) {
    console.error(`  ❌  ${slug}: ${e.message}`)
  }
}
console.log(`\nDone: ${ok}/${slugs.length}. Run: npm run menu:tajine-hauptgerichte:images`)
