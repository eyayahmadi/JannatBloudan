-- =============================================================================
-- 76 — Menu Page 7 : Desserts (Mini Pancakes → Kuchen)
--
-- Updates 6 dessert categories and listed products (104–132, gaps intentional).
-- Creates 4 new products: pan-cake-bloudan/lotus/dubai, bloudan-eisbecher.
-- Does NOT modify pancake-nature, waffle-nature, crepes, off-page items.
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags
-- on existing products.
-- =============================================================================

BEGIN;

-- ── Categories (exact order 1→6) ─────────────────────────────────────────────

UPDATE categories SET
  name = 'Mini Pancakes',
  name_ar = 'ميني بان كيك',
  display_order = 40,
  section = 'desserts',
  is_active = true
WHERE slug = 'pancakes';

UPDATE categories SET
  name = 'Frische Obstsalate',
  name_ar = 'سلطات الفواكه',
  description = 'Alle Obstsalate werden mit Eis und arabischer Ashta serviert.',
  display_order = 41,
  section = 'desserts',
  is_active = true
WHERE slug = 'fruit-salads';

UPDATE categories SET
  name = 'Snacks',
  name_ar = 'سناكات',
  display_order = 42,
  section = 'desserts',
  is_active = true
WHERE slug = 'snacks';

UPDATE categories SET
  name = 'Ice Cream',
  name_ar = 'آيس كريم',
  display_order = 43,
  section = 'desserts',
  is_active = true
WHERE slug = 'ice-cream';

UPDATE categories SET
  name = 'Cheesecake',
  name_ar = 'تشيز كيك',
  display_order = 44,
  section = 'desserts',
  is_active = true
WHERE slug = 'cheesecakes';

UPDATE categories SET
  name = 'Kuchen',
  name_ar = 'تورتة',
  display_order = 45,
  section = 'desserts',
  is_active = true
WHERE slug = 'cakes';

-- ── Mini Pancakes 104–106 (new) ─────────────────────────────────────────────

DO $$
DECLARE
  cat_pancakes UUID;
BEGIN
  SELECT id INTO cat_pancakes FROM categories WHERE slug = 'pancakes';

  INSERT INTO products (
    name, slug, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Pan Cake Bloudan', 'pan-cake-bloudan',
    10.50, cat_pancakes, 10,
    'BAR', true, 100, 15,
    'بان كيك بلودان', '[]'::jsonb
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
    'Pan Cake Lotus', 'pan-cake-lotus',
    10.50, cat_pancakes, 20,
    'BAR', true, 100, 15,
    'بان كيك لوتس', '[]'::jsonb
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
    'Pan Cake Dubai', 'pan-cake-dubai',
    12.50, cat_pancakes, 30,
    'BAR', true, 100, 15,
    'بان كيك دبي', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;
END $$;

-- ── Frische Obstsalate 109–111 ────────────────────────────────────────────────

UPDATE products SET
  name = 'Bloudan Obstsalat',
  price = 12.00,
  display_order = 10
WHERE slug = 'fruit-salad-bloudan';

UPDATE products SET
  name = 'Lotus Obstsalat',
  price = 11.00,
  display_order = 20
WHERE slug = 'fruit-salad-lotus';

UPDATE products SET
  name = 'Dubai Obstsalat',
  price = 12.50,
  display_order = 30
WHERE slug = 'fruit-salad-dubai';

-- ── Snacks 114–115 ────────────────────────────────────────────────────────────

UPDATE products SET
  name = 'Natchos',
  name_ar = 'ناتشوس',
  display_order = 10
WHERE slug = 'chips-noix';

UPDATE products SET
  name = 'Nüsse',
  display_order = 20
WHERE slug = 'noix';

-- ── Ice Cream 118–122 ─────────────────────────────────────────────────────────

INSERT INTO products (
  name, slug, price, category_id, display_order,
  station, is_available, stock_quantity, preparation_time,
  name_ar, tags
)
SELECT
  'Bloudan Eisbecher', 'bloudan-eisbecher',
  8.00, c.id, 10,
  'BAR', true, 100, 10,
  'بوظة بلودان', '[]'::jsonb
FROM categories c
WHERE c.slug = 'ice-cream'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  display_order = EXCLUDED.display_order;

UPDATE products SET
  name = 'Arabisch Eisbecher',
  name_ar = 'بوظة عربية',
  display_order = 20
WHERE slug = 'coupe-arabe';

UPDATE products SET
  name = 'Vanillia Eisbecher',
  name_ar = 'فانيليا آيس',
  display_order = 30
WHERE slug = 'eis-vanille';

UPDATE products SET
  name = 'Erdbeer Eisbecher',
  name_ar = 'فراولة آيس',
  display_order = 40
WHERE slug = 'eis-fraise';

UPDATE products SET
  name = 'Schoko Eisbecher',
  name_ar = 'شوكو آيس',
  display_order = 50
WHERE slug = 'eis-chocolat';

-- ── Cheesecake 125–128 ────────────────────────────────────────────────────────

UPDATE products SET
  name = 'Bloudan Cheesecake',
  price = 10.50,
  display_order = 10
WHERE slug = 'cheesecake-bloudan';

UPDATE products SET
  name = 'Lotus Cheesecake',
  price = 9.50,
  display_order = 20
WHERE slug = 'cheesecake-lotus';

UPDATE products SET
  name = 'Dubai Cheesecake',
  price = 10.50,
  display_order = 30
WHERE slug = 'cheesecake-dubai';

UPDATE products SET
  name = 'Oreo Cheesecake',
  price = 9.50,
  display_order = 40
WHERE slug = 'cheesecake-oreo';

-- ── Kuchen 131–132 ────────────────────────────────────────────────────────────

UPDATE products SET
  display_order = 10
WHERE slug = 'molten-cake';

UPDATE products SET
  name = 'Brownies Cake',
  name_ar = 'براونيز كيك',
  price = 5.50,
  display_order = 20
WHERE slug = 'brownie-cake';

COMMIT;
