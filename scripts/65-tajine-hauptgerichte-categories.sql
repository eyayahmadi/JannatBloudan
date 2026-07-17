-- =============================================================================
-- 65 — Tajine + Hauptgerichte (2 categories, 11 products)
-- Idempotent. Does not modify existing categories/products (except upsert by slug on new rows only).
-- Order: … manakish (30) → tajine (35) → hauptgerichte (36) → plats (40) …
-- =============================================================================

BEGIN;

-- ── Categories ────────────────────────────────────────────────────────────────
INSERT INTO categories (name, slug, name_ar, section, display_order, is_active, icon_emoji)
VALUES
  ('Tajine', 'tajine', 'الطواجن', 'food', 35, true, '🍲'),
  ('Hauptgerichte', 'hauptgerichte', 'الطبخات', 'food', 36, true, '🥘')
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  name_ar       = EXCLUDED.name_ar,
  section       = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active     = EXCLUDED.is_active,
  icon_emoji    = EXCLUDED.icon_emoji;

-- ── Products — Tajine (6) ─────────────────────────────────────────────────────
INSERT INTO products (
  name, slug, description, description_ar, price, category_id, image_url,
  preparation_time, is_popular, is_vegetarian, is_vegan, is_halal,
  is_available, is_archived, stock_quantity, station, name_ar, display_order, tags
)
SELECT
  v.name, v.slug, v.description, v.description_ar, v.price,
  c.id, '/placeholder.svg', 25, false, false, false, true,
  true, false, 100, 'KITCHEN', v.name_ar, v.display_order, '[]'::jsonb
FROM (VALUES
  (
    'Tajine Kebab Hindi mit weißem Reis',
    'tajine-kebab-hindi-mit-weissem-reis',
    'Hackfleisch mit geschmorten Tomaten und Zwiebeln, serviert mit weißem Reis.',
    'لحم مفروم، بندورة مطبوخة مع بصل.',
    20.00::decimal,
    'طاجن كباب هندي مع رز أبيض',
    10
  ),
  (
    'Tajine Mandi mit Lammfleisch',
    'tajine-mandi-mit-lammfleisch',
    'Aromatischer Mandi-Reis mit zartem Lammfleisch und Daqous-Sauce.',
    'رز مندي مع لحم وصوص دقوس.',
    20.00::decimal,
    'طاجن مندي باللحم',
    20
  ),
  (
    'Tajine Mandi mit Hähnchen',
    'tajine-mandi-mit-haehnchen',
    'Aromatischer Mandi-Reis mit saftigem Hähnchen und Daqous-Sauce.',
    'رز مندي مع دجاج وصوص دقوس.',
    20.00::decimal,
    'طاجن مندي بالدجاج',
    30
  ),
  (
    'Tajine Shish',
    'tajine-shish',
    'Zartes Hähnchen mit Champignons in cremiger Sauce.',
    'دجاج مطبوخ مع كريمة وفطر.',
    20.00::decimal,
    'طاجن شيش',
    40
  ),
  (
    'Tajine Lahmeh bil Sahn mit Tomaten',
    'tajine-lahmeh-bil-sahn-mit-tomaten',
    'Gebratenes Fleisch mit geschmorten Tomaten, im Tontopf serviert.',
    'طاجن لحمة بالصحن مع بندورة',
    20.00::decimal,
    'طاجن لحمة بالصحن مع بندورة',
    50
  ),
  (
    'Tajine Lahmeh bil Sahn mit Tahini',
    'tajine-lahmeh-bil-sahn-mit-tahini',
    'Gebratenes Fleisch mit cremiger Tahini-Sauce, im Tontopf serviert.',
    'طاجن لحمة بالصحن مع طحينية',
    20.00::decimal,
    'طاجن لحمة بالصحن مع طحينية',
    60
  )
) AS v(name, slug, description, description_ar, price, name_ar, display_order)
CROSS JOIN categories c
WHERE c.slug = 'tajine'
ON CONFLICT (slug) DO UPDATE SET
  name           = EXCLUDED.name,
  name_ar        = EXCLUDED.name_ar,
  description    = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  price          = EXCLUDED.price,
  category_id    = EXCLUDED.category_id,
  station        = EXCLUDED.station,
  display_order  = EXCLUDED.display_order,
  is_available   = EXCLUDED.is_available,
  is_archived    = false;

-- ── Products — Hauptgerichte (5) ──────────────────────────────────────────────
INSERT INTO products (
  name, slug, description, description_ar, price, category_id, image_url,
  preparation_time, is_popular, is_vegetarian, is_vegan, is_halal,
  is_available, is_archived, stock_quantity, station, name_ar, display_order, tags
)
SELECT
  v.name, v.slug, v.description, v.description_ar, v.price,
  c.id, '/placeholder.svg', 25, false, false, false, true,
  true, false, 100, 'KITCHEN', v.name_ar, v.display_order, '[]'::jsonb
FROM (VALUES
  (
    'Shakriyeh mit weißem Reis',
    'shakriyeh-mit-weissem-reis',
    'Frisch gekochte Joghurtsauce mit zartem Fleisch, serviert mit weißem Reis.',
    'لبن مطبوخ مع لحم.',
    20.00::decimal,
    'شاكرية ورز أبيض',
    10
  ),
  (
    'Kibbeh Labaniyeh mit weißem Reis',
    'kibbeh-labaniyeh-mit-weissem-reis',
    'Mit Fleisch, Zwiebeln und Walnüssen gefüllte Bulgur-Kibbeh in gekochter Joghurtsauce, serviert mit weißem Reis.',
    'أقراص برغل محشية باللحم والبصل والجوز باللبن المطبوخ.',
    20.00::decimal,
    'كبة لبنية ورز أبيض',
    20
  ),
  (
    'Shish Barak',
    'shish-barak',
    'Mit Fleisch, Zwiebeln und Koriander gefüllte Teigtaschen in gekochter Joghurtsauce.',
    'أقراص عجين محشية باللحم والبصل والكزبرة مع اللبن المطبوخ.',
    20.00::decimal,
    'شيش برك',
    30
  ),
  (
    'Basha wa Asakro',
    'basha-wa-asakro',
    'Mit Fleisch, Zwiebeln und Koriander gefüllte Bulgur- und Teigtaschen in einer traditionellen Sauce.',
    'أقراص برغل وعجين محشية لحم وبصل وكزبرة.',
    20.00::decimal,
    'باشا وعساكرو',
    40
  ),
  (
    'Jaddi bil Zeit',
    'jaddi-bil-zeit',
    'Geschmortes Fleisch mit Kartoffeln und Karotten, serviert mit weißem Reis.',
    'لحم مطبوخ مع بطاطا وجزر ورز أبيض.',
    20.00::decimal,
    'جدي بالزيت',
    50
  )
) AS v(name, slug, description, description_ar, price, name_ar, display_order)
CROSS JOIN categories c
WHERE c.slug = 'hauptgerichte'
ON CONFLICT (slug) DO UPDATE SET
  name           = EXCLUDED.name,
  name_ar        = EXCLUDED.name_ar,
  description    = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  price          = EXCLUDED.price,
  category_id    = EXCLUDED.category_id,
  station        = EXCLUDED.station,
  display_order  = EXCLUDED.display_order,
  is_available   = EXCLUDED.is_available,
  is_archived    = false;

COMMIT;

-- ── Verification ──────────────────────────────────────────────────────────────
SELECT slug, display_order, name, name_ar
FROM categories
WHERE slug IN ('manakish', 'tajine', 'hauptgerichte', 'plats')
ORDER BY display_order;

SELECT c.slug AS category, COUNT(p.id) AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_archived IS NOT TRUE
WHERE c.slug IN ('tajine', 'hauptgerichte')
GROUP BY c.slug;

SELECT slug, price, name, name_ar
FROM products
WHERE slug LIKE 'tajine-%' OR slug IN (
  'shakriyeh-mit-weissem-reis',
  'kibbeh-labaniyeh-mit-weissem-reis',
  'shish-barak',
  'basha-wa-asakro',
  'jaddi-bil-zeit'
)
ORDER BY slug;
