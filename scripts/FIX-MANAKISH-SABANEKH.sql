-- =============================================================================
-- FIX — Manakish Sabanekh / Spinat Dreieckig (slug: manakish-spinat-dreieckig)
-- Run in Supabase SQL Editor if product missing or hard to find.
-- Safe to re-run (idempotent).
-- =============================================================================

BEGIN;

-- Ensure manakish category active
UPDATE categories SET is_active = true, name = 'Manakish', name_ar = 'المناقيش'
WHERE slug = 'manakish';

-- Restore / update canonical spinach manakish (#79)
INSERT INTO products (
  name, slug, description, price, category_id, display_order,
  station, is_available, stock_quantity, preparation_time,
  name_ar, tags, is_archived
)
SELECT
  'Spinat Dreieckig',
  'manakish-spinat-dreieckig',
  'Spinat, Zwiebeln, Walnuss, Granatapfelkerne, Gewürze.',
  3.50,
  c.id,
  80,
  'KITCHEN',
  true,
  100,
  10,
  'سبانخ',
  '["vegetarian","vegan","halal"]'::jsonb,
  false
FROM categories c
WHERE c.slug = 'manakish'
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

-- Verify:
SELECT p.slug, p.name, p.name_ar, p.price, p.display_order, p.is_available, p.is_archived, c.slug AS category
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.slug = 'manakish-spinat-dreieckig';
