-- =============================================================================
-- 71 — Menu Page 2 : Burger + Kleine Gerichte + Saj Rolle (canonical sync)
--
-- Updates ONLY the 3 categories and 14 products listed on Page 2.
-- Does NOT modify unrelated categories (e.g. sandwiches) or their products.
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags
-- on existing products unless inserting genuinely new records.
-- =============================================================================

BEGIN;

-- ── Categories ────────────────────────────────────────────────────────────────

UPDATE categories SET
  name = 'Burger',
  name_ar = 'البرغر',
  display_order = 25,
  is_active = true
WHERE slug = 'burgers';

INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES (
  'Kleine Gerichte',
  'kleine-gerichte',
  'Kleine Gerichte',
  'food',
  26,
  true,
  '🍽️',
  'الوجبات الخفيفة'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES (
  'Saj Rolle',
  'saj-rolle',
  'Alle Sandwiches werden in frisch gebackenem Saj-Fladenbrot zubereitet.',
  'food',
  27,
  true,
  '🌯',
  'ساندويش'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- ── Burger — products 20–24 ─────────────────────────────────────────────────

UPDATE products SET
  description = 'Rindfleisch-Patty, Salat, Tomaten, Zwiebeln und Gewürzgurken',
  price = 11.00,
  display_order = 10
WHERE slug = 'klassik-burger';

UPDATE products SET
  name = 'Chees Burger',
  name_ar = 'برغر بالجبنة',
  description = 'Rindfleisch-Patty, Salat, Tomaten, Zwiebeln, Gewürzgurken und Cheddar Käse',
  price = 12.00,
  display_order = 20
WHERE slug = 'cheeseburger';

UPDATE products SET
  name = 'Spicy Cheddar Cheeseburger',
  name_ar = 'برغر حار بالجبنة',
  description = 'Rindfleisch-Patty, Cheddar Käse, Salat, Zwiebeln, Jalapeños',
  price = 12.50,
  display_order = 30
WHERE slug = 'spicy-cheeseburger';

UPDATE products SET
  name = 'Bludan Burger',
  description = '2 Rindfleisch-Patty, 2 Eier, 2x Cheddar Käse, Salat, Tomaten, Röstzwiebeln, Jalapeños',
  price = 14.50,
  display_order = 40
WHERE slug = 'bloudan-burger';

UPDATE products SET
  name_ar = 'كريسبي برغر',
  description = 'Crispy Chicken-Patty, Salat, Tomaten, Zwiebeln, BBQ Sauce',
  price = 11.50,
  display_order = 50
WHERE slug = 'crispy-chicken-burger';

-- ── Kleine Gerichte + Saj Rolle — new products + chicken-fries move ─────────

DO $$
DECLARE
  cat_kleine UUID;
  cat_saj UUID;
BEGIN
  SELECT id INTO cat_kleine FROM categories WHERE slug = 'kleine-gerichte';
  SELECT id INTO cat_saj FROM categories WHERE slug = 'saj-rolle';

  -- 27 Rizo
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Rizo', 'rizo',
    'Reis, Crispy Chicken & BBQ Sauce',
    8.50, cat_kleine, 10,
    'KITCHEN', true, 100, 15,
    'ريزو', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 28 Chicken Fries (existing — move category, update listed fields only)
  UPDATE products SET
    name_ar = 'تشيكن فرايز',
    description = 'Crispy mit Pommes & Cheddar Käse',
    price = 8.50,
    category_id = cat_kleine,
    display_order = 20
  WHERE slug = 'chicken-fries';

  -- 29 Sauercreme Kumpir
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Sauercreme Kumpir', 'sauercreme-kumpir',
    'Ofenkartoffel mit Käse, Butter, Sour Cream, Mayonnaise & Petersilie.',
    8.00, cat_kleine, 30,
    'KITCHEN', true, 100, 15,
    'بطاطا مشوية بالكريمة', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 30 Aioli Kumpir
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Aioli Kumpir', 'aioli-kumpir',
    'Ofenkartoffel mit Käse, Butter, Aioli (Knoblauch-Mayonnaise), Essig, Pfeffer, Zucker & Oregano.',
    8.00, cat_kleine, 40,
    'KITCHEN', true, 100, 15,
    'بطاطا مشوية بالايولي', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 31 Guacamole Kumpir
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Guacamole Kumpir', 'guacamole-kumpir',
    'Ofenkartoffel mit Käse, Butter und Guacamole (Avocado, Knoblauch & Zwiebeln).',
    10.00, cat_kleine, 50,
    'KITCHEN', true, 100, 15,
    'بطاطا مشوية بالأفوكادو', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 34 Hackfleisch mit Knoblauch Rolle
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Hackfleisch mit Knoblauch Rolle', 'hackfleisch-knoblauch-rolle',
    'Arabisches Fladenbrot, Ketchup, eingelegte Gurken',
    7.00, cat_saj, 10,
    'KITCHEN', true, 100, 15,
    'ساندويش سجق', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 35 Hähnchenspieß Rolle
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Hähnchenspieß Rolle', 'haehnchenspiess-rolle',
    'Arabisches Fladenbrot, Mayo, eingelegte Gurken',
    7.00, cat_saj, 20,
    'KITCHEN', true, 100, 15,
    'ساندويش شيش', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 36 Burger Rolle
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Burger Rolle', 'burger-rolle',
    'Arabisches Fladenbrot, Cocktailsoße, Salat, Tomaten & eingelegte Gurken',
    7.00, cat_saj, 30,
    'KITCHEN', true, 100, 15,
    'ساندويش برغر', '[]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

  -- 37 Lammfleisch Rolle
  INSERT INTO products (
    name, slug, description, price, category_id, display_order,
    station, is_available, stock_quantity, preparation_time,
    name_ar, tags
  ) VALUES (
    'Lammfleisch Rolle', 'lammfleisch-rolle',
    'Arabisches Fladenbrot, Cocktailsoße, Salat, Tomaten & eingelegte Gurken',
    9.00, cat_saj, 40,
    'KITCHEN', true, 100, 15,
    'ساندويش شرحات لحم', '[]'::jsonb
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
