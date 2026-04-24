-- =============================================================================
--  APPLY-TODAY.sql
-- =============================================================================
--  Toutes les modifications Supabase faites AUJOURD'HUI, dans UN SEUL script.
--  -> Copie / colle dans : Supabase -> SQL Editor -> New query -> RUN.
--  -> 100% idempotent : peut etre relance sans erreur.
--
--  Contenu :
--    1) Extensions utiles (pgcrypto, vector)
--    2) Multi-Station Orders (Kitchen / Bar / Shisha)   [ex-10]
--    3) Delivery tracking + Drivers + Maps              [ex-11]
--    4) Triggers, vues et stats (stations & livraisons)
--    5) Backfill heuristique pour produits existants
--    6) Publication Realtime (orders, order_items, deliveries, drivers)
--    7) Seed demo drivers + attribution roles staff (a personnaliser)
--    8) Verifications finales
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1) EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- pgvector est optionnel (RAG/AI). Decommente si tu utilises la memoire agents.
CREATE EXTENSION IF NOT EXISTS vector;


-- =============================================================================
-- 2) MULTI-STATION ORDERS  (Kitchen / Bar / Shisha)
-- =============================================================================

-- 2.1 Enums ------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'station_type') THEN
    CREATE TYPE station_type AS ENUM ('KITCHEN', 'BAR', 'SHISHA');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'station_item_status') THEN
    CREATE TYPE station_item_status AS ENUM ('new', 'preparing', 'ready', 'served');
  END IF;
END $$;

-- 2.2 Colonne station sur products -------------------------------------------
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS station station_type DEFAULT 'KITCHEN' NOT NULL;

COMMENT ON COLUMN public.products.station IS
  'Station de production vers laquelle dispatch l''item (KITCHEN/BAR/SHISHA).';

CREATE INDEX IF NOT EXISTS idx_products_station
  ON public.products(station);

-- 2.3 Colonnes sur order_items -----------------------------------------------
ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS station        station_type        DEFAULT 'KITCHEN' NOT NULL,
  ADD COLUMN IF NOT EXISTS station_status station_item_status DEFAULT 'new'     NOT NULL,
  ADD COLUMN IF NOT EXISTS started_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ready_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS served_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_order_items_station_status
  ON public.order_items(station, station_status);

CREATE INDEX IF NOT EXISTS idx_order_items_station_order
  ON public.order_items(station, order_id);

-- 2.4 Trigger : dispatch automatique de la station ---------------------------
CREATE OR REPLACE FUNCTION public.auto_dispatch_station()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.station IS NULL OR NEW.station = 'KITCHEN' THEN
    SELECT p.station INTO NEW.station
    FROM public.products p
    WHERE p.id = NEW.product_id;
    IF NEW.station IS NULL THEN
      NEW.station := 'KITCHEN';
    END IF;
  END IF;
  IF NEW.station_status IS NULL THEN
    NEW.station_status := 'new';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_dispatch_station ON public.order_items;
CREATE TRIGGER trg_auto_dispatch_station
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_dispatch_station();

-- 2.5 Trigger : tracking timestamps au changement de statut ------------------
CREATE OR REPLACE FUNCTION public.track_station_status_change()
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

DROP TRIGGER IF EXISTS trg_track_station_status ON public.order_items;
CREATE TRIGGER trg_track_station_status
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.track_station_status_change();

-- 2.6 Trigger : agregation orders.status depuis les items --------------------
CREATE OR REPLACE FUNCTION public.sync_order_from_items()
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
  FROM public.order_items
  WHERE order_id = v_order_id;

  IF v_all_ready THEN
    UPDATE public.orders
       SET status = 'ready', updated_at = NOW()
     WHERE id = v_order_id
       AND status NOT IN ('ready', 'completed', 'cancelled');
  ELSIF v_any_preparing THEN
    UPDATE public.orders
       SET status = 'preparing', updated_at = NOW()
     WHERE id = v_order_id
       AND status = 'received';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_from_items ON public.order_items;
CREATE TRIGGER trg_sync_order_from_items
  AFTER UPDATE OF station_status ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_from_items();

-- 2.7 Vue : file d'attente par station ---------------------------------------
CREATE OR REPLACE VIEW public.v_station_queue AS
SELECT
  oi.id                   AS item_id,
  oi.order_id,
  o.order_number,
  o.order_type,
  o.customer_name,
  o.created_at            AS order_created_at,
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
          WHEN 'BAR'     THEN 5
          WHEN 'SHISHA'  THEN 10
        END
    ELSE FALSE
  END AS is_late
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
WHERE oi.station_status IN ('new', 'preparing', 'ready');

COMMENT ON VIEW public.v_station_queue IS
  'File d''attente par station. Filtree sur les items non servis.';

-- 2.8 Vue : metriques performance par station --------------------------------
CREATE OR REPLACE VIEW public.v_station_stats AS
SELECT
  oi.station,
  COUNT(*) FILTER (WHERE oi.station_status = 'new')       AS pending_count,
  COUNT(*) FILTER (WHERE oi.station_status = 'preparing') AS preparing_count,
  COUNT(*) FILTER (WHERE oi.station_status = 'ready')     AS ready_count,
  COUNT(*) FILTER (WHERE oi.station_status = 'served')    AS served_count,
  AVG(
    EXTRACT(EPOCH FROM (oi.ready_at - oi.started_at)) / 60
  ) FILTER (
    WHERE oi.ready_at  IS NOT NULL
      AND oi.started_at IS NOT NULL
      AND oi.created_at > NOW() - INTERVAL '24 hours'
  ) AS avg_prep_minutes_24h,
  COUNT(*) FILTER (
    WHERE oi.ready_at  IS NOT NULL
      AND oi.started_at IS NOT NULL
      AND oi.created_at > NOW() - INTERVAL '24 hours'
      AND (EXTRACT(EPOCH FROM (oi.ready_at - oi.started_at)) / 60) >
          CASE oi.station
            WHEN 'KITCHEN' THEN 15
            WHEN 'BAR'     THEN 5
            WHEN 'SHISHA'  THEN 10
          END
  ) AS late_count_24h
FROM public.order_items oi
GROUP BY oi.station;

COMMENT ON VIEW public.v_station_stats IS
  'Statistiques par station: compteurs + moyenne de preparation 24h + retards.';

-- 2.9 Backfill heuristique (produits existants) ------------------------------
UPDATE public.products
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

UPDATE public.products
SET station = 'SHISHA'
WHERE LOWER(name) LIKE '%chicha%'
   OR LOWER(name) LIKE '%shisha%'
   OR LOWER(name) LIKE '%hookah%'
   OR LOWER(name) LIKE '%narguile%';

-- Propage la station aux order_items existants (depuis le produit)
UPDATE public.order_items oi
SET station = p.station
FROM public.products p
WHERE oi.product_id = p.id
  AND oi.station IS DISTINCT FROM p.station;


-- =============================================================================
-- 3) DELIVERY TRACKING  (Maps + Realtime)
-- =============================================================================

-- 3.1 Enums ------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM (
    'pending','assigned','picked_up','en_route',
    'arrived','delivered','cancelled','problem'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_type AS ENUM ('pending','paid','cash_on_delivery','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3.2 Table drivers ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drivers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name        text NOT NULL,
  phone            text,
  photo_url        text,
  vehicle_type     text DEFAULT 'motorcycle',
  is_online        boolean DEFAULT false,
  current_lat      double precision,
  current_lng      double precision,
  rating           numeric(3,2) DEFAULT 5.0,
  total_deliveries integer DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 3.3 Table delivery_trackings -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_trackings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number          text NOT NULL,
  driver_id             uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  customer_name         text NOT NULL,
  customer_phone        text,
  delivery_address      text NOT NULL,
  delivery_notes        text,
  pickup_lat            double precision NOT NULL,
  pickup_lng            double precision NOT NULL,
  delivery_lat          double precision NOT NULL,
  delivery_lng          double precision NOT NULL,
  driver_lat            double precision,
  driver_lng            double precision,
  status                delivery_status      NOT NULL DEFAULT 'pending',
  payment_status        payment_status_type  NOT NULL DEFAULT 'pending',
  total_amount          numeric(10,2)        NOT NULL DEFAULT 0,
  estimated_minutes     integer,
  assigned_at           timestamptz,
  picked_up_at          timestamptz,
  en_route_at           timestamptz,
  arrived_at            timestamptz,
  delivered_at          timestamptz,
  cancelled_at          timestamptz,
  problem_at            timestamptz,
  position_updated_at   timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- 3.4 Index ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dt_driver      ON public.delivery_trackings(driver_id);
CREATE INDEX IF NOT EXISTS idx_dt_order       ON public.delivery_trackings(order_id);
CREATE INDEX IF NOT EXISTS idx_dt_status      ON public.delivery_trackings(status);
CREATE INDEX IF NOT EXISTS idx_dt_created_at  ON public.delivery_trackings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_online ON public.drivers(is_online) WHERE is_online;

-- 3.5 Triggers (updated_at + transitions) ------------------------------------
CREATE OR REPLACE FUNCTION public.fn_dt_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'assigned'  AND NEW.assigned_at   IS NULL THEN NEW.assigned_at   = now(); END IF;
    IF NEW.status = 'picked_up' AND NEW.picked_up_at  IS NULL THEN NEW.picked_up_at  = now(); END IF;
    IF NEW.status = 'en_route'  AND NEW.en_route_at   IS NULL THEN NEW.en_route_at   = now(); END IF;
    IF NEW.status = 'arrived'   AND NEW.arrived_at    IS NULL THEN NEW.arrived_at    = now(); END IF;
    IF NEW.status = 'delivered' AND NEW.delivered_at  IS NULL THEN NEW.delivered_at  = now(); END IF;
    IF NEW.status = 'cancelled' AND NEW.cancelled_at  IS NULL THEN NEW.cancelled_at  = now(); END IF;
    IF NEW.status = 'problem'   AND NEW.problem_at    IS NULL THEN NEW.problem_at    = now(); END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_dt_touch_updated_at ON public.delivery_trackings;
CREATE TRIGGER trg_dt_touch_updated_at
  BEFORE UPDATE ON public.delivery_trackings
  FOR EACH ROW EXECUTE FUNCTION public.fn_dt_touch_updated_at();

CREATE OR REPLACE FUNCTION public.fn_drivers_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_drivers_touch_updated_at ON public.drivers;
CREATE TRIGGER trg_drivers_touch_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.fn_drivers_touch_updated_at();

-- 3.6 Vues live --------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_active_deliveries AS
SELECT
  dt.id,
  dt.order_id,
  dt.order_number,
  dt.driver_id,
  d.full_name  AS driver_name,
  d.phone      AS driver_phone,
  d.rating     AS driver_rating,
  dt.customer_name,
  dt.customer_phone,
  dt.delivery_address,
  dt.delivery_notes,
  dt.pickup_lat,   dt.pickup_lng,
  dt.delivery_lat, dt.delivery_lng,
  dt.driver_lat,   dt.driver_lng,
  dt.status,
  dt.payment_status,
  dt.total_amount,
  dt.estimated_minutes,
  dt.position_updated_at,
  dt.created_at,
  dt.assigned_at,
  dt.picked_up_at,
  dt.en_route_at,
  dt.delivered_at,
  CASE
    WHEN dt.driver_lat IS NOT NULL AND dt.driver_lng IS NOT NULL THEN
      111.045 * sqrt(
        power(dt.delivery_lat - dt.driver_lat, 2) +
        power((dt.delivery_lng - dt.driver_lng) * cos(radians(dt.delivery_lat)), 2)
      )
  END AS distance_km
FROM public.delivery_trackings dt
LEFT JOIN public.drivers d ON d.id = dt.driver_id
WHERE dt.status NOT IN ('delivered','cancelled');

CREATE OR REPLACE VIEW public.v_driver_stats AS
SELECT
  d.id,
  d.full_name,
  d.is_online,
  d.rating,
  COUNT(dt.id) FILTER (WHERE dt.status = 'delivered')                         AS total_delivered,
  COUNT(dt.id) FILTER (WHERE dt.status NOT IN ('delivered','cancelled'))      AS active_count,
  AVG(
    EXTRACT(EPOCH FROM (dt.delivered_at - dt.picked_up_at)) / 60
  ) FILTER (WHERE dt.status = 'delivered' AND dt.picked_up_at IS NOT NULL)    AS avg_delivery_minutes,
  SUM(dt.total_amount) FILTER (WHERE dt.status = 'delivered')                 AS total_revenue
FROM public.drivers d
LEFT JOIN public.delivery_trackings dt ON dt.driver_id = d.id
GROUP BY d.id;


-- =============================================================================
-- 4) REALTIME publications (Supabase Realtime)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_trackings;
      EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
      EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
      EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
      EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;


-- =============================================================================
-- 5) SEED DEMO : drivers de test
-- =============================================================================
INSERT INTO public.drivers (full_name, phone, is_online, rating)
SELECT 'Mohamed Karim', '+216 22 111 222', true, 4.9
WHERE NOT EXISTS (SELECT 1 FROM public.drivers WHERE full_name = 'Mohamed Karim');

INSERT INTO public.drivers (full_name, phone, is_online, rating)
SELECT 'Sami Benali',   '+216 55 333 444', false, 4.7
WHERE NOT EXISTS (SELECT 1 FROM public.drivers WHERE full_name = 'Sami Benali');


COMMIT;


-- =============================================================================
-- 6) ATTRIBUTION DES ROLES STAFF (a executer APRES le COMMIT)
-- =============================================================================
-- Ces UPDATEs donnent le bon role (ADMIN / SERVER / KITCHEN / BAR / SHISHA /
-- CASHIER / DELIVERY / CLIENT) a un compte Supabase Auth.
-- Prerequis: le compte doit exister -> cree-le dans Authentication -> Users.
-- Remplace les emails par les tiens puis decommente les lignes correspondantes.

-- UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb)
--   || '{"role":"ADMIN",    "first_name":"Admin",  "last_name":"Jannat"}'::jsonb
-- WHERE email = 'admin@jannat.local';

-- UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb)
--   || '{"role":"SERVER",   "first_name":"Ali",    "last_name":"Server"}'::jsonb
-- WHERE email = 'server@jannat.local';

-- UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb)
--   || '{"role":"KITCHEN",  "first_name":"Chef",   "last_name":"Kitchen"}'::jsonb
-- WHERE email = 'kitchen@jannat.local';

-- UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb)
--   || '{"role":"BAR",      "first_name":"Bar",    "last_name":"Manager"}'::jsonb
-- WHERE email = 'bar@jannat.local';

-- UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb)
--   || '{"role":"SHISHA",   "first_name":"Shisha", "last_name":"Master"}'::jsonb
-- WHERE email = 'shisha@jannat.local';

-- UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb)
--   || '{"role":"CASHIER",  "first_name":"Caisse", "last_name":"Jannat"}'::jsonb
-- WHERE email = 'cashier@jannat.local';

-- UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb)
--   || '{"role":"DELIVERY", "first_name":"Driver", "last_name":"Jannat"}'::jsonb
-- WHERE email = 'driver@jannat.local';

-- Lier un compte DELIVERY a un driver :
-- INSERT INTO public.drivers (user_id, full_name, phone, vehicle_type, is_online)
-- SELECT id, 'Driver Jannat', '+33600000001', 'motorcycle', true
-- FROM auth.users WHERE email = 'driver@jannat.local'
-- ON CONFLICT DO NOTHING;


-- =============================================================================
-- 7) VERIFICATIONS RAPIDES
-- =============================================================================
-- (Lancer ces requetes une par une pour confirmer que tout est OK)

-- Enums crees
-- SELECT typname FROM pg_type
-- WHERE typname IN ('station_type','station_item_status','delivery_status','payment_status_type');

-- Tables creees
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema='public' AND table_name IN ('drivers','delivery_trackings');

-- Vues creees
-- SELECT viewname FROM pg_views WHERE schemaname='public'
-- AND viewname IN ('v_station_queue','v_station_stats','v_active_deliveries','v_driver_stats');

-- Repartition stations
-- SELECT station, COUNT(*) FROM public.products GROUP BY station;

-- Drivers en ligne
-- SELECT full_name, phone, is_online, rating FROM public.drivers;

-- Livraisons actives
-- SELECT * FROM public.v_active_deliveries LIMIT 10;

-- Roles staff configures
-- SELECT email, raw_user_meta_data->>'role' AS role
-- FROM auth.users
-- WHERE raw_user_meta_data->>'role' IS NOT NULL
-- ORDER BY role;

-- =============================================================================
-- DONE
-- =============================================================================
