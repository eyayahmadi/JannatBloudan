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
