-- =============================================================================
-- Migration 17 — Sortie de caisse : horodatage métier, bénéficiaire libellé,
-- pièces jointes traçables, annulation sans suppression (kind annulation_sortie).
-- Idempotente. Exécuter après scripts/14-caisse-intelligence-complete.sql
-- -----------------------------------------------------------------------------
-- Bucket stockage Supabase recommandé (création manuelle) :
--   Nom : cash-register-attachments (public lecture ou URL signée selon policy)
-- =============================================================================

ALTER TABLE cash_register_movements ADD COLUMN IF NOT EXISTS movement_at TIMESTAMPTZ DEFAULT NOW();

UPDATE cash_register_movements
SET movement_at = COALESCE(movement_at, created_at);

ALTER TABLE cash_register_movements
  ALTER COLUMN movement_at SET NOT NULL;

ALTER TABLE cash_register_movements ADD COLUMN IF NOT EXISTS beneficiary_display_name TEXT;
ALTER TABLE cash_register_movements ADD COLUMN IF NOT EXISTS beneficiary_role_label TEXT;
ALTER TABLE cash_register_movements ADD COLUMN IF NOT EXISTS reverses_movement_id UUID
  REFERENCES cash_register_movements (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cash_reg_mov_movement_at ON cash_register_movements (movement_at DESC);

COMMENT ON COLUMN cash_register_movements.movement_at IS
  'Moment effectif du mouvement (rapport journalier, clôtures). created_at reste audit insertion.';
COMMENT ON COLUMN cash_register_movements.beneficiary_display_name IS
  'Personne ayant physically reçu les espèces (texte libre si hors annuaire).';
COMMENT ON COLUMN cash_register_movements.beneficiary_role_label IS
  'Rôle / fonction affichée pour la traçabilité (ex. serveur, gérant).';
COMMENT ON COLUMN cash_register_movements.reverses_movement_id IS
  'Pour kind=annulation_sortie : mouvement sortie_caisse corrigé (jamais supprimé).';

ALTER TABLE cash_register_movements DROP CONSTRAINT IF EXISTS cash_register_movements_kind_check;

ALTER TABLE cash_register_movements ADD CONSTRAINT cash_register_movements_kind_check
  CHECK (kind IN (
    'sortie_caisse',
    'avance_client',
    'ajustement',
    'avance_salaire',
    'annulation_sortie'
  ));
