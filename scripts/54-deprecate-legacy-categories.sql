-- Deprecate empty legacy categories from migration 13 (replaced by entrees / waffeln).
-- Safe: no products reference these categories; menu API filters is_active = true.

UPDATE categories
SET
  is_active = false,
  description = CASE
    WHEN slug = 'vorspeisen' THEN 'Legacy — replaced by category « entrees ». [deprecated]'
    WHEN slug = 'waffel' THEN 'Legacy — replaced by category « waffeln ». [deprecated]'
    ELSE description
  END
WHERE slug IN ('vorspeisen', 'waffel')
  AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.category_id = categories.id
  );
