-- =============================================================================
-- Migration 29 — Station acceptance / availability workflow
-- =============================================================================
-- Idempotente. À exécuter après scripts/10-stations.sql.
--
-- Objectif:
--   Permettre aux stations KITCHEN / BAR / SHISHA :
--     1. d'accepter ou refuser un item (avec raison codifiée)
--     2. de proposer/lier un produit de remplacement
--     3. de gérer leur disponibilité (OPEN, BUSY, PAUSED, CLOSING_SOON, CLOSED)
--     4. d'auditer toutes les transitions (refus, remplacement, ouverture/fermeture)
--
-- Architecture :
--   1) Extension de l'enum `station_item_status`:
--        accepted | refused | replacement_requested | replaced | cancelled | waste
--   2) Colonnes additionnelles sur order_items (refus + chaîne de remplacement)
--   3) Table `station_availability` (1 ligne par station)
--   4) Table `station_availability_log` (historique horodaté)
--   5) Table `order_item_refusals` (historique fin par item)
--   6) Trigger d'historisation availability + helpers RPC
--   7) Vue `v_station_availability` (état + couleur d'affichage)
-- =============================================================================

BEGIN;

-- ------------------------------
-- 1. Extension de l'enum station_item_status
-- ------------------------------
DO $$
DECLARE
  v_value TEXT;
BEGIN
  -- Création initiale (si la migration 10 n'a jamais tourné)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'station_item_status') THEN
    CREATE TYPE station_item_status AS ENUM (
      'new', 'accepted', 'preparing', 'ready', 'served',
      'refused', 'replacement_requested', 'replaced', 'cancelled', 'waste'
    );
  ELSE
    FOREACH v_value IN ARRAY ARRAY[
      'accepted', 'refused', 'replacement_requested',
      'replaced', 'cancelled', 'waste'
    ]
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'station_item_status'
          AND e.enumlabel = v_value
      ) THEN
        EXECUTE format('ALTER TYPE station_item_status ADD VALUE IF NOT EXISTS %L', v_value);
      END IF;
    END LOOP;
  END IF;
END
$$;

-- ------------------------------
-- 2. Colonnes additionnelles sur order_items
-- ------------------------------
ALTER TABLE IF EXISTS order_items
  ADD COLUMN IF NOT EXISTS refusal_reason          VARCHAR(64),
  ADD COLUMN IF NOT EXISTS refusal_note            TEXT,
  ADD COLUMN IF NOT EXISTS refused_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refused_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS replacement_of_item_id  UUID REFERENCES order_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS replaced_by_item_id     UUID REFERENCES order_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS billable                BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS waste_logged            BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_order_items_refused_at
  ON order_items(refused_at)
  WHERE refused_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_replacement_of
  ON order_items(replacement_of_item_id)
  WHERE replacement_of_item_id IS NOT NULL;

COMMENT ON COLUMN order_items.refusal_reason IS
  'Code raison du refus (produit_indisponible, ingredient_manquant, rush, station_fermee, fin_service, remplacement_necessaire, autre).';
COMMENT ON COLUMN order_items.billable IS
  'Faux pour les items refusés non préparés. Ne doit pas alimenter la facture.';
COMMENT ON COLUMN order_items.waste_logged IS
  'Vrai si l''item a été marqué WASTE après préparation (perte stock comptabilisée).';

-- ------------------------------
-- 3. Table station_availability
-- ------------------------------
CREATE TABLE IF NOT EXISTS station_availability (
  station                 station_type PRIMARY KEY,
  status                  VARCHAR(24) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'BUSY', 'PAUSED', 'CLOSING_SOON', 'CLOSED')),
  reason                  TEXT,
  estimated_wait_minutes  INTEGER,
  closes_at               TIMESTAMPTZ,
  updated_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE station_availability IS
  'État courant de chaque station de production (OPEN / BUSY / PAUSED / CLOSING_SOON / CLOSED).';
COMMENT ON COLUMN station_availability.estimated_wait_minutes IS
  'Temps d''attente affiché côté client/serveur si BUSY ou CLOSING_SOON.';
COMMENT ON COLUMN station_availability.closes_at IS
  'Heure prévue de fermeture (utile pour CLOSING_SOON).';

-- Seed des trois stations si manquantes
INSERT INTO station_availability (station, status)
SELECT s::station_type, 'OPEN'
FROM (VALUES ('KITCHEN'), ('BAR'), ('SHISHA')) AS t(s)
ON CONFLICT (station) DO NOTHING;

-- ------------------------------
-- 4. Table station_availability_log (historique)
-- ------------------------------
CREATE TABLE IF NOT EXISTS station_availability_log (
  id                      BIGSERIAL PRIMARY KEY,
  station                 station_type NOT NULL,
  old_status              VARCHAR(24),
  new_status              VARCHAR(24) NOT NULL,
  reason                  TEXT,
  estimated_wait_minutes  INTEGER,
  changed_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_station_avail_log_station_date
  ON station_availability_log(station, changed_at DESC);

-- Trigger: log automatique sur changement
CREATE OR REPLACE FUNCTION log_station_availability_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND
     (OLD.status IS DISTINCT FROM NEW.status
      OR OLD.reason IS DISTINCT FROM NEW.reason
      OR OLD.estimated_wait_minutes IS DISTINCT FROM NEW.estimated_wait_minutes) THEN
    INSERT INTO station_availability_log (
      station, old_status, new_status, reason,
      estimated_wait_minutes, changed_by, changed_at
    ) VALUES (
      NEW.station, OLD.status, NEW.status, NEW.reason,
      NEW.estimated_wait_minutes, NEW.updated_by, NOW()
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO station_availability_log (
      station, old_status, new_status, reason,
      estimated_wait_minutes, changed_by, changed_at
    ) VALUES (
      NEW.station, NULL, NEW.status, NEW.reason,
      NEW.estimated_wait_minutes, NEW.updated_by, NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_station_availability ON station_availability;
CREATE TRIGGER trg_log_station_availability
  AFTER INSERT OR UPDATE ON station_availability
  FOR EACH ROW
  EXECUTE FUNCTION log_station_availability_change();

-- ------------------------------
-- 5. Table order_item_refusals (audit fin par item)
-- ------------------------------
CREATE TABLE IF NOT EXISTS order_item_refusals (
  id                BIGSERIAL PRIMARY KEY,
  order_item_id     UUID REFERENCES order_items(id) ON DELETE CASCADE,
  order_id          UUID REFERENCES orders(id) ON DELETE CASCADE,
  station           station_type NOT NULL,
  reason_code       VARCHAR(64) NOT NULL,
  reason_note       TEXT,
  previous_status   station_item_status,
  bulk_refuse       BOOLEAN NOT NULL DEFAULT FALSE,
  refused_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oir_order        ON order_item_refusals(order_id);
CREATE INDEX IF NOT EXISTS idx_oir_station_date ON order_item_refusals(station, created_at DESC);

COMMENT ON TABLE order_item_refusals IS
  'Historique des refus d''items par station (raison codifiée + note libre).';

-- ------------------------------
-- 6. Trigger : marquer billable=false quand un item est refusé/replaced
-- ------------------------------
CREATE OR REPLACE FUNCTION sync_order_item_billable()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.station_status IN ('refused', 'replaced', 'cancelled') THEN
    NEW.billable := FALSE;
  ELSIF NEW.station_status = 'waste' THEN
    -- waste = préparé puis perdu → on garde billable=true ? Non, l'item refusé
    -- ne doit pas figurer dans la facture du client mais doit être tracé en perte.
    NEW.billable := FALSE;
    NEW.waste_logged := TRUE;
  END IF;

  -- accepted_at / refused_at
  IF NEW.station_status = 'accepted' AND NEW.accepted_at IS NULL THEN
    NEW.accepted_at := NOW();
  END IF;
  IF NEW.station_status = 'refused' AND NEW.refused_at IS NULL THEN
    NEW.refused_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_item_billable ON order_items;
CREATE TRIGGER trg_sync_order_item_billable
  BEFORE UPDATE OF station_status ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_item_billable();

-- ------------------------------
-- 7. Vue v_station_availability (lecture rapide pour le menu client)
-- ------------------------------
CREATE OR REPLACE VIEW v_station_availability AS
SELECT
  sa.station,
  sa.status,
  sa.reason,
  sa.estimated_wait_minutes,
  sa.closes_at,
  sa.updated_at,
  sa.updated_by,
  CASE sa.status
    WHEN 'OPEN'         THEN TRUE
    WHEN 'BUSY'         THEN TRUE
    WHEN 'CLOSING_SOON' THEN TRUE
    WHEN 'PAUSED'       THEN FALSE
    WHEN 'CLOSED'       THEN FALSE
    ELSE FALSE
  END AS accepting_orders,
  CASE
    WHEN sa.status IN ('PAUSED', 'CLOSED') THEN TRUE
    ELSE FALSE
  END AS hide_in_menu
FROM station_availability sa;

COMMENT ON VIEW v_station_availability IS
  'État courant des stations + drapeaux dérivés (accepting_orders / hide_in_menu) pour le menu client et les API.';

-- ------------------------------
-- 8. RPC: refuse_order_items_bulk
-- ------------------------------
-- Refuse en bloc tous les items d'une station pour une commande donnée
-- (ou tous les items 'new' / 'accepted' d'une station pour le service en cours).
CREATE OR REPLACE FUNCTION refuse_order_items_bulk(
  p_station       station_type,
  p_reason_code   TEXT,
  p_reason_note   TEXT,
  p_actor         UUID,
  p_order_id      UUID DEFAULT NULL
) RETURNS TABLE (refused_count INTEGER) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH targets AS (
    SELECT id, station_status
    FROM order_items
    WHERE station = p_station
      AND station_status IN ('new', 'accepted')
      AND (p_order_id IS NULL OR order_id = p_order_id)
  ),
  upd AS (
    UPDATE order_items oi
    SET station_status = 'refused',
        refusal_reason = p_reason_code,
        refusal_note   = p_reason_note,
        refused_by     = p_actor
    FROM targets t
    WHERE oi.id = t.id
    RETURNING oi.id, oi.order_id, oi.station
  ),
  ins AS (
    INSERT INTO order_item_refusals (
      order_item_id, order_id, station, reason_code,
      reason_note, previous_status, bulk_refuse, refused_by
    )
    SELECT u.id, u.order_id, u.station, p_reason_code,
           p_reason_note, t.station_status, TRUE, p_actor
    FROM upd u
    JOIN targets t ON t.id = u.id
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM upd;
  refused_count := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refuse_order_items_bulk IS
  'Refuse en bloc les items NEW/ACCEPTED d''une station (toute la file ou pour un order_id donné). Crée une trace dans order_item_refusals.';

COMMIT;

-- =============================================================================
-- Vérifications rapides:
--   SELECT * FROM v_station_availability;
--   SELECT station, status, updated_at FROM station_availability;
--   SELECT * FROM station_availability_log ORDER BY changed_at DESC LIMIT 10;
--   SELECT * FROM order_item_refusals ORDER BY created_at DESC LIMIT 10;
-- =============================================================================
