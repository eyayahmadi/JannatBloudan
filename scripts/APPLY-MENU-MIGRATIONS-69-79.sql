-- =============================================================================
-- APPLY MENU MIGRATIONS 69–79 (paste in Supabase Dashboard → SQL Editor → Run)
-- Safe to re-run: each migration uses idempotent UPDATE/INSERT ON CONFLICT.
-- After success, schema_migrations rows are inserted at the bottom.
-- =============================================================================

-- ── FIX-LEGACY-CATEGORY-NAMES.sql ──
-- =============================================================================
-- FIX — Legacy category name conflicts (run BEFORE menu migrations if needed)
--
-- Error: duplicate key value violates unique constraint "categories_name_key"
-- Cause: migration 13 created vorspeisen/waffel/pizza-de with names that
--        canonical slugs entrees/waffeln/pizza need later.
-- Safe to re-run.
-- =============================================================================

BEGIN;

UPDATE categories SET
  name = 'Vorspeisen [legacy]',
  is_active = false,
  description = COALESCE(description, '') || ' [deprecated — use entrees]'
WHERE slug = 'vorspeisen';

UPDATE categories SET
  name = 'Waffel [legacy]',
  is_active = false,
  description = COALESCE(description, '') || ' [deprecated — use waffeln]'
WHERE slug = 'waffel';

UPDATE categories SET
  name = 'Pizza [legacy]',
  is_active = false,
  description = COALESCE(description, '') || ' [deprecated — use pizza]'
WHERE slug = 'pizza-de';

COMMIT;

-- ── 69-menu-unified-catalog.sql ──
-- =============================================================================
-- 69 — Menu unifié : soft delete, nav_group, card_gradient (Admin = source de vérité)
-- Idempotent.
-- =============================================================================

BEGIN;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS nav_group VARCHAR(50);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS card_gradient VARCHAR(200);

ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN categories.nav_group IS
  'NULL = entrée nav autonome. hot-drinks | cold-drinks | desserts = regroupé sous page virtuelle QR.';
COMMENT ON COLUMN categories.card_gradient IS
  'Classes Tailwind gradient pour cartes QR (ex. from-amber-900 via-orange-900 to-stone-900).';
COMMENT ON COLUMN categories.deleted_at IS 'Soft delete — masqué des menus actifs, conservé pour historique.';
COMMENT ON COLUMN products.deleted_at IS 'Soft delete — masqué des menus actifs, conservé pour historique.';

CREATE INDEX IF NOT EXISTS idx_categories_active_menu
  ON categories (display_order, name)
  WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_active_menu
  ON products (category_id, display_order, name)
  WHERE is_archived = false AND deleted_at IS NULL;

-- Regroupement boissons / desserts existants (slug canoniques)
UPDATE categories SET nav_group = 'hot-drinks'
WHERE slug IN ('coffee', 'tea') AND (nav_group IS NULL OR nav_group = '');

UPDATE categories SET nav_group = 'cold-drinks'
WHERE slug IN (
  'water', 'soft-drinks', 'ice-tea', 'juices', 'iced-coffee',
  'cocktails', 'smoothies', 'milkshakes', 'banana-milk-cocktails', 'imperator'
) AND (nav_group IS NULL OR nav_group = '');

UPDATE categories SET nav_group = 'desserts'
WHERE section = 'desserts'
  AND slug NOT IN ('desserts')
  AND (nav_group IS NULL OR nav_group = '');

COMMIT;

-- ── 70-menu-page-1-vorspeisen-salate.sql ──
-- =============================================================================
-- 70 — Menu Page 1 : Vorspeisen + Salate (canonical sync, idempotent)
--
-- Updates ONLY categories entrees/salades and the 15 products listed on Page 1.
-- Does NOT delete or modify other products (e.g. gewuerzter-reis stays untouched).
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags.
-- =============================================================================

BEGIN;

-- ── Legacy name conflicts (migration 13 seeds) ─────────────────────────────
-- categories.name is UNIQUE. Deprecated slugs vorspeisen/waffel/pizza-de may
-- already hold names needed by canonical slugs entrees/waffeln/pizza.

UPDATE categories SET
  name = 'Vorspeisen [legacy]',
  is_active = false,
  description = COALESCE(description, '') || ' [deprecated — use entrees]'
WHERE slug = 'vorspeisen';

UPDATE categories SET
  name = 'Waffel [legacy]',
  is_active = false,
  description = COALESCE(description, '') || ' [deprecated — use waffeln]'
WHERE slug = 'waffel';

UPDATE categories SET
  name = 'Pizza [legacy]',
  is_active = false,
  description = COALESCE(description, '') || ' [deprecated — use pizza]'
WHERE slug = 'pizza-de';

-- ── Categories (Page 1 order) ───────────────────────────────────────────────

UPDATE categories SET
  name = 'Vorspeisen',
  name_ar = 'المقبلات',
  display_order = 10,
  is_active = true
WHERE slug = 'entrees';

UPDATE categories SET
  name = 'Salate',
  name_ar = 'السلطات',
  display_order = 20,
  is_active = true
WHERE slug = 'salades';

-- ── Vorspeisen (entrees) — products 01–11 ───────────────────────────────────

UPDATE products SET
  name = 'Hummus',
  name_ar = 'مسبحة',
  description = 'Kichererbsen paste mit Salz, Zitrone und Sesamsauce',
  price = 5.50,
  display_order = 10
WHERE slug = 'hummus';

UPDATE products SET
  name = 'Hummus mit Hackfleisch',
  name_ar = 'مسبحة مع لحمة',
  description = 'Kichererbsen paste mit Salz, Zitrone und Sesamsauce',
  price = 9.00,
  display_order = 20
WHERE slug = 'hummus-mit-hackfleisch';

UPDATE products SET
  name = 'Babağannouğ',
  name_ar = 'بابا غنوج',
  description = 'Gegrillte Auberginenpaste mit Salz, Zitrone und Sesamsauce',
  price = 5.50,
  display_order = 30
WHERE slug = 'baba-ghanoug';

UPDATE products SET
  name = 'Mutabbal',
  name_ar = 'متبل باذنجان',
  description = 'Gegrillte Auberginenpaste mit Knoblauch, Salz, Zitrone, Joghurt und Sesamsauce',
  price = 5.50,
  display_order = 40
WHERE slug = 'mutabbal';

UPDATE products SET
  name = 'Mohammara',
  name_ar = 'محمرة',
  description = 'Scharfe Paprikapaste mit Paniermehl, Walnusskerne, Zwiebeln, Knoblauch und Granatapfelsauce',
  price = 5.50,
  display_order = 50
WHERE slug = 'muhammara';

UPDATE products SET
  name = 'Veganer Weinblätter',
  name_ar = 'يالنجي ورق عنب',
  description = 'Gefüllte Weinblätter mit Reis in feiner saurer Sauce gekocht - (6 Stk.)',
  price = 7.00,
  display_order = 60
WHERE slug = 'veganer-weinblaetter';

UPDATE products SET
  name = 'Zigarrenbörek',
  name_ar = 'برك جبنة',
  description = 'Gefüllte Teigrolle mit Frischkäse, Petersilie und Eier - (4 Stk.)',
  price = 2.50,
  display_order = 70
WHERE slug = 'zigarrenburak';

UPDATE products SET
  name_ar = 'صحن بطاطا',
  price = 5.00,
  display_order = 90
WHERE slug = 'pommes-teller';

UPDATE products SET
  name = 'Chicken Nuggets',
  name_ar = 'ناغت دجاج',
  description = '6 Stück, mit Pommes',
  price = 6.50,
  display_order = 100
WHERE slug = 'chicken-nuggets-pommes';

UPDATE products SET
  name = 'Kebbeh frittiert (1 Stk.)',
  name_ar = 'كبة مقلية (1 حبة)',
  description = 'Bulgur, Hackfleisch, Walnusskerne, Granatapfelkerne und Gewürze',
  price = 4.00,
  display_order = 110
WHERE slug = 'kebbeh-frittiert';

UPDATE products SET
  name = 'Kebbeh gegrillt',
  name_ar = 'كبة مشوية',
  description = 'Bulgur, Hackfleisch, Walnusskerne, Granatapfelkerne und Gewürze',
  price = 5.00,
  display_order = 120
WHERE slug = 'gegrillte-kibbeh';

-- ── Salate (salades) — products 14–17 ───────────────────────────────────────

UPDATE products SET
  name = 'Gemichter Salat',
  name_ar = 'سلطة مشكلة',
  description = 'Eisbergsalat, Tomaten, Gurken, Zwiebeln, gewürzt mit Zitrone & Olivenöl',
  price = 7.00,
  display_order = 10
WHERE slug = 'salat';

UPDATE products SET
  name = 'Tabboleh',
  name_ar = 'تبولة',
  description = 'Feiner Bulgur, frische Petersilie, Minze, Tomaten, Frühlingszwiebeln, Gurken, gewürzt mit Zitrone, Salz & Olivenöl',
  price = 8.50,
  display_order = 20
WHERE slug = 'tabbouleh';

UPDATE products SET
  name = 'Fattosch',
  name_ar = 'فتوش',
  description = 'Römersalat mit Tomaten, Gurken, Frühlingszwiebeln, Radieschen, Petersilie, Minze, Sumack und Brötchenchips. Gewürzt mit Apfelessig, Zitrone, Salz & Olivenöl.',
  price = 7.50,
  display_order = 30
WHERE slug = 'fattoush';

UPDATE products SET
  name = 'Rucola Salat',
  name_ar = 'سلطة الجرجير',
  description = 'Rucola, Tomaten, Zwiebeln, Granatapfel, Zitronensaft & Olivenöl',
  price = 8.50,
  display_order = 40
WHERE slug = 'rucola-salat';

COMMIT;

-- ── 71-menu-page-2-burger-kleine-saj.sql ──
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

-- ── 72-menu-page-3-hauptgerichte-menu.sql ──
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

-- ── 73-menu-page-4-grillgerichte.sql ──
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

-- ── 74-menu-page-5-manakish-saj.sql ──
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

-- ── 75-menu-page-6-pizza.sql ──
-- =============================================================================
-- 75 — Menu Page 6 : Pizza (canonical sync, idempotent)
--
-- Updates category pizza and the 10 products listed (92–101).
-- All products matched by existing slug — no new records, no image changes.
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags.
-- =============================================================================

BEGIN;

-- ── Category ──────────────────────────────────────────────────────────────────

UPDATE categories SET
  name = 'Pizza',
  name_ar = 'بيتزا',
  description = 'Alle Pizzen (30 cm) und Backwaren werden aus Weizenmehl hergestellt.',
  display_order = 32,
  is_active = true
WHERE slug = 'pizza';

-- ── Products 92–101 ─────────────────────────────────────────────────────────

UPDATE products SET
  description = 'Frische Tomatensauce, Kaschkawal, Oregano',
  display_order = 10
WHERE slug = 'pizza-margherita';

UPDATE products SET
  name_ar = 'بيتزا الفصول الأربعة',
  description = 'Frische Tomatensauce, Mortadella, Oliven, Pilze, Paprika, Kaschkawal',
  display_order = 20
WHERE slug = 'pizza-quattro-stagioni';

UPDATE products SET
  description = 'Hähnchenstreifen, Pilze, Kaschkawal',
  display_order = 30
WHERE slug = 'pizza-hollandaise';

UPDATE products SET
  name = 'Pizza Sujuck und Ei',
  description = 'Sujuck, Spiegelei, Kaschkawal',
  price = 13.00,
  display_order = 40
WHERE slug = 'pizza-sucuk-ei';

UPDATE products SET
  name = 'Pizza Mozzarella und Tomaten',
  description = 'Mozzarella, Tomaten, Basilikum.',
  display_order = 50
WHERE slug = 'pizza-mozzarella-tomaten';

UPDATE products SET
  description = 'Hollandaise Sauce, Pilze, Kaschkawal, Mais, Oliven, Paprika',
  display_order = 60
WHERE slug = 'pizza-vegetarisch';

UPDATE products SET
  name_ar = 'بيتزا مرتديلا',
  description = 'Tomatensauce, Putenmortadella-Scheiben, Kaschkawal',
  display_order = 70
WHERE slug = 'pizza-putenmortadella';

UPDATE products SET
  description = 'Hähnchenstreifen, Mais, Paprika, Pilze, Jalapeños',
  price = 14.00,
  display_order = 80
WHERE slug = 'pizza-mexikano';

UPDATE products SET
  description = 'Frische Tomatensauce, Mozzarella, Rinder Salami',
  display_order = 90
WHERE slug = 'pizza-salami';

UPDATE products SET
  name = 'Pizza Tuna',
  name_ar = 'بيتزا تونا',
  description = 'Frische Tomatensauce, Kaschkawal, Tunfisch',
  price = 13.00,
  display_order = 100
WHERE slug = 'pizza-tonno';

COMMIT;

-- ── 76-menu-page-7-desserts.sql ──
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

-- ── 77-menu-page-8-waffel-crepes-cocktails.sql ──
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

-- ── 78-menu-page-9-smoothies-milkshakes-drinks.sql ──
-- =============================================================================
-- 78 — Menu Page 9 : Smoothie + Milchshake + Imperator + Bananenmilch + Ice Kaffee
--
-- Updates 5 categories and listed products (161–185, gaps intentional).
-- Creates 2 new products (kaffee-milkshake, lotus-milkshake).
-- Does NOT modify off-page imperator items, juices, coffee, shisha, etc.
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags
-- on existing products (except Avoca Free description/name_ar as specified).
-- =============================================================================

BEGIN;

-- ── Categories (exact order 49 → 53) ─────────────────────────────────────────

UPDATE categories SET
  name = 'Smoothie',
  name_ar = 'السموثي',
  display_order = 49,
  section = 'drinks',
  is_active = true
WHERE slug = 'smoothies';

UPDATE categories SET
  name = 'Milchshake',
  name_ar = 'ميلك شيك',
  display_order = 50,
  section = 'drinks',
  is_active = true
WHERE slug = 'milkshakes';

UPDATE categories SET
  name = 'Imperator',
  name_ar = 'إمبراطور',
  display_order = 51,
  section = 'special',
  is_active = true
WHERE slug = 'imperator';

UPDATE categories SET
  name = 'Bananenmilch-Cocktails',
  name_ar = 'كوكتيلات موز وحليب',
  display_order = 52,
  section = 'drinks',
  is_active = true
WHERE slug = 'banana-milk-cocktails';

UPDATE categories SET
  name = 'Ice Kaffee',
  name_ar = 'قهوة باردة',
  display_order = 53,
  section = 'drinks',
  is_active = true
WHERE slug = 'iced-coffee';

-- ── Smoothie 161–165 ──────────────────────────────────────────────────────────

UPDATE products SET
  price = 7.00,
  name_ar = 'بلودان سموثي',
  display_order = 10
WHERE slug = 'bloudan-smoothie';

UPDATE products SET
  name_ar = 'مانجو سموثي',
  display_order = 20
WHERE slug = 'mango-smoothie';

UPDATE products SET
  name_ar = 'فراولة سموثي',
  display_order = 30
WHERE slug = 'erdbeer-smoothie';

UPDATE products SET
  name_ar = 'أناناس سموثي',
  display_order = 40
WHERE slug = 'ananas-smoothie';

UPDATE products SET
  name = 'Polo',
  name_ar = 'ليمون و نعنع',
  price = 7.00,
  display_order = 50
WHERE slug = 'polo-smoothie';

-- ── Milchshake 166–171 ────────────────────────────────────────────────────────

UPDATE products SET
  name = 'Bloudan Milchshake',
  price = 8.50,
  display_order = 10
WHERE slug = 'bloudan-milkshake';

UPDATE products SET
  name = 'Erdbeere Milchshake',
  price = 7.50,
  display_order = 20
WHERE slug = 'erdbeer-milkshake';

UPDATE products SET
  name = 'Schoko Milchshake',
  name_ar = 'ميلك شيك شوكولا',
  price = 7.50,
  display_order = 30
WHERE slug = 'schokoladen-milkshake';

UPDATE products SET
  name = 'Oreo Milchshake',
  price = 7.50,
  display_order = 40
WHERE slug = 'oreo-milkshake';

INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
SELECT 'Kaffee Milchshake', 'kaffee-milkshake', 7.00, c.id, 50, 'BAR', true, 100, 10, 'ميلك شيك قهوة', '[]'::jsonb
FROM categories c WHERE c.slug = 'milkshakes'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  display_order = EXCLUDED.display_order;

INSERT INTO products (name, slug, price, category_id, display_order, station, is_available, stock_quantity, preparation_time, name_ar, tags)
SELECT 'Lotus Milchshake', 'lotus-milkshake', 7.50, c.id, 60, 'BAR', true, 100, 10, 'ميلك شيك لوتس', '[]'::jsonb
FROM categories c WHERE c.slug = 'milkshakes'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  display_order = EXCLUDED.display_order;

-- ── Imperator 174 ─────────────────────────────────────────────────────────────

UPDATE products SET
  name_ar = 'أفوكادو-فراولة-قشطة-عسل-مكسرات',
  description = 'Avocado, Erdbeere, Arabische Rahmcreme, Honig, Nüsse',
  display_order = 10
WHERE slug = 'imperator-avoca-free';

-- ── Bananenmilch-Cocktails 177–179 ────────────────────────────────────────────

UPDATE products SET
  name = 'Banane, Milch und Avocado',
  name_ar = 'موز و حليب و افوكادو',
  price = 7.00,
  display_order = 10
WHERE slug = 'banane-milch-avocado';

UPDATE products SET
  name = 'Banane, Milch und Erdbeere',
  name_ar = 'موز و حليب و فراولة',
  price = 7.00,
  display_order = 20
WHERE slug = 'banane-milch-erdbeere';

UPDATE products SET
  name = 'Banane, Milch und Schokolade',
  name_ar = 'موز و حليب و شوكولا',
  price = 7.00,
  display_order = 30
WHERE slug = 'banane-milch-schokolade';

-- ── Ice Kaffee 180–185 ────────────────────────────────────────────────────────

UPDATE products SET
  name = 'Ice Latte Macchiato',
  price = 6.50,
  display_order = 10
WHERE slug = 'iced-latte-macchiato';

UPDATE products SET
  name = 'Ice Latte Schoko',
  name_ar = 'آيس لاتيه شوكو',
  display_order = 20
WHERE slug = 'iced-latte-chocolate';

UPDATE products SET
  name = 'Ice Latte Vanillia',
  display_order = 30
WHERE slug = 'iced-latte-vanilla';

UPDATE products SET
  name = 'Ice Latte Karamell',
  price = 7.00,
  display_order = 40
WHERE slug = 'iced-latte-caramel';

UPDATE products SET
  price = 6.00,
  display_order = 50
WHERE slug = 'frappuccino';

UPDATE products SET
  name = 'Ice Mocha',
  display_order = 60
WHERE slug = 'iced-mocha';

COMMIT;

-- ── 79-menu-page-10-heissgetraenke-tee.sql ──
-- =============================================================================
-- 79 — Menu Page 10 : Heißgetränke + Tee (canonical sync, idempotent)
--
-- Updates 2 categories and listed products (213–225, 228–233, gaps intentional).
-- Moves tea products from coffee → tea category (separate canonical section).
-- Does NOT modify al-pacchino or other off-page coffee/tea items.
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags.
-- =============================================================================

BEGIN;

-- ── Categories (exact order 54 → 55) ─────────────────────────────────────────

UPDATE categories SET
  name = 'Heißgetränke',
  name_ar = 'المشروبات الساخنة',
  display_order = 54,
  section = 'drinks',
  is_active = true
WHERE slug = 'coffee';

UPDATE categories SET
  name = 'Tee',
  name_ar = 'شاي',
  display_order = 55,
  section = 'drinks',
  is_active = true
WHERE slug = 'tea';

-- ── Heißgetränke 213–225 ──────────────────────────────────────────────────────

UPDATE products SET
  name = 'Arabische Kaffee',
  price = 3.50,
  display_order = 10
WHERE slug = 'arabic-coffee';

UPDATE products SET
  price = 3.50,
  name_ar = 'اسبريسو',
  display_order = 20
WHERE slug = 'espresso';

UPDATE products SET
  price = 3.50,
  display_order = 30
WHERE slug = 'espresso-macchiato';

UPDATE products SET
  price = 4.50,
  display_order = 40
WHERE slug = 'cappuccino';

UPDATE products SET
  display_order = 50
WHERE slug = 'latte-macchiato';

UPDATE products SET
  name = 'Latte Schoko',
  name_ar = 'لاتيه شوكو',
  display_order = 60
WHERE slug = 'chocolate-latte';

UPDATE products SET
  name = 'Latte Vanille',
  display_order = 70
WHERE slug = 'vanilla-latte';

UPDATE products SET
  name = 'Latte Karamell',
  display_order = 80
WHERE slug = 'caramel-latte';

UPDATE products SET
  price = 3.50,
  display_order = 90
WHERE slug = 'americano';

UPDATE products SET
  display_order = 100
WHERE slug = 'flat-white';

UPDATE products SET
  name = 'Mokka',
  price = 5.00,
  display_order = 110
WHERE slug = 'mocha';

UPDATE products SET
  price = 5.00,
  name_ar = 'هوت شوكلت',
  display_order = 120
WHERE slug = 'hot-chocolate';

UPDATE products SET
  display_order = 130
WHERE slug = 'sahlab';

-- ── Tee 228–233 (category tea) ────────────────────────────────────────────────

UPDATE products SET
  display_order = 10,
  category_id = (SELECT id FROM categories WHERE slug = 'tea')
WHERE slug = 'schwarzer-tee';

UPDATE products SET
  name = 'Grüner Tee',
  display_order = 20,
  category_id = (SELECT id FROM categories WHERE slug = 'tea')
WHERE slug = 'gruen-tee';

UPDATE products SET
  name_ar = 'زنجبيل و ليمون',
  display_order = 30,
  category_id = (SELECT id FROM categories WHERE slug = 'tea')
WHERE slug = 'ingwer-zitrone';

UPDATE products SET
  name = 'Kamillentee',
  display_order = 40,
  category_id = (SELECT id FROM categories WHERE slug = 'tea')
WHERE slug = 'kamille-tee';

UPDATE products SET
  name = 'Matte',
  name_ar = 'متة',
  price = 6.00,
  display_order = 50,
  category_id = (SELECT id FROM categories WHERE slug = 'tea')
WHERE slug = 'mate';

UPDATE products SET
  name = 'Kreuzkümmel - Zitrone',
  name_ar = 'كمون وليمون',
  price = 3.00,
  display_order = 60,
  category_id = (SELECT id FROM categories WHERE slug = 'tea')
WHERE slug = 'cumin-lemon-tea';

COMMIT;

-- Mark as applied (skip if schema_migrations does not exist yet — run once)
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations (filename) VALUES
  ('FIX-LEGACY-CATEGORY-NAMES.sql'),
  ('69-menu-unified-catalog.sql'),
  ('70-menu-page-1-vorspeisen-salate.sql'),
  ('71-menu-page-2-burger-kleine-saj.sql'),
  ('72-menu-page-3-hauptgerichte-menu.sql'),
  ('73-menu-page-4-grillgerichte.sql'),
  ('74-menu-page-5-manakish-saj.sql'),
  ('75-menu-page-6-pizza.sql'),
  ('76-menu-page-7-desserts.sql'),
  ('77-menu-page-8-waffel-crepes-cocktails.sql'),
  ('78-menu-page-9-smoothies-milkshakes-drinks.sql'),
  ('79-menu-page-10-heissgetraenke-tee.sql')
ON CONFLICT (filename) DO NOTHING;
