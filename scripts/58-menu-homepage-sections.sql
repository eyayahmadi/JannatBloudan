-- =============================================================================
-- 58 — QR menu homepage promotional sections (Bestseller, Heute empfohlen, …)
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS menu_homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (section_key, product_id)
);

CREATE INDEX IF NOT EXISTS idx_menu_homepage_sections_key
  ON menu_homepage_sections(section_key, display_order)
  WHERE is_active = true;

COMMIT;
