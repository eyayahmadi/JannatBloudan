-- =============================================================================
-- FIX — Add Limonade (#197 Kaltgetränke page)
-- Run in Supabase SQL Editor. Safe to re-run.
-- =============================================================================

BEGIN;

INSERT INTO products (
  name, slug, description, price, category_id, display_order,
  station, is_available, stock_quantity, preparation_time,
  name_ar, tags, is_archived
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
  '["halal","vegetarian","vegan"]'::jsonb,
  false
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

SELECT p.slug, p.name, p.name_ar, p.price, p.display_order, c.slug AS category
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.slug = 'limonade';
