-- =============================================================================
-- 73 — Menu Page 4 : Grillgerichte (canonical sync, idempotent)
--
-- Updates category grillades and the 12 products listed (58–69).
-- Does NOT modify leber-teller, gegrillter-gemueseteller, schisch-tawouk-1kg,
-- haehnchenfluegel-1kg, or any other off-page products.
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags
-- on existing products.
-- =============================================================================

BEGIN;

-- ── Category ──────────────────────────────────────────────────────────────────

UPDATE categories SET
  name = 'Grillgerichte',
  name_ar = 'المشاوي',
  description = 'Alle Grillgerichte werden mit Beilage gegrilltem Gemüse, Reis sowie Hummus und Muhammara serviert.',
  display_order = 29,
  is_active = true
WHERE slug = 'grillades';

-- ── Products 58–65, 66–68 (existing slugs) ───────────────────────────────────

UPDATE products SET
  description = 'Lammspieße, Hackfleisch-Kebab und Hähnchenspieße mit Salat, Knoblauchcreme, sowie Pommes oder Reis.',
  display_order = 10
WHERE slug = 'gemischter-grillteller';

UPDATE products SET
  name = 'Lammspieße',
  name_ar = 'شقف',
  description = 'mit Salat, Knoblauchcreme, sowie Pommes oder Reis.',
  display_order = 20
WHERE slug = 'lamm-teller';

UPDATE products SET
  name = 'Hackfleisch-Kebab',
  name_ar = 'كباب',
  description = 'mit Salat, Knoblauchcreme, sowie Pommes oder Reis.',
  display_order = 30
WHERE slug = 'kebab-teller';

UPDATE products SET
  name = 'Hähnchenspieße',
  name_ar = 'وجبة شيش',
  description = 'mit Salat, Knoblauchcreme, sowie Pommes oder Reis.',
  display_order = 40
WHERE slug = 'schisch-tawouk-teller';

UPDATE products SET
  name = 'halbes Grillhähnchen',
  name_ar = 'نصف فروج عالفحم',
  description = 'mit Salat, Knoblauchcreme, sowie Pommes oder Reis.',
  display_order = 50
WHERE slug = 'halbes-grillhaehnchen';

UPDATE products SET
  name = 'Kebab mit Auberginen',
  name_ar = 'كباب بالباذنجان',
  description = 'Hackfleisch-Kebab mit gegrillten Auberginen, Salat, Knoblauchcreme, sowie Pommes oder Reis.',
  price = 22.00,
  display_order = 60
WHERE slug = 'auberginen-kebab';

UPDATE products SET
  name = 'Maria mit Käse',
  name_ar = 'ماريا لحم مع جبنة',
  description = 'Fladenbrot mit Hackfleisch und Käse, Salat, Knoblauchcreme, sowie Pommes oder Reis.',
  price = 15.00,
  display_order = 70
WHERE slug = 'lahmacun-mit-kaese';

UPDATE products SET
  name = 'Dorade gegrillt',
  name_ar = 'سمكة دورادو مشوية',
  description = 'mit Salat, Knoblauchcreme, sowie Pommes oder Reis.',
  price = 25.00,
  display_order = 80
WHERE slug = 'gegrillter-fisch-teller';

UPDATE products SET
  name = '1kg Gemischtes Grillmenü',
  name_ar = 'كيلو مشاوي مشكلة',
  description = 'Lammspieße, Hackfleisch-Kebab und Hähnchenspieße mit Salat, Knoblauchcreme, sowie Pommes oder Reis.',
  display_order = 90
WHERE slug = 'gemischter-grill-1kg';

UPDATE products SET
  name = '1kg Hackfleisch-Kebab',
  name_ar = 'كيلو كباب',
  description = 'mit Salat, Knoblauchcreme, sowie Pommes oder Reis.',
  display_order = 110
WHERE slug = 'kebab-1kg';

-- ── New products 67, 69 ───────────────────────────────────────────────────────

DO $$
DECLARE
  cat_grillades UUID;
BEGIN
  SELECT id INTO cat_grillades FROM categories WHERE slug = 'grillades';

  -- 67 1kg Lammspieße
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    '1kg Lammspieße', 'lamm-1kg',
    'mit Salat, Knoblauchcreme, sowie Pommes oder Reis.',
    60.00, cat_grillades, 100,
    'KITCHEN', true, 100, 30,
    'كيلو شقف', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 69 Ganzes Grillhähnchen
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Ganzes Grillhähnchen', 'ganzes-grillhaehnchen',
    'mit Salat, Knoblauchcreme, sowie Pommes oder Reis.',
    30.00, cat_grillades, 120,
    'KITCHEN', true, 100, 35,
    'فروج مشوي عالفحم', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;
END $$;

COMMIT;
