-- =============================================================================
-- 66 — Tajine + Hauptgerichte product images
-- Sets image_url to deployed public WebP assets (same paths used by fallback catalog).
-- After Supabase Storage upload, run: npm run menu:tajine-hauptgerichte:images
-- to replace with CDN URLs under menu-product-images/products/{tajine|hauptgerichte}/.
-- =============================================================================

BEGIN;

UPDATE products
SET image_url = '/images/menu/tajine/' || slug || '.webp'
WHERE slug IN (
  'tajine-kebab-hindi-mit-weissem-reis',
  'tajine-mandi-mit-lammfleisch',
  'tajine-mandi-mit-haehnchen',
  'tajine-shish',
  'tajine-lahmeh-bil-sahn-mit-tomaten',
  'tajine-lahmeh-bil-sahn-mit-tahini'
);

UPDATE products
SET image_url = '/images/menu/hauptgerichte/' || slug || '.webp'
WHERE slug IN (
  'shakriyeh-mit-weissem-reis',
  'kibbeh-labaniyeh-mit-weissem-reis',
  'shish-barak',
  'basha-wa-asakro',
  'jaddi-bil-zeit'
);

COMMIT;

SELECT slug, image_url
FROM products
WHERE slug LIKE 'tajine-%'
   OR slug IN (
     'shakriyeh-mit-weissem-reis',
     'kibbeh-labaniyeh-mit-weissem-reis',
     'shish-barak',
     'basha-wa-asakro',
     'jaddi-bil-zeit'
   )
ORDER BY slug;
