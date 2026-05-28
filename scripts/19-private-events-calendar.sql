-- =============================================================================
-- 19 — Événements privés : préparations, historique statuts, journal rappels
-- À exécuter après scripts/08-advanced.sql (event_requests déjà créé).
-- Idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS event_preparation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES event_requests(id) ON DELETE CASCADE,
  label           VARCHAR(280) NOT NULL,
  quantity        NUMERIC(12, 2),
  unit            VARCHAR(32),
  assignee_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  deadline        DATE,
  status          VARCHAR(20) NOT NULL DEFAULT 'to_buy'
                  CHECK (status IN ('to_buy', 'purchased', 'cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_prep_req ON event_preparation_items(request_id);

DROP TRIGGER IF EXISTS update_event_prep_items_updated ON event_preparation_items;
CREATE TRIGGER update_event_prep_items_updated
  BEFORE UPDATE ON event_preparation_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE event_preparation_items IS
  'Checklist achats / préparation par demande événement privé.';

CREATE TABLE IF NOT EXISTS private_event_status_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID NOT NULL REFERENCES event_requests(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  from_status  VARCHAR(30),
  to_status    VARCHAR(30) NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_private_event_hist_req ON private_event_status_history(request_id, created_at DESC);

CREATE TABLE IF NOT EXISTS event_reminder_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES event_requests(id) ON DELETE CASCADE,
  reminder_key  VARCHAR(64) NOT NULL,
  channel       VARCHAR(24) NOT NULL,
  recipient     VARCHAR(255),
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, reminder_key)
);

CREATE INDEX IF NOT EXISTS idx_event_rem_log_sent ON event_reminder_log(sent_at DESC);

COMMENT ON TABLE event_reminder_log IS
  'Une ligne par couple (demande, clé rappel) — évite les doublons.';

ALTER TABLE event_preparation_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_event_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminder_log           ENABLE ROW LEVEL SECURITY;
