-- =============================================================================
-- Migration 13 — Mouvements de caisse (sortie dépenses, avances clients, audit)
-- Idempotente. Après applique dans Supabase (SQL Editor) ou CLI.
-- Total caisse théorique = encaissements + avances - sorties
-- (les ventes détaillées restent aussi dans payments / invoices).
-- =============================================================================

CREATE TABLE IF NOT EXISTS cash_register_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            VARCHAR(32) NOT NULL
    CHECK (kind IN (
      'sortie_caisse',   -- dépense / argent qui sort du tiroir
      'avance_client',    -- versement anticipé gardé au comptoir
      'ajustement'       -- correction (montant peut être vu dans meta.direction si besoin)
    )),
  amount            DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency          VARCHAR(6) DEFAULT 'EUR',
  description       TEXT NOT NULL,
  attachment_url    TEXT,
  meta              JSONB DEFAULT '{}'::jsonb,
  performed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_reg_mov_date ON cash_register_movements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_reg_mov_kind ON cash_register_movements (kind);
CREATE INDEX IF NOT EXISTS idx_cash_reg_mov_user ON cash_register_movements (performed_by);

COMMENT ON TABLE cash_register_movements IS
  'Journal caisse boutique : sorties, avances, ajustements (traçabilité par performed_by).';
