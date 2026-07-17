-- =============================================================================
-- 67 — Plats Arabic label + QR nav (Bar merged into Kalte Getränke in app code)
-- Products stay in their DB categories (juices, cocktails, etc.).
-- =============================================================================

BEGIN;

UPDATE categories
SET name_ar = 'الوجبات'
WHERE slug = 'plats'
  AND (name_ar IS NULL OR name_ar <> 'الوجبات');

COMMIT;

SELECT slug, name, name_ar FROM categories WHERE slug = 'plats';
