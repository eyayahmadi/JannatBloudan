-- =============================================================================
-- Migration 27 — Fusion de tables (merge sessions)
-- -----------------------------------------------------------------------------
-- Trace d'audit dédiée à la fusion d'une ou plusieurs sessions vers une session
-- principale. Idempotent. À exécuter après les migrations 04 + 18 (sessions
-- + transferts), via `npm run db:migrate:env`.
-- =============================================================================

CREATE TABLE IF NOT EXISTS table_session_merges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_session_id   UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
  main_table_id     INTEGER REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  merged_session_id UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
  merged_table_id   INTEGER REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  merged_old_total  DECIMAL(10,2) DEFAULT 0,
  performed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  reason            TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_table_session_merge_main
  ON table_session_merges(main_session_id);
CREATE INDEX IF NOT EXISTS idx_table_session_merge_merged
  ON table_session_merges(merged_session_id);
CREATE INDEX IF NOT EXISTS idx_table_session_merge_created
  ON table_session_merges(created_at DESC);

COMMENT ON TABLE  table_session_merges IS
  'Historique des fusions de sessions tables. Une session principale peut absorber plusieurs sessions secondaires (orders + invoices déplacés).';
COMMENT ON COLUMN table_session_merges.main_session_id   IS 'Session destinataire (reste ouverte).';
COMMENT ON COLUMN table_session_merges.merged_session_id IS 'Session absorbée (clôturée par la fusion).';
