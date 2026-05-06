-- =============================================================================
-- Migration 15 — Caisse intelligente : factures annulées (raison), paiement split
-- Idempotent. Exécuter après scripts 14-caisse-intelligence-complete.sql
-- =============================================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_split JSONB;

COMMENT ON COLUMN invoices.cancel_reason IS 'Raison obligatoire côté API caisse lors annulation (données conservées)';
COMMENT ON COLUMN invoices.payment_split IS 'JSON [{method, amount}] lorsque payment_method = split';
