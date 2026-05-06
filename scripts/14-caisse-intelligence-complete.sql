-- =============================================================================
-- Migration 14 — Gestion de caisse intelligente + fiscalité configurable
-- -----------------------------------------------------------------------------
-- Étend mouvements de caisse, clôtures journée (cash déclaré vs interne),
-- avances employés, réglages TVA, statuts facture paiement.
-- Idempotente. À exécuter après scripts 06, 08, 12, 13.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Réglages fiscaux (singleton id=1).
-- vat_scope = online_only  → TVA à payer uniquement sur encaissements online/card/digital
-- vat_scope = online_plus_cash_declared → ajoute partie « cash declaré » (via clôture du jour).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_tax_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  vat_rate            NUMERIC(6, 5) NOT NULL DEFAULT 0.19,
  vat_scope           VARCHAR(40) NOT NULL DEFAULT 'online_only'
    CHECK (vat_scope IN ('online_only', 'online_plus_cash_declared')),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_by          UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO finance_tax_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- Statut paiement granularité caisse / serveur (complète status général invoices).
-- ----------------------------------------------------------------------------
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_stage VARCHAR(40);
-- unpaid | payment_requested | paid_cash | paid_card | paid_online | split | cancelled | refunded | pending_verify

COMMENT ON COLUMN invoices.payment_stage IS
  'Flux caisse enrichi ; status reste draft|validated|paid|cancelled|refunded pour compatibilité';


-- ----------------------------------------------------------------------------
-- Mouvements caisse : validations + qui a pris l’argent + lien dépense finance
-- ----------------------------------------------------------------------------
ALTER TABLE cash_register_movements ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE cash_register_movements ADD COLUMN IF NOT EXISTS beneficiary_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE cash_register_movements ADD COLUMN IF NOT EXISTS linked_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS cash_movement_id UUID REFERENCES cash_register_movements(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_cash_mov_unique ON expenses (cash_movement_id)
  WHERE cash_movement_id IS NOT NULL;

ALTER TABLE cash_register_movements DROP CONSTRAINT IF EXISTS cash_register_movements_kind_check;

ALTER TABLE cash_register_movements ADD CONSTRAINT cash_register_movements_kind_check
  CHECK (kind IN (
    'sortie_caisse',
    'avance_client',
    'ajustement',
    'avance_salaire'
  ));


-- ----------------------------------------------------------------------------
-- Avances employés (déduit salaire : logique métier hors SQL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_advances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id          UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  amount            NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reason            TEXT NOT NULL,
  advance_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'deducted', 'cancelled')),
  approved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  cash_movement_id  UUID REFERENCES cash_register_movements(id) ON DELETE SET NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_employee_advances_staff ON employee_advances (staff_id);
CREATE INDEX IF NOT EXISTS idx_employee_advances_date ON employee_advances (advance_date DESC);


-- ----------------------------------------------------------------------------
-- Clôture journée (cash physique, officiel déclaré, interne résiduel, écart)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_day_closings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_date           DATE NOT NULL UNIQUE,
  -- Agrégés figés au moment de la clôture
  total_sales             NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_cash_payments     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_card_payments      NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_online_payments   NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_sorties_caisse    NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_avances_salaires  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  open_invoices_count     INTEGER DEFAULT 0,
  paid_invoices_count     INTEGER DEFAULT 0,
  cancelled_invoices_count INTEGER DEFAULT 0,
  cash_expected_system    NUMERIC(14, 2) DEFAULT 0,  -- synthèse tiroir théorique
  cash_counted_physical   NUMERIC(14, 2),            -- compté main
  cash_declared_official NUMERIC(14, 2),             -- partie déclarée fiscalement
  cash_internal_residual  NUMERIC(14, 2),             -- système − déclaré (reste « interne »)
  counted_vs_expected_gap NUMERIC(14, 2),
  declaration_comment      TEXT,
  declared_entered_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  declared_entered_at      TIMESTAMPTZ,
  closed_by                UUID REFERENCES users(id) ON DELETE SET NULL,
  closed_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized                BOOLEAN DEFAULT true
);

COMMENT ON COLUMN cash_day_closings.cash_internal_residual IS
  'Rémanence non déclarée : montant système − cash officiellement déclaré (voir spec).';


-- ----------------------------------------------------------------------------
-- Alertes métier persistées (optionnel lecture admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS caisse_intelligence_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity         VARCHAR(12) NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  code             VARCHAR(64) NOT NULL,
  message          TEXT NOT NULL,
  payload          JSONB DEFAULT '{}'::jsonb,
  business_date    DATE,
  resolved         BOOLEAN DEFAULT false,
  resolved_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caisse_alert_date ON caisse_intelligence_alerts (business_date DESC);
CREATE INDEX IF NOT EXISTS idx_caisse_alert_resolved ON caisse_intelligence_alerts (resolved) WHERE resolved = false;
