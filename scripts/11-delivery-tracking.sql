-- =============================================================
--  11 - DELIVERY TRACKING (Maps + Realtime)
--  Ajoute :
--    * table delivery_trackings
--    * table drivers (chauffeurs)
--    * enums delivery_status, payment_status_type
--    * triggers de maj des timestamps
--    * index geographiques
--    * vue v_active_deliveries
--  Idempotent : peut etre execute plusieurs fois sans erreur.
-- =============================================================

-- ---------- Enums ----------
DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM (
    'pending','assigned','picked_up','en_route',
    'arrived','delivered','cancelled','problem'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_type AS ENUM ('pending','paid','cash_on_delivery','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Table drivers ----------
CREATE TABLE IF NOT EXISTS public.drivers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name     text NOT NULL,
  phone         text,
  photo_url     text,
  vehicle_type  text DEFAULT 'motorcycle',
  is_online     boolean DEFAULT false,
  current_lat   double precision,
  current_lng   double precision,
  rating        numeric(3,2) DEFAULT 5.0,
  total_deliveries integer DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------- Table delivery_trackings ----------
CREATE TABLE IF NOT EXISTS public.delivery_trackings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number          text NOT NULL,
  driver_id             uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  customer_name         text NOT NULL,
  customer_phone        text,
  delivery_address      text NOT NULL,
  delivery_notes        text,
  -- Positions
  pickup_lat            double precision NOT NULL,
  pickup_lng            double precision NOT NULL,
  delivery_lat          double precision NOT NULL,
  delivery_lng          double precision NOT NULL,
  driver_lat            double precision,
  driver_lng            double precision,
  -- Statut & paiement
  status                delivery_status NOT NULL DEFAULT 'pending',
  payment_status        payment_status_type NOT NULL DEFAULT 'pending',
  total_amount          numeric(10,2) NOT NULL DEFAULT 0,
  estimated_minutes     integer,
  -- Timestamps cycle de vie
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

-- ---------- Index ----------
CREATE INDEX IF NOT EXISTS idx_dt_driver       ON public.delivery_trackings(driver_id);
CREATE INDEX IF NOT EXISTS idx_dt_order        ON public.delivery_trackings(order_id);
CREATE INDEX IF NOT EXISTS idx_dt_status       ON public.delivery_trackings(status);
CREATE INDEX IF NOT EXISTS idx_dt_created_at   ON public.delivery_trackings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_online  ON public.drivers(is_online) WHERE is_online;

-- ---------- Trigger: auto-update updated_at & timestamps transition ----------
CREATE OR REPLACE FUNCTION public.fn_dt_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  -- Timestamps automatiques selon transition
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

-- ---------- Vue : livraisons actives (dashboard temps reel) ----------
CREATE OR REPLACE VIEW public.v_active_deliveries AS
SELECT
  dt.id,
  dt.order_id,
  dt.order_number,
  dt.driver_id,
  d.full_name   AS driver_name,
  d.phone       AS driver_phone,
  d.rating      AS driver_rating,
  dt.customer_name,
  dt.customer_phone,
  dt.delivery_address,
  dt.delivery_notes,
  dt.pickup_lat, dt.pickup_lng,
  dt.delivery_lat, dt.delivery_lng,
  dt.driver_lat, dt.driver_lng,
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
  -- Distance approximative (km) entre livreur et client
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

-- ---------- Vue : statistiques livreurs ----------
CREATE OR REPLACE VIEW public.v_driver_stats AS
SELECT
  d.id,
  d.full_name,
  d.is_online,
  d.rating,
  COUNT(dt.id) FILTER (WHERE dt.status = 'delivered')  AS total_delivered,
  COUNT(dt.id) FILTER (WHERE dt.status NOT IN ('delivered','cancelled')) AS active_count,
  AVG(
    EXTRACT(EPOCH FROM (dt.delivered_at - dt.picked_up_at)) / 60
  ) FILTER (WHERE dt.status = 'delivered' AND dt.picked_up_at IS NOT NULL) AS avg_delivery_minutes,
  SUM(dt.total_amount) FILTER (WHERE dt.status = 'delivered') AS total_revenue
FROM public.drivers d
LEFT JOIN public.delivery_trackings dt ON dt.driver_id = d.id
GROUP BY d.id;

-- ---------- Realtime (Supabase Realtime) ----------
-- Active la publication pour les tables de tracking
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_trackings;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ---------- Seed demo (facultatif) ----------
INSERT INTO public.drivers (full_name, phone, is_online, rating)
SELECT 'Mohamed Karim',     '+216 22 111 222', true, 4.9
WHERE NOT EXISTS (SELECT 1 FROM public.drivers WHERE full_name = 'Mohamed Karim');

INSERT INTO public.drivers (full_name, phone, is_online, rating)
SELECT 'Sami Benali',       '+216 55 333 444', false, 4.7
WHERE NOT EXISTS (SELECT 1 FROM public.drivers WHERE full_name = 'Sami Benali');

-- Fin.
