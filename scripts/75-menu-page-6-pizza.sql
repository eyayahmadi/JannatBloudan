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
