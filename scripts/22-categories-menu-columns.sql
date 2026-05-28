-- Cas schéma minimal (script 01) : colonnes menu digital manquantes.
-- À exécuter sur Supabase si l’erreur "column categories_1.section does not exist".
-- Aligné avec scripts/13-digital-menu-and-stock.sql

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS section VARCHAR(32) NOT NULL DEFAULT 'food';
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_ar VARCHAR(200);
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS icon_emoji VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_categories_section ON categories (section, display_order);

COMMENT ON COLUMN categories.section IS 'food | desserts | drinks | special';
