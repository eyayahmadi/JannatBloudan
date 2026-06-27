#!/usr/bin/env node
/**
 * Generate premium Manakish food photos via OpenAI → data/menu-images/manakish/{slug}.png
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-manakish-images.mjs
 *   node --env-file=.env.local scripts/generate-manakish-images.mjs manakish-zaatar
 *
 * Requires OPENAI_API_KEY or AI_API_KEY. Then run:
 *   npm run menu:manakish:images
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const OUT_DIR = join(ROOT, "data/menu-images/manakish")

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_API_KEY
const OPENAI_BASE = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")

/** slug → short visual prompt for DALL-E */
const PROMPTS = {
  "manakish-a-la-souradia":
    "Syrian manakish flatbread topped with minced meat, cheese, zaatar, muhammara and spinach, golden baked crust, Lebanese restaurant style",
  "manakish-toshka":
    "Toshka stuffed flatbread with minced meat and melted cheese, crispy golden bread, Middle Eastern bakery",
  "manakish-fleischstreifen-auf-teig":
    "Fresh baked flatbread with seasoned meat strips, Middle Eastern manakish, appetizing close-up",
  "manakish-lamm-stueckchen-auf-teig":
    "Flatbread topped with tender lamb pieces and spices, golden oven-baked manakish",
  "manakish-schisch-tawouk":
    "Manakish with marinated chicken shish tawook strips and melted cheese on fresh dough",
  "manakish-zaatar":
    "Classic zaatar manakish with olive oil and thyme, Lebanese flatbread, vegetarian",
  "manakish-zaatar-mit-kaese":
    "Zaatar manakish with melted cheese, golden baked flatbread",
  "manakish-kaese-pide":
    "Round cheese pide flatbread with melted cheese, Turkish-Lebanese style",
  "manakish-calazoni":
    "Crispy calzone filled with kashkaval cheese, golden baked pastry",
  "manakish-muhammara-kaschkawal":
    "Manakish with red muhammara spread and melted kashkaval cheese",
  "manakish-spinat-dreieckig":
    "Triangular spinach manakish with onions and spices, fresh baked",
  "manakish-sucuk-calzone":
    "Calzone with spicy sucuk sausage and melted cheese, golden crust",
  "manakish-lammacun":
    "Thin crispy lahmacun with spiced minced meat, Lebanese flatbread",
  "manakish-lammacun-syrisch":
    "Syrian sfiha flatbread with fine minced meat and spices",
  "manakish-lammacun-mit-joghurt":
    "Syrian lahmacun served with fresh yogurt on the side, appetizing",
  "manakish-sanfura":
    "Sanfura pastry with kashkaval cheese and creamy filling, golden baked",
  "manakish-kartoffel-ecke":
    "Triangular potato-filled pastry, spiced potato manakish, crispy golden",
  "manakish-oliven":
    "Manakish topped with green olives and olive oil on fresh dough",
  "manakish-chicken-mit-kaese":
    "Flatbread with grilled chicken and melted cheese, manakish style",
  "manakish-mexican-chicken":
    "Spicy Mexican-style chicken manakish with melted cheese",
  "manakish-muhamara-mit-oliven":
    "Muhammara spread manakish with olives on crispy flatbread",
  "manakish-muhammara-mit-nuesse":
    "Muhammara manakish with walnuts on fresh baked dough",
  "manakish-libanesischer-kaese":
    "Traditional Lebanese cheese manakish, melted local cheese on flatbread",
  "manakish-akkawi-kaese":
    "Manakish with authentic Akkawi cheese, golden baked Lebanese flatbread",
  "manakish-spezial-bloudan":
    "Large house special manakish platter with multiple toppings lahmacun chicken cheese muhammara zaatar, premium restaurant presentation",
}

const STYLE =
  "Premium food photography, soft natural lighting, shallow depth of field, square composition 1:1, warm tones, no text, no watermark, no logo, no people, restaurant menu quality, appetizing"

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY or AI_API_KEY required.")
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

const onlySlug = process.argv[2]
const slugs = onlySlug ? [onlySlug] : Object.keys(PROMPTS)

async function generateImage(slug, prompt) {
  const outPath = join(OUT_DIR, `${slug}.png`)
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

console.log("🫓  Manakish — generate images\n")
let ok = 0
for (const slug of slugs) {
  const prompt = PROMPTS[slug]
  if (!prompt) {
    console.error(`  ❌  Unknown slug: ${slug}`)
    continue
  }
  try {
    await generateImage(slug, prompt)
    ok++
    await new Promise((r) => setTimeout(r, 1500))
  } catch (e) {
    console.error(`  ❌  ${slug}: ${e.message}`)
  }
}
console.log(`\nDone: ${ok}/${slugs.length}. Run: npm run menu:manakish:images`)
