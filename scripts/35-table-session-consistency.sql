-- 35 — Cohérence sessions table : une session ouverte par table, pointer current_session_id
-- Idempotent. Exécuter : node scripts/run-migrations.mjs

BEGIN;

-- Fermer les doublons de sessions ouvertes (garde la plus ancienne)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY table_id ORDER BY opened_at ASC NULLS LAST, id ASC) AS rn
  FROM table_sessions
  WHERE closed_at IS NULL
)
UPDATE table_sessions ts
SET closed_at = NOW()
FROM ranked r
WHERE ts.id = r.id AND r.rn > 1;

-- Une seule session ouverte par table
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_sessions_one_open_per_table
  ON table_sessions (table_id)
  WHERE closed_at IS NULL;

-- Ouvre ou récupère la session active et synchronise restaurant_tables
CREATE OR REPLACE FUNCTION ensure_table_session(p_table_id INTEGER)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_status VARCHAR;
BEGIN
  IF p_table_id IS NULL THEN
    RAISE EXCEPTION 'table_id requis';
  END IF;

  SELECT id INTO v_session_id
  FROM table_sessions
  WHERE table_id = p_table_id AND closed_at IS NULL
  ORDER BY opened_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_session_id IS NULL THEN
    BEGIN
      INSERT INTO table_sessions (table_id)
      VALUES (p_table_id)
      RETURNING id INTO v_session_id;
    EXCEPTION WHEN unique_violation THEN
      SELECT id INTO v_session_id
      FROM table_sessions
      WHERE table_id = p_table_id AND closed_at IS NULL
      LIMIT 1;
    END;
  END IF;

  SELECT status INTO v_status FROM restaurant_tables WHERE id = p_table_id;

  UPDATE restaurant_tables
  SET current_session_id = v_session_id,
      status = CASE
        WHEN status IS NULL OR status = 'FREE' THEN 'OCCUPIED'
        ELSE status
      END,
      last_activity = NOW()
  WHERE id = p_table_id;

  RETURN v_session_id;
END;
$$;

COMMENT ON FUNCTION ensure_table_session(INTEGER) IS
  'Retourne la session ouverte pour une table (crée si besoin) et met à jour current_session_id.';

-- File station : inclure accepted.
-- DROP préalable : un CREATE OR REPLACE VIEW ne peut pas renommer/réordonner des
-- colonnes existantes (ces vues sont déjà définies en 29 avec un autre jeu de
-- colonnes), d'où l'erreur « cannot change name of view column ... ». On les
-- supprime d'abord pour rendre la migration rejouable.
DROP VIEW IF EXISTS v_station_queue;
CREATE OR REPLACE VIEW v_station_queue AS
SELECT
  oi.id              AS item_id,
  oi.order_id,
  o.order_number,
  o.order_type,
  o.customer_name,
  o.created_at       AS order_created_at,
  oi.station,
  oi.station_status,
  oi.product_name,
  oi.quantity,
  oi.special_instructions AS notes,
  oi.started_at,
  oi.ready_at,
  oi.served_at,
  EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 AS elapsed_minutes,
  CASE
    WHEN oi.started_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (COALESCE(oi.ready_at, NOW()) - oi.started_at)) / 60
    ELSE NULL
  END AS prep_minutes,
  CASE
    WHEN oi.station_status = 'preparing' AND oi.started_at IS NOT NULL THEN
      (EXTRACT(EPOCH FROM (NOW() - oi.started_at)) / 60) >
        CASE oi.station
          WHEN 'KITCHEN' THEN 15
          WHEN 'BAR' THEN 5
          WHEN 'SHISHA' THEN 10
        END
    ELSE FALSE
  END AS is_late
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE oi.station_status IN ('new', 'accepted', 'preparing', 'ready');

DROP VIEW IF EXISTS v_station_stats;
CREATE OR REPLACE VIEW v_station_stats AS
SELECT
  oi.station,
  COUNT(*) FILTER (WHERE oi.station_status = 'new')       AS pending_count,
  COUNT(*) FILTER (WHERE oi.station_status = 'accepted')  AS accepted_count,
  COUNT(*) FILTER (WHERE oi.station_status = 'preparing') AS preparing_count,
  COUNT(*) FILTER (WHERE oi.station_status = 'ready')     AS ready_count,
  COUNT(*) FILTER (WHERE oi.station_status = 'served')    AS served_count,
  AVG(
    EXTRACT(EPOCH FROM (oi.ready_at - oi.started_at)) / 60
  ) FILTER (
    WHERE oi.ready_at IS NOT NULL
      AND oi.started_at IS NOT NULL
      AND oi.created_at > NOW() - INTERVAL '24 hours'
  ) AS avg_prep_minutes_24h,
  COUNT(*) FILTER (
    WHERE oi.ready_at IS NOT NULL
      AND oi.started_at IS NOT NULL
      AND oi.created_at > NOW() - INTERVAL '24 hours'
      AND (EXTRACT(EPOCH FROM (oi.ready_at - oi.started_at)) / 60) >
          CASE oi.station
            WHEN 'KITCHEN' THEN 15
            WHEN 'BAR' THEN 5
            WHEN 'SHISHA' THEN 10
          END
  ) AS late_count_24h
FROM order_items oi
GROUP BY oi.station;

COMMIT;
