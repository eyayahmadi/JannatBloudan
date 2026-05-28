-- =============================================================================
-- Migration 28 — Entrées caisse externes (Lieferando, Wolt, Uber Eats, virement, …)
-- Idempotente. À exécuter après scripts/14 et scripts/17.
--
-- Objectif :
--   Permettre au caissier d'enregistrer une entrée d'argent qui ne provient
--   PAS d'une table du restaurant (plateformes de livraison, virement bancaire,
--   versement plateforme, etc.). Distincte d'un encaissement de facture.
--
-- Logique :
--   - Une ligne dans `external_cash_incomes` est créée pour CHAQUE entrée.
--   - Si la méthode = 'cash', un mouvement `cash_register_movements`
--     de kind = 'entree_externe' est aussi créé pour rendre l'argent
--     visible dans le tiroir et la clôture.
--   - Pour les méthodes non-cash (card / online / bank_transfer / platform_payout)
--     l'entrée est uniquement comptable.
-- =============================================================================

-- 1) Étendre les kinds autorisés sur cash_register_movements
ALTER TABLE cash_register_movements DROP CONSTRAINT IF EXISTS cash_register_movements_kind_check;
ALTER TABLE cash_register_movements ADD CONSTRAINT cash_register_movements_kind_check
  CHECK (kind IN (
    'sortie_caisse',
    'avance_client',
    'ajustement',
    'avance_salaire',
    'annulation_sortie',
    'entree_externe'
  ));

-- 2) Table des entrées caisse externes
CREATE TABLE IF NOT EXISTS external_cash_incomes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source             VARCHAR(40) NOT NULL
    CHECK (source IN (
      'lieferando',
      'wolt',
      'uber_eats',
      'just_eat',
      'glovo',
      'deliveroo',
      'bank_transfer',
      'platform_payout',
      'other'
    )),
  source_label       TEXT,                       -- libellé libre quand source = 'other' (ou complément)
  amount             NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency           VARCHAR(6) NOT NULL DEFAULT 'EUR',
  payment_method     VARCHAR(32) NOT NULL
    CHECK (payment_method IN ('cash', 'card', 'online', 'bank_transfer', 'platform_payout')),
  business_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number   TEXT,                       -- numéro de virement, ID payout, etc.
  note               TEXT,
  attachment_url     TEXT,
  cash_movement_id   UUID REFERENCES cash_register_movements(id) ON DELETE SET NULL,
  performed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ext_inc_business_date ON external_cash_incomes (business_date DESC);
CREATE INDEX IF NOT EXISTS idx_ext_inc_source        ON external_cash_incomes (source);
CREATE INDEX IF NOT EXISTS idx_ext_inc_method        ON external_cash_incomes (payment_method);
CREATE INDEX IF NOT EXISTS idx_ext_inc_user          ON external_cash_incomes (performed_by);

COMMENT ON TABLE external_cash_incomes IS
  'Entrées caisse externes (plateformes livraison, virements, versements). Distinct des paiements de tables (table payments restent dans payments + invoices).';
COMMENT ON COLUMN external_cash_incomes.source IS
  'Plateforme / canal source de l''argent.';
COMMENT ON COLUMN external_cash_incomes.payment_method IS
  'Mode de réception : cash augmente le tiroir (via cash_register_movements), les autres alimentent les totaux non-cash.';
