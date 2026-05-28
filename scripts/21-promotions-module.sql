-- Extensions module Promotions / Offres / Réductions (ADMIN + caisse existante).
-- À exécuter sur Supabase après scripts POS (18-advanced-table-pos.sql).

ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS short_label VARCHAR(160);
ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS auto_apply BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS stackable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS visibility VARCHAR(32) NOT NULL DEFAULT 'all';
-- all | dine_in | delivery | qr_table | takeaway | catering | vip
ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS conditions_text TEXT;
ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS max_redemptions_per_user INTEGER;
ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS revenue_generated_cache NUMERIC(14, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_promotional_offers_visibility ON promotional_offers(visibility) WHERE archived_at IS NULL AND active = true;

COMMENT ON COLUMN promotional_offers.meta IS 'Conditions avancées: happy_hour[h0,h1], loyalty_min_orders, min_party_size (table), bxgy.buy_qty/get_qty/discount_pct, countdown_ends_at, ai_hint, segment (student|birthday…).';
