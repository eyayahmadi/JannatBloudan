-- =============================================================================
-- 77 — Menu Page 8 : Waffel + Crepes + Cocktails (canonical sync, idempotent)
--
-- Updates 3 categories and listed products (135–158, gaps intentional).
-- Creates 14 new products (6 waffles, 5 crepes, 3 cocktails).
-- Does NOT modify waffle-nature, crepe-nature, or off-page cocktail/smoothie items.
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags
-- on existing products.
-- =============================================================================

BEGIN;

-- ── Categories (exact order) ──────────────────────────────────────────────────

UPDATE categories SET
  name = 'Waffel',
  name_ar = 'وافل',
  display_order = 46,
  section = 'desserts',
  is_active = true
WHERE slug = 'waffeln';

UPDATE categories SET
  name = 'Crepes',
  name_ar = 'كريب',
  display_order = 47,
  section = 'desserts',
  is_active = true
WHERE slug = 'crepes';

UPDATE categories SET
  name = 'Cocktails',
  name_ar = 'كوكتيلات غريبة',
  display_order = 48,
  section = 'drinks',
  is_active = true
WHERE slug = 'cocktails';

-- ── Waffel 135–140 (new) ──────────────────────────────────────────────────────

DO $$
DECLARE
  cat_waffeln UUID;
BEGIN
  SELECT id INTO cat_waffeln FROM categories WHERE slug = 'waffeln';

  INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Waffel Bloudan', 'waffle-bloudan', 16.00, cat_waffeln, 10, 'BAR', true, 100, 15, 'وافل بلودان', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

  INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Waffel Dubai', 'waffle-dubai', 14.00, cat_waffeln, 20, 'BAR', true, 100, 15, 'وافل دبي', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

  INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Waffel Schoko', 'waffle-schoko', 11.00, cat_waffeln, 30, 'BAR', true, 100, 15, 'وافل شوكو', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

  INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Waffel Ice-kreem', 'waffle-ice-kreem', 12.00, cat_waffeln, 40, 'BAR', true, 100, 15, 'وافل ايس كريم', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

  INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Waffel Oreo', 'waffle-oreo', 12.00, cat_waffeln, 50, 'BAR', true, 100, 15, 'وافل اوريو', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

  INSERT INTO products (name, slug, description, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Waffel Sticks', 'waffle-sticks', 'Mit Sauce nach Wahl', 12.00, cat_waffeln, 60, 'BAR', true, 100, 15, 'وافل اصابع', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, description = EXCLUDED.description, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;
END $$;

-- ── Crepes 143–147 (new) ──────────────────────────────────────────────────────

DO $$
DECLARE
  cat_crepes UUID;
BEGIN
  SELECT id INTO cat_crepes FROM categories WHERE slug = 'crepes';

  INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Crepe Bloudan', 'crepe-bloudan', 13.50, cat_crepes, 10, 'BAR', true, 100, 15, 'كريب بلودان', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

  INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Crepe Lotus', 'crepe-lotus', 11.00, cat_crepes, 20, 'BAR', true, 100, 15, 'كريب لوتس', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

  INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Crepe Dubai', 'crepe-dubai', 12.50, cat_crepes, 30, 'BAR', true, 100, 15, 'كريب دبي', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

  INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Crepe Schoko', 'crepe-schoko', 10.50, cat_crepes, 40, 'BAR', true, 100, 15, 'كريب شوكولا', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

  INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
  VALUES ('Crepe Brownies', 'crepe-brownies', 12.50, cat_crepes, 50, 'BAR', true, 100, 15, 'كريب براونيز', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;
END $$;

-- ── Cocktails 150–158 ─────────────────────────────────────────────────────────

UPDATE products SET price = 7.00, display_order = 10 WHERE slug = 'mojito';

UPDATE products SET price = 7.00, display_order = 20 WHERE slug = 'erdbeer-mojito';

UPDATE products SET
  name = 'Maracuja',
  name_ar = 'ماراكويا',
  price = 6.50,
  display_order = 30
WHERE slug = 'maracuja-splash';

UPDATE products SET
  name_ar = 'سويت اناناس',
  price = 6.50,
  display_order = 40
WHERE slug = 'sweet-ananas';

UPDATE products SET price = 6.50, display_order = 50 WHERE slug = 'ipanema';

UPDATE products SET
  name = 'Jamaika',
  price = 6.50,
  display_order = 60
WHERE slug = 'jamaica';

INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
SELECT 'Redbull Mojito', 'redbull-mojito', 7.50, c.id, 70, 'BAR', true, 100, 10, 'موهيتو ريدبول', '[]'::jsonb
FROM categories c WHERE c.slug = 'cocktails'
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
SELECT 'Wassermelone Mojito', 'wassermelone-mojito', 7.50, c.id, 80, 'BAR', true, 100, 10, 'موهيتو بطيخ', '[]'::jsonb
FROM categories c WHERE c.slug = 'cocktails'
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
SELECT 'Lavendel Mojito', 'lavendel-mojito', 7.50, c.id, 90, 'BAR', true, 100, 10, 'موهيتو لافندر', '[]'::jsonb
FROM categories c WHERE c.slug = 'cocktails'
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, price = EXCLUDED.price, category_id = EXCLUDED.category_id, display_order = EXCLUDED.display_order;

COMMIT;
