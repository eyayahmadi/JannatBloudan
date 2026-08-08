-- =============================================================================
-- 80 — Add Limonade to canonical juices menu (#197)
--
-- New product: limonade ( juices category, after Kiba ).
-- Does NOT modify existing juice/water products.
-- Does NOT touch image_url (upload via assign-limonade-image.mjs).
-- =============================================================================

BEGIN;

INSERT INTO products (
  name, slug, description, price, category_id, display_order,
  station, is_available, stock_quantity, preparation_time,
  name_ar, tags
)
SELECT
  'Limonade',
  'limonade',
  'Erfrischende Limonade (0,35 L)',
  4.00,
  c.id,
  80,
  'BAR',
  true,
  100,
  5,
  'ليمونادا',
  '["halal","vegetarian","vegan"]'::jsonb
FROM categories c
WHERE c.slug = 'juices'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  display_order = EXCLUDED.display_order,
  station = EXCLUDED.station,
  is_available = true,
  is_archived = false;

COMMIT;
