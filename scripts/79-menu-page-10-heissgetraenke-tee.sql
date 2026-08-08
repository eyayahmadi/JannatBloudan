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
