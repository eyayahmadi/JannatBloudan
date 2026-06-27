#!/usr/bin/env node
/**
 * Génère scripts/33-jannat-bloudan-menu.sql à partir de data/jannat-bloudan-menu.json
 * Usage: node scripts/generate-jannat-menu-sql.mjs
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const menu = JSON.parse(readFileSync(join(ROOT, "data/jannat-bloudan-menu.json"), "utf8"))

function esc(s) {
  return String(s ?? "").replace(/'/g, "''")
}

function tagsJson(p) {
  const tags = [...(p.tags ?? [])]
  if (p.is_popular && !tags.includes("popular")) tags.push("popular")
  return JSON.stringify([...new Set(tags)])
}

function legacyFromTags(tags) {
  const set = new Set(tags ?? [])
  return {
    is_popular: set.has("popular") || set.has("best_seller"),
    is_vegetarian: set.has("vegetarian"),
    is_vegan: set.has("vegan"),
    is_chef_choice: set.has("chef_recommendation"),
    is_recommended: set.has("chef_recommendation"),
  }
}

const lines = []
lines.push(`-- =============================================================================
-- 33 — Jannat Bloudan — Carte complète (remplace les données démo)
-- Généré par scripts/generate-jannat-menu-sql.mjs — ne pas éditer à la main
-- Source: data/jannat-bloudan-menu.json
-- ON CONFLICT : image_url n'est jamais écrasé (photos = CMS / Storage).
-- products/categories ne sont jamais DELETE (données CMS préservées).
-- =============================================================================

BEGIN;

-- Tables pour les extras (Waffle / Crêpe / Pancake Nature)
CREATE TABLE IF NOT EXISTS product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_de VARCHAR(100) NOT NULL DEFAULT 'Extras',
  name_ar VARCHAR(100),
  min_selections INT NOT NULL DEFAULT 0,
  max_selections INT NOT NULL DEFAULT 12,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES product_modifier_groups(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  name_de VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_modifier_groups_product ON product_modifier_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_modifiers_group ON product_modifiers(group_id);

-- Tables pour les variantes de taille (Salades, Eau, Thé)
CREATE TABLE IF NOT EXISTS product_variant_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_de VARCHAR(100) NOT NULL DEFAULT 'Größe',
  name_ar VARCHAR(100),
  min_selections INT NOT NULL DEFAULT 1,
  max_selections INT NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES product_variant_groups(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  name_de VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_variant_groups_product ON product_variant_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_group ON product_variants(group_id);

-- Nettoyage des anciennes données démo
-- Nettoyage extras/variantes (régénérés ci-dessous). products + categories : upsert seulement.
DELETE FROM product_variants;
DELETE FROM product_variant_groups;
DELETE FROM product_modifiers;
DELETE FROM product_modifier_groups;
DELETE FROM product_ingredients;

`)

for (const c of menu.categories) {
  lines.push(
    `INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('${esc(c.name)}', '${esc(c.slug)}', '${esc(c.name)}', '${esc(c.section)}', ${c.display_order}, true, '${esc(c.icon_emoji)}', '${esc(c.name_ar)}')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;`,
  )
}

lines.push(`
DO $$
DECLARE`)
for (const c of menu.categories) {
  const varName = c.slug.replace(/-/g, "_")
  lines.push(`  cat_${varName} UUID;`)
}
lines.push(`  prod_id UUID;`)
lines.push(`  grp_id UUID;`)
lines.push(`  var_grp_id UUID;`)
lines.push(`BEGIN`)

for (const c of menu.categories) {
  const varName = c.slug.replace(/-/g, "_")
  lines.push(`  SELECT id INTO cat_${varName} FROM categories WHERE slug = '${esc(c.slug)}';`)
}

for (const p of menu.products) {
  const catVar = p.category.replace(/-/g, "_")
  const tagList = JSON.parse(tagsJson(p))
  const legacy = legacyFromTags(tagList)
  const flags = [
    legacy.is_popular ? "true" : "false",
    legacy.is_vegetarian ? "true" : "false",
    legacy.is_vegan ? "true" : "false",
    legacy.is_chef_choice ? "true" : "false",
    legacy.is_recommended ? "true" : "false",
  ]
  const spice = p.spice_level ? `'${esc(p.spice_level)}'` : tagList.includes("spicy") ? "'épicé'" : "NULL"
  const descAr = p.description_ar ? `'${esc(p.description_ar)}'` : "NULL"
  lines.push(`  INSERT INTO products (
    name, slug, description, description_ar, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    '${esc(p.name)}', '${esc(p.slug)}', '${esc(p.description ?? p.name)}', ${descAr}, ${p.price}, cat_${catVar},
    '${esc(p.image_url ?? "/placeholder.svg")}', 15, ${flags[0]}, ${flags[1]}, ${flags[2]},
    ${flags[3]}, ${flags[4]}, true, 100,
    ${spice}, '${esc(p.name_ar)}', '${esc(p.station)}', '${esc(tagsJson(p))}'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    description_ar = EXCLUDED.description_ar,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    spice_level = EXCLUDED.spice_level;`)
}

lines.push(`
  -- Extras pour Waffle / Crêpe / Pancake Nature`)

for (const slug of menu.customizableProductSlugs) {
  lines.push(`  SELECT id INTO prod_id FROM products WHERE slug = '${esc(slug)}';
  IF prod_id IS NOT NULL THEN
    INSERT INTO product_modifier_groups (product_id, name_de, name_ar, min_selections, max_selections, display_order)
    VALUES (prod_id, 'Extras', 'إضافات', 0, 12, 0)
    RETURNING id INTO grp_id;`)
  let extraOrder = 0
  for (const ex of menu.extras) {
    extraOrder++
    lines.push(`    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, '${esc(ex.slug)}', '${esc(ex.name)}', '${esc(ex.name_ar)}', ${ex.price}, ${extraOrder});`)
  }
  lines.push(`  END IF;`)
}

lines.push(`
  -- Variantes de taille (Salades, Eau, Thé)`)

for (const p of menu.products) {
  if (!Array.isArray(p.variants) || p.variants.length === 0) continue
  const groupNameDe = p.category === "tea" ? "Größe" : p.category === "water" ? "Größe" : "Größe"
  const groupNameAr = p.category === "tea" ? "الحجم" : p.category === "water" ? "الحجم" : "الحجم"
  lines.push(`  SELECT id INTO prod_id FROM products WHERE slug = '${esc(p.slug)}';
  IF prod_id IS NOT NULL THEN
    INSERT INTO product_variant_groups (product_id, name_de, name_ar, min_selections, max_selections, display_order)
    VALUES (prod_id, '${esc(groupNameDe)}', '${esc(groupNameAr)}', 1, 1, 0)
    RETURNING id INTO var_grp_id;`)
  let varOrder = 0
  for (const v of p.variants) {
    varOrder++
    lines.push(`    INSERT INTO product_variants (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (var_grp_id, '${esc(v.slug)}', '${esc(v.name)}', '${esc(v.name_ar)}', ${v.price}, ${varOrder});`)
  }
  lines.push(`  END IF;`)
}

lines.push(`END $$;

COMMIT;
`)

const outPath = join(__dirname, "33-jannat-bloudan-menu.sql")
writeFileSync(outPath, lines.join("\n"), "utf8")
console.log(`✅  Généré: ${outPath}`)
console.log(`   ${menu.categories.length} catégories, ${menu.products.length} produits, ${menu.extras.length} extras`)
