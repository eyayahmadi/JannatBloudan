-- =============================================================================
-- Migration 18 — Tables avancées : invités / split factures, transfert table,
-- hospitalité / offert maison, annulations lignes, offres promo, paiements reliés aux invités.
-- Idempotent. Exécutez après 04, 06, 15 (invoices + table_sessions restaurant_tables).
-- -----------------------------------------------------------------------------
-- Les rapports « revenu net » doivent exclure billing_type IN ('hospitality','complimentary')
-- et status = 'cancelled'. Utiliser colonnes revenue_exclude / flags ci-dessous.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Invités sous une même session physique (split commande / split paiement)
-- AVANT les ALTER qui référencent guest_sessions(id).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guest_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_session_id    UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
  label                VARCHAR(120) NOT NULL DEFAULT 'Invité',
  sort_order           SMALLINT NOT NULL DEFAULT 0,
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_guest_sessions_parent ON guest_sessions(parent_session_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_open ON guest_sessions(closed_at) WHERE closed_at IS NULL;

COMMENT ON TABLE guest_sessions IS
  'Sous-session invité au sein d’un table_sessions : plusieurs paniers / factures possibles.';

-- -----------------------------------------------------------------------------
-- Historique transfert table (sans DELETE des commandes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS table_session_transfers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
  from_table_id    INTEGER NOT NULL REFERENCES restaurant_tables(id),
  to_table_id      INTEGER NOT NULL REFERENCES restaurant_tables(id),
  performed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  reason           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_table_session_transfer_session ON table_session_transfers(session_id);
CREATE INDEX IF NOT EXISTS idx_table_session_transfer_created ON table_session_transfers(created_at DESC);

-- -----------------------------------------------------------------------------
-- Extensions factures — hospitalité / complémentaires / exclusions revenus
-- -----------------------------------------------------------------------------
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_type VARCHAR(28) NOT NULL DEFAULT 'normal';
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_billing_type_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_billing_type_check
  CHECK (billing_type IN ('normal', 'hospitality', 'complimentary'));

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS hospitality_reason TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS revenue_exclude BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN invoices.revenue_exclude IS 'true pour hospitalité/offert : hors CA net rapports.';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gross_before_discount DECIMAL(14, 2);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS offer_snapshot JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN invoices.offer_snapshot IS 'Offres appliquées (nom, type, montant rabais) pour traçabilité caisse.';

-- -----------------------------------------------------------------------------
-- Lignes facture — statut opérationnel + annulation partielle + gaspillage
-- -----------------------------------------------------------------------------
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL;

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS line_status VARCHAR(32) NOT NULL DEFAULT 'ordered';
ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS invoice_items_line_status_check;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_line_status_check
  CHECK (line_status IN (
    'ordered', 'sent_station', 'preparing', 'ready', 'served',
    'paid', 'unpaid', 'cancelled', 'offered', 'waste'
  ));

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS offered_by_maison BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS waste_loss BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_invoice_items_status ON invoice_items(line_status);

-- -----------------------------------------------------------------------------
-- Commandes — lien optionnel à un invité
-- -----------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- Paiements — groupe « tout payer ensemble » + split par invité
-- -----------------------------------------------------------------------------
ALTER TABLE payments ADD COLUMN IF NOT EXISTS guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_batch_id UUID;
CREATE INDEX IF NOT EXISTS idx_payments_batch ON payments(payment_batch_id) WHERE payment_batch_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Offres / promos (catalogue admin)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promotional_offers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(200) NOT NULL,
  offer_type         VARCHAR(40) NOT NULL,
    -- percentage | fixed_amount | bogo | happy_hour | category | product | event | promo_code
  value_num          NUMERIC(14, 4),
  promo_code         VARCHAR(64) UNIQUE,
  product_ids        UUID[] DEFAULT ARRAY[]::UUID[],
  category_keys      TEXT[] DEFAULT ARRAY[]::TEXT[],
  min_order_amount   NUMERIC(14, 2),
  usage_limit        INTEGER,
  usage_count        INTEGER NOT NULL DEFAULT 0,
  starts_at          TIMESTAMPTZ,
  ends_at            TIMESTAMPTZ,
  active             BOOLEAN NOT NULL DEFAULT true,
  created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta               JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_promotional_offers_active ON promotional_offers(active) WHERE active = true;

DROP TRIGGER IF EXISTS update_promotional_offers_updated_at ON promotional_offers;
CREATE TRIGGER update_promotional_offers_updated_at
  BEFORE UPDATE ON promotional_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Liaison trace offre ↔ facture (montant épargné réel au moment du scan)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_offer_redemptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      VARCHAR(40) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  offer_id        UUID NOT NULL REFERENCES promotional_offers(id) ON DELETE CASCADE,
  amount_saved    NUMERIC(14, 2) NOT NULL DEFAULT 0,
  applied_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  reason_note     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invoice_id, offer_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_offer_red_invoice ON invoice_offer_redemptions(invoice_id);
