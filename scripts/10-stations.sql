-- ==========================================================================
-- Migration 10: Multi-Station Orders (Kitchen / Bar / Shisha)
-- ==========================================================================
-- Objectif:
--   Permettre a chaque item de commande d'etre dispatche automatiquement vers
--   la bonne station de production:
--     - KITCHEN : plats (shawarma, pizza, mezze...)
--     - BAR     : boissons & desserts (coca, jus, cafe, baklava...)
--     - SHISHA  : chicha (tous parfums)
--
-- Architecture:
--   1) Enum station_type (KITCHEN | BAR | SHISHA)
--   2) products.station   → defini par l'admin au moment de la creation produit
--   3) order_items.station        → copie denormalisee (snapshot au moment cmd)
--   4) order_items.station_status → cycle NEW → PREPARING → READY → SERVED
--   5) order_items.started_at / ready_at → metriques de performance
--   6) Trigger auto_dispatch_station → assigne la station au create item
--   7) Vue v_station_queue → file d'attente par station pour le dashboard KDS
--   8) Vue v_station_stats → metriques performance par station
--
-- Idempotent: tous les CREATE utilisent IF NOT EXISTS / OR REPLACE.
-- ==========================================================================

BEGIN;

-- ------------------------------
-- 1. Types enumeres
-- ------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'station_type') THEN
    CREATE TYPE station_type AS ENUM ('KITCHEN', 'BAR', 'SHISHA');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'station_item_status') THEN
    CREATE TYPE station_item_status AS ENUM ('new', 'preparing', 'ready', 'served');
  END IF;
END
$$;

-- ------------------------------
-- 2. Colonne station sur products
-- ------------------------------
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS station station_type DEFAULT 'KITCHEN' NOT NULL;

COMMENT ON COLUMN products.station IS
  'Station de production vers laquelle dispatch l''item (KITCHEN/BAR/SHISHA).';

CREATE INDEX IF NOT EXISTS idx_products_station ON products(station);

-- ------------------------------
-- 3. Colonnes sur order_items
-- ------------------------------
ALTER TABLE IF EXISTS order_items
  ADD COLUMN IF NOT EXISTS station station_type DEFAULT 'KITCHEN' NOT NULL,
  ADD COLUMN IF NOT EXISTS station_status station_item_status DEFAULT 'new' NOT NULL,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ready_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS served_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_order_items_station_status
  ON order_items(station, station_status);

CREATE INDEX IF NOT EXISTS idx_order_items_station_order
  ON order_items(station, order_id);

-- ------------------------------
-- 4. Trigger de dispatch automatique
-- ------------------------------
-- A la creation d'un order_item, si la station n'est pas fournie, on la
-- recupere depuis le produit. Permet au frontend d'envoyer simplement
-- { product_id, quantity } sans connaitre la station.
CREATE OR REPLACE FUNCTION auto_dispatch_station()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.station IS NULL OR NEW.station = 'KITCHEN' THEN
    -- Cherche la station du produit
    SELECT p.station INTO NEW.station
    FROM products p
    WHERE p.id = NEW.product_id;
    -- Fallback explicite si produit introuvable
    IF NEW.station IS NULL THEN
      NEW.station := 'KITCHEN';
    END IF;
  END IF;
  -- Statut initial : new
  IF NEW.station_status IS NULL THEN
    NEW.station_status := 'new';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_dispatch_station ON order_items;
CREATE TRIGGER trg_auto_dispatch_station
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_dispatch_station();

-- ------------------------------
-- 5. Trigger de timestamps sur changement de statut
-- ------------------------------
CREATE OR REPLACE FUNCTION track_station_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.station_status <> OLD.station_status THEN
    IF NEW.station_status = 'preparing' AND NEW.started_at IS NULL THEN
      NEW.started_at := NOW();
    END IF;
    IF NEW.station_status = 'ready' AND NEW.ready_at IS NULL THEN
      NEW.ready_at := NOW();
    END IF;
    IF NEW.station_status = 'served' AND NEW.served_at IS NULL THEN
      NEW.served_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_track_station_status ON order_items;
CREATE TRIGGER trg_track_station_status
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION track_station_status_change();

-- ------------------------------
-- 6. Agregation du statut order a partir des station_status
-- ------------------------------
-- Quand tous les items d'une commande sont 'ready' (ou 'served'), on met
-- automatiquement orders.status a 'ready'.
CREATE OR REPLACE FUNCTION sync_order_from_items()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_all_ready BOOLEAN;
  v_any_preparing BOOLEAN;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);

  SELECT
    BOOL_AND(station_status IN ('ready', 'served')),
    BOOL_OR(station_status = 'preparing')
  INTO v_all_ready, v_any_preparing
  FROM order_items
  WHERE order_id = v_order_id;

  IF v_all_ready THEN
    UPDATE orders SET status = 'ready', updated_at = NOW()
    WHERE id = v_order_id AND status NOT IN ('ready', 'completed', 'cancelled');
  ELSIF v_any_preparing THEN
    UPDATE orders SET status = 'preparing', updated_at = NOW()
    WHERE id = v_order_id AND status = 'received';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_from_items ON order_items;
CREATE TRIGGER trg_sync_order_from_items
  AFTER UPDATE OF station_status ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_from_items();

-- ------------------------------
-- 7. Vue v_station_queue
-- ------------------------------
-- File d'attente par station. Chaque ligne = 1 item a traiter.
-- DROP préalable : ces vues sont redéfinies en 29 et 35 avec un autre jeu de
-- colonnes ; CREATE OR REPLACE VIEW ne peut ni renommer ni supprimer une colonne
-- existante (« cannot drop columns from view »). On supprime donc d'abord la vue
-- pour rendre la migration rejouable sans casser 29/35 (qui la recréent).
DROP VIEW IF EXISTS v_station_queue CASCADE;
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
  -- Temps ecoule depuis reception (minutes)
  EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 AS elapsed_minutes,
  -- Temps de preparation si demarree (minutes)
  CASE
    WHEN oi.started_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (COALESCE(oi.ready_at, NOW()) - oi.started_at)) / 60
    ELSE NULL
  END AS prep_minutes,
  -- Drapeau retard (en prep > seuil par station)
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
WHERE oi.station_status IN ('new', 'preparing', 'ready');

COMMENT ON VIEW v_station_queue IS
  'File d''attente par station. Filtree sur les items non servis.';

-- ------------------------------
-- 8. Vue v_station_stats — metriques performance
-- ------------------------------
DROP VIEW IF EXISTS v_station_stats CASCADE;
CREATE OR REPLACE VIEW v_station_stats AS
SELECT
  oi.station,
  COUNT(*) FILTER (WHERE oi.station_status = 'new')       AS pending_count,
  COUNT(*) FILTER (WHERE oi.station_status = 'preparing') AS preparing_count,
  COUNT(*) FILTER (WHERE oi.station_status = 'ready')     AS ready_count,
  COUNT(*) FILTER (WHERE oi.station_status = 'served')    AS served_count,
  -- Moyenne de prep en minutes sur les 24 dernieres heures
  AVG(
    EXTRACT(EPOCH FROM (oi.ready_at - oi.started_at)) / 60
  ) FILTER (
    WHERE oi.ready_at IS NOT NULL
      AND oi.started_at IS NOT NULL
      AND oi.created_at > NOW() - INTERVAL '24 hours'
  ) AS avg_prep_minutes_24h,
  -- Taux de retard sur 24h
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

COMMENT ON VIEW v_station_stats IS
  'Statistiques par station: compteurs + moyenne de preparation 24h + retards.';

-- ------------------------------
-- 9. Heuristique de backfill pour produits existants
-- ------------------------------
-- Les produits deja en base n'ont pas de station. On devine selon le nom
-- (les admins peuvent ensuite ajuster manuellement).
UPDATE products
SET station = 'BAR'
WHERE station = 'KITCHEN'
  AND (
    LOWER(name) LIKE '%coca%' OR
    LOWER(name) LIKE '%pepsi%' OR
    LOWER(name) LIKE '%sprite%' OR
    LOWER(name) LIKE '%fanta%' OR
    LOWER(name) LIKE '%jus%' OR
    LOWER(name) LIKE '%juice%' OR
    LOWER(name) LIKE '%boisson%' OR
    LOWER(name) LIKE '%drink%' OR
    LOWER(name) LIKE '%limonade%' OR
    LOWER(name) LIKE '%smoothie%' OR
    LOWER(name) LIKE '%cafe%' OR
    LOWER(name) LIKE '%coffee%' OR
    LOWER(name) LIKE '%the %' OR
    LOWER(name) LIKE '%tea%' OR
    LOWER(name) LIKE '%cocktail%' OR
    LOWER(name) LIKE '%baklava%' OR
    LOWER(name) LIKE '%dessert%' OR
    LOWER(name) LIKE '%glace%' OR
    LOWER(name) LIKE '%ice cream%' OR
    LOWER(name) LIKE '%ayran%' OR
    LOWER(name) LIKE '%soda%' OR
    LOWER(name) LIKE '%eau%' OR
    LOWER(name) LIKE '%water%'
  );

UPDATE products
SET station = 'SHISHA'
WHERE LOWER(name) LIKE '%chicha%'
   OR LOWER(name) LIKE '%shisha%'
   OR LOWER(name) LIKE '%hookah%'
   OR LOWER(name) LIKE '%narguile%';

-- Propage la station aux order_items existants (depuis le produit)
UPDATE order_items oi
SET station = p.station
FROM products p
WHERE oi.product_id = p.id
  AND oi.station IS DISTINCT FROM p.station;

COMMIT;

-- ==========================================================================
-- DONE — Verification rapide (a lancer apres la migration)
-- ==========================================================================
-- SELECT station, COUNT(*) FROM products GROUP BY station;
-- SELECT * FROM v_station_queue LIMIT 20;
-- SELECT * FROM v_station_stats;
