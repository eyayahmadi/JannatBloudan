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
