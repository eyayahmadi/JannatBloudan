-- =============================================================================
-- 74 — Menu Page 5 : Manakish + Saj (canonical sync, idempotent)
--
-- Updates manakish category + 9 manakish products (72–80).
-- Creates saj category + 9 saj products (81–89), separate from saj-rolle.
-- Does NOT merge Za'atar/Muhammara across categories.
-- Does NOT modify other manakish products (lammacun, spezial-bloudan, etc.).
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags
-- on existing products.
-- =============================================================================

BEGIN;

-- ── Categories ────────────────────────────────────────────────────────────────

UPDATE categories SET
  name = 'Manakish',
  name_ar = 'المناقيش',
  display_order = 30,
  is_active = true
WHERE slug = 'manakish';

INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES (
  'Saj',
  'saj',
  'Saj',
  'food',
  31,
  true,
  '🫓',
  'صاج'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- ── Manakish products 72–80 ───────────────────────────────────────────────────

UPDATE products SET
  name = 'Manakish à la Souria',
  name_ar = 'مناقيش سوريه',
  description = '2x Käse, 2x Lahmacun, 2x Za''atar, 2x Muhammara, 2x Spinat',
  display_order = 10
WHERE slug = 'manakish-a-la-souradia';

UPDATE products SET
  description = 'Käse-Fleisch, Hackfleisch (Gehacktes), Käse (meistens Mozzarella), Gewürze.',
  price = 5.00,
  display_order = 20
WHERE slug = 'manakish-toshka';

UPDATE products SET
  name = 'Za''atar',
  description = 'Za''atar (Gewürzmischung aus Thymian, Sesam und Sumach), Olivenöl.',
  price = 3.00,
  display_order = 30
WHERE slug = 'manakish-zaatar';

UPDATE products SET
  name = 'Za''atar mit Käse',
  name_ar = 'زعتر بالجبنة',
  description = 'Za''atar (Gewürzmischung aus Thymian, Sesam und Sumach), Olivenöl, Kaschkawal.',
  price = 3.50,
  display_order = 40
WHERE slug = 'manakish-zaatar-mit-kaese';

UPDATE products SET
  name_ar = 'جبنة',
  description = 'Akkawi Käse, Ei & Petersilie',
  price = 4.00,
  display_order = 50
WHERE slug = 'manakish-kaese-pide';

UPDATE products SET
  name = 'Kaschkawal Calzone',
  name_ar = 'قشقوان',
  price = 3.50,
  display_order = 60
WHERE slug = 'manakish-calazoni';

UPDATE products SET
  name_ar = 'محمرة قشقوان',
  description = 'Muhammara (Paprikapasta Scharf oder Mild), Kaschkawal.',
  price = 3.50,
  display_order = 70
WHERE slug = 'manakish-muhammara-kaschkawal';

UPDATE products SET
  description = 'Spinat, Zwiebeln, Walnuss, Granatapfelkerne, Gewürze.',
  price = 3.50,
  display_order = 80
WHERE slug = 'manakish-spinat-dreieckig';

UPDATE products SET
  description = 'mit gehackter Sucuk',
  price = 5.00,
  display_order = 90
WHERE slug = 'manakish-sucuk-calzone';

-- ── Saj products 81–89 (new category — distinct slugs) ───────────────────────

DO $$
DECLARE
  cat_saj UUID;
BEGIN
  SELECT id INTO cat_saj FROM categories WHERE slug = 'saj';

  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Za''atar', 'saj-zaatar',
    'Fladenbrot mit Za''atar (Gewürzmischung aus Thymian, Sesam und Sumach), Olivenöl.',
    3.00, cat_saj, 10,
    'KITCHEN', true, 100, 10,
    'زعتر', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  INSERT INTO products (
    name, slug, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Za''atar mit Kaschkawal', 'saj-zaatar-mit-kaschkawal',
    3.50, cat_saj, 20,
    'KITCHEN', true, 100, 10,
    'زعتر بالجبنة', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Muhammara', 'saj-muhammara',
    'Fladenbrot mit Muhammara (Paprikapasta Scharf oder Mild), Kaschkaval-Käse.',
    3.00, cat_saj, 30,
    'KITCHEN', true, 100, 10,
    'محمرة', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  INSERT INTO products (
    name, slug, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Kaschkawal', 'saj-kaschkawal',
    3.50, cat_saj, 40,
    'KITCHEN', true, 100, 10,
    'قشقوان', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  INSERT INTO products (
    name, slug, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Muhammara mit Kaschkawal', 'saj-muhammara-kaschkawal',
    3.50, cat_saj, 50,
    'KITCHEN', true, 100, 10,
    'محمرة قشقوان', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  INSERT INTO products (
    name, slug, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Mortadella mit Kaschkawal', 'saj-mortadella-kaschkawal',
    4.00, cat_saj, 60,
    'KITCHEN', true, 100, 10,
    'مرتديلا بقشقوان', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  INSERT INTO products (
    name, slug, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Pizza', 'saj-pizza',
    7.00, cat_saj, 70,
    'KITCHEN', true, 100, 15,
    'بيتزا', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  INSERT INTO products (
    name, slug, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Nutella', 'saj-nutella',
    3.50, cat_saj, 80,
    'KITCHEN', true, 100, 10,
    'نوتيلا', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Honig mit Ashta', 'saj-honig-ashta',
    'Milchcreme mit Honig & Pistazien',
    6.00, cat_saj, 90,
    'KITCHEN', true, 100, 10,
    'قشطة وعسل', '[]'::jsonb
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
