-- =============================================================================
-- 72 — Menu Page 3 : Hauptgerichte Menü (canonical sync, idempotent)
--
-- Updates category plats → Hauptgerichte Menü and the 16 products listed (40–55).
-- Does NOT modify hauptgerichte (Syrian dishes), tajine, halloumi-teller, etc.
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags
-- on existing products.
-- =============================================================================

BEGIN;

-- ── Category (plats slug preserved for stable references) ─────────────────────

UPDATE categories SET
  name = 'Hauptgerichte Menü',
  name_ar = 'الوجبات الرئيسية',
  display_order = 28,
  is_active = true
WHERE slug = 'plats';

-- ── Products 40–55 (existing slugs matched first) ───────────────────────────

UPDATE products SET
  name = 'Crispy Chicken',
  name_ar = 'كريسبي',
  description = 'Mit Salat, Pommes und Sauce',
  price = 14.00,
  display_order = 10
WHERE slug = 'crispy-chicken-teller';

UPDATE products SET
  name = 'Crispy Zinger Chicken',
  name_ar = 'كريسبي زنجر',
  description = 'Mit Salat, Pommes und Sauce',
  price = 14.50,
  display_order = 20
WHERE slug = 'crispy-zinger-teller';

UPDATE products SET
  name = 'Mexikano',
  name_ar = 'مكسيكي',
  description = 'Hähnchenbrust mit Zwiebeln, Paprika, Champignon, Salat, Pommes & Sauce',
  price = 16.00,
  display_order = 60
WHERE slug = 'mexicano-teller';

UPDATE products SET
  name = 'Fajita',
  name_ar = 'فاهيتا',
  description = 'Hähnchenbrust mit Zwiebeln, Paprika, Champignon, Salat, Pommes & Sauce',
  price = 15.00,
  display_order = 70
WHERE slug = 'fajita-teller';

UPDATE products SET
  name = 'Dorade frittiert',
  name_ar = 'سمكة دورادو مقلية',
  description = 'Mit Salat, Pommes & Zitronensaft',
  price = 20.00,
  display_order = 120
WHERE slug = 'frittierter-fisch-teller';

UPDATE products SET
  name = 'Falafel mit Grillkäse',
  name_ar = 'فلافل حلومي',
  description = 'Mit Pommes, Salat und Hummus',
  price = 13.50,
  display_order = 150
WHERE slug = 'falafel-halloumi-teller';

UPDATE products SET
  name = 'Falafel Teller',
  name_ar = 'فلافل عربي',
  description = 'Mit Pommes, Salat und Hummus',
  price = 12.50,
  display_order = 160
WHERE slug = 'arabischer-falafel-teller';

-- ── New products + category assignment ───────────────────────────────────────

DO $$
DECLARE
  cat_plats UUID;
BEGIN
  SELECT id INTO cat_plats FROM categories WHERE slug = 'plats';

  -- 42 Hähnchenschnitzel
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Hähnchenschnitzel', 'haehnchenschnitzel',
    'Mit Salat, Pommes und Sauce',
    14.00, cat_plats, 30,
    'KITCHEN', true, 100, 20,
    'اسكالوب', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 43 Supreme
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Supreme', 'supreme',
    'Mit Salat, Champignon, Mozzarella, Pommes und Sauce',
    16.00, cat_plats, 40,
    'KITCHEN', true, 100, 20,
    'سوبريم', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 44 Cordon Blue
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Cordon Blue', 'cordon-blue',
    'Mit Salat, Reis, Nudeln (Pipe Rigate), Mais, Pommes & Béchamelsauce',
    16.00, cat_plats, 50,
    'KITCHEN', true, 100, 20,
    'كوردون بلو', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 47 Fajita Polo
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Fajita Polo', 'fajita-polo',
    'Lammfleisch mit Zwiebeln, Paprika, Champignon, Salat, Pommes & Sauce',
    17.00, cat_plats, 80,
    'KITCHEN', true, 100, 20,
    'فاهيتا بولو', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 48 Mandi mit Lammfleisch
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Mandi mit Lammfleisch', 'mandi-mit-lammfleisch',
    'Gewürzte Reis mit Lammfleisch, Salat & Tomatensoße',
    19.00, cat_plats, 90,
    'KITCHEN', true, 100, 25,
    'مندي لحم', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 49 Jordanisches Mansaf
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Jordanisches Mansaf', 'jordanisches-mansaf',
    'Gewürzte Reis mit Lammfleisch & Joghurtsoße',
    18.00, cat_plats, 100,
    'KITCHEN', true, 100, 25,
    'منسف اردني', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 50 Crispy Shrimps
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Crispy Shrimps', 'crispy-shrimps',
    'Frittierte Shrimps mit Reis oder Pommes',
    16.00, cat_plats, 110,
    'KITCHEN', true, 100, 20,
    'كريسبي قريدس', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 52 Hähnchenspieße im Tontopf
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Hähnchenspieße im Tontopf', 'haehnchenspiesse-im-tontopf',
    'Hähnchenbrust, Paprika, Champignon, Mozzarella & Béchamelsauce',
    17.00, cat_plats, 130,
    'KITCHEN', true, 100, 25,
    'شيش بالفخارة', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 53 Hackfleisch im Tontopf
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Hackfleisch im Tontopf', 'hackfleisch-im-tontopf',
    'Hackfleisch mit Tomatensoße oder Tahini (Sesampaste)',
    19.00, cat_plats, 140,
    'KITCHEN', true, 100, 25,
    'لحمة بالفخارة', '[]'::jsonb
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
