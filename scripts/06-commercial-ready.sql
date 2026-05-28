-- =============================================================================
-- Migration 06 — Commercial-Ready
-- -----------------------------------------------------------------------------
-- Complete le schema pour un usage commercial :
--   * staff (RH) aligne avec l'API /api/admin/staff
--   * invoices + invoice_items (facturation)
--   * payments (Stripe + cash unifies)
--   * stock_movements + reorder_requests (stock intelligent)
--   * notifications (systeme)
--   * loyalty_points + loyalty_transactions + loyalty_rewards (Agent Loyalty)
--   * reviews (retours clients)
--   * promotions + coupons (Agent Marketing)
--   * reservation_reminders (log)
--   * auth.users -> public.users : trigger de synchronisation
--   * RLS + policies de base
-- Idempotente.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. STAFF (RH) — aligne sur /api/admin/staff (colonnes : position, hire_date, status)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  position      VARCHAR(50) NOT NULL,
    -- admin | manager | server | cashier | cook | delivery
  status        VARCHAR(20) DEFAULT 'active',
    -- active | inactive | on_leave
  hire_date     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  termination_date TIMESTAMP WITH TIME ZONE,
  hourly_rate   DECIMAL(8,2),
  monthly_salary DECIMAL(10,2),
  notes         TEXT,
  -- KPI performance (mis a jour par un job ou l'Agent Analytics)
  orders_done   INTEGER DEFAULT 0,
  total_sales   DECIMAL(12,2) DEFAULT 0,
  avg_time      INTEGER,
  rating        DECIMAL(3,2) DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_position ON staff(position);
CREATE INDEX IF NOT EXISTS idx_staff_status   ON staff(status);

DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 2. INVOICES + INVOICE_ITEMS (facturation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id                VARCHAR(40) PRIMARY KEY,  -- ex: INV-20250101-0001
  order_id          UUID REFERENCES orders(id) ON DELETE SET NULL,
  session_id        UUID REFERENCES table_sessions(id) ON DELETE SET NULL,
  customer_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name     VARCHAR(200),
  customer_email    VARCHAR(255),
  customer_phone    VARCHAR(20),
  subtotal          DECIMAL(10,2) NOT NULL DEFAULT 0,
  tva_rate          DECIMAL(5,4)  NOT NULL DEFAULT 0.19,
  tva_amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount   DECIMAL(10,2) DEFAULT 0,
  total             DECIMAL(10,2) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- draft | validated | paid | cancelled | refunded
  payment_method    VARCHAR(30),
    -- card | cash | online | transfer | wallet
  paid_at           TIMESTAMP WITH TIME ZONE,
  cashier_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  pdf_url           TEXT,
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order  ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date   ON invoices(created_at);

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS invoice_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    VARCHAR(40) REFERENCES invoices(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  VARCHAR(200) NOT NULL,
  quantity      INTEGER NOT NULL,
  unit_price    DECIMAL(10,2) NOT NULL,
  subtotal      DECIMAL(10,2) NOT NULL,
  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);


-- -----------------------------------------------------------------------------
-- 3. PAYMENTS (Stripe + cash unifies)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id           VARCHAR(40) REFERENCES invoices(id) ON DELETE SET NULL,
  order_id             UUID REFERENCES orders(id) ON DELETE SET NULL,
  session_id           UUID REFERENCES table_sessions(id) ON DELETE SET NULL,
  amount               DECIMAL(10,2) NOT NULL,
  currency             VARCHAR(10) DEFAULT 'EUR',
  method               VARCHAR(30) NOT NULL,
    -- card | cash | online | wallet | bank_transfer
  status               VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending | succeeded | failed | refunded
  provider             VARCHAR(30),       -- stripe | manual | cih | paypal ...
  provider_ref         VARCHAR(200),      -- ex: pi_xxx (Stripe PaymentIntent)
  provider_payload     JSONB,
  processed_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at         TIMESTAMP WITH TIME ZONE,
  refund_reason        TEXT,
  refund_amount        DECIMAL(10,2),
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice   ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_order     ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status    ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method    ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_provider  ON payments(provider_ref);

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 4. STOCK — ingredients + mouvements + reorders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(150) NOT NULL UNIQUE,
  unit            VARCHAR(20) NOT NULL DEFAULT 'kg',  -- kg | L | unite | g | ml
  stock_quantity  DECIMAL(12,3) NOT NULL DEFAULT 0,
  threshold_low   DECIMAL(12,3) NOT NULL DEFAULT 0,
  threshold_critical DECIMAL(12,3) NOT NULL DEFAULT 0,
  cost_per_unit   DECIMAL(10,2) DEFAULT 0,
  supplier_name   VARCHAR(200),
  supplier_email  VARCHAR(255),
  expiry_date     DATE,
  last_restocked_at TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_low
  ON ingredients(stock_quantity, threshold_low)
  WHERE stock_quantity <= threshold_low;

DROP TRIGGER IF EXISTS update_ingredients_updated_at ON ingredients;
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS stock_movements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id  UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  movement_type  VARCHAR(20) NOT NULL,   -- in | out | adjustment | loss | transfer
  quantity       DECIMAL(12,3) NOT NULL,
  unit_cost      DECIMAL(10,2),
  reason         TEXT,
  reference_id   UUID,                   -- ex: order_id, purchase_id
  reference_type VARCHAR(30),            -- order | purchase | waste | manual
  performed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON stock_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date       ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type       ON stock_movements(movement_type);


CREATE TABLE IF NOT EXISTS product_ingredients (
  product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id   UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity        DECIMAL(12,3) NOT NULL,   -- quantite par unite de produit
  PRIMARY KEY (product_id, ingredient_id)
);


CREATE TABLE IF NOT EXISTS reorder_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id   UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  suggested_qty   DECIMAL(12,3) NOT NULL,
  estimated_cost  DECIMAL(10,2),
  status          VARCHAR(20) DEFAULT 'pending',  -- pending | ordered | received | cancelled
  generated_by    VARCHAR(30) DEFAULT 'ai_agent', -- ai_agent | manual
  supplier_name   VARCHAR(200),
  expected_at     DATE,
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reorder_status ON reorder_requests(status);

DROP TRIGGER IF EXISTS update_reorder_requests_updated_at ON reorder_requests;
CREATE TRIGGER update_reorder_requests_updated_at
  BEFORE UPDATE ON reorder_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 5. NOTIFICATIONS (systeme + push)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_role VARCHAR(20),              -- CUSTOMER | STAFF | ADMIN | broadcast
  type           VARCHAR(50) NOT NULL,
    -- order_new | order_ready | payment_received | stock_alert
    -- | reservation_reminder | marketing | loyalty | event_update
  title          VARCHAR(200) NOT NULL,
  message        TEXT,
  data           JSONB,
  severity       VARCHAR(20) DEFAULT 'info', -- info | warning | error | success
  read_at        TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(recipient_id, created_at DESC)
  WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);


-- -----------------------------------------------------------------------------
-- 6. LOYALTY (fidelite)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loyalty_accounts (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  tier           VARCHAR(20) DEFAULT 'bronze',  -- bronze | silver | gold | platinum
  total_spent    DECIMAL(12,2) DEFAULT 0,
  visits_count   INTEGER DEFAULT 0,
  last_visit_at  TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_loyalty_accounts_updated_at ON loyalty_accounts;
CREATE TRIGGER update_loyalty_accounts_updated_at
  BEFORE UPDATE ON loyalty_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  points_change  INTEGER NOT NULL,         -- positif = gain, negatif = depense
  reason         VARCHAR(100),             -- order_reward | redemption | bonus | expired
  reference_id   VARCHAR(100),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON loyalty_transactions(user_id);


CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(150) NOT NULL,
  description    TEXT,
  points_cost    INTEGER NOT NULL,
  reward_type    VARCHAR(30) NOT NULL,     -- discount | free_item | upgrade | gift
  reward_value   DECIMAL(10,2),
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  active         BOOLEAN DEFAULT true,
  expires_at     TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- 7. REVIEWS (notes clients)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  event_id       UUID REFERENCES events(id) ON DELETE SET NULL,
  rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  food_rating    INTEGER CHECK (food_rating BETWEEN 1 AND 5),
  speed_rating   INTEGER CHECK (speed_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  comment        TEXT,
  sentiment_score DECIMAL(4,2),   -- rempli par l'Agent Sentiment (-1..1)
  sentiment_label VARCHAR(20),    -- positive | neutral | negative
  published      BOOLEAN DEFAULT true,
  replied_at     TIMESTAMP WITH TIME ZONE,
  reply          TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating  ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews(sentiment_label);


-- -----------------------------------------------------------------------------
-- 8. PROMOTIONS + COUPONS (Agent Marketing, Pricing)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promotions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  promo_type    VARCHAR(30) NOT NULL,    -- percent | amount | bogo | bundle | happy_hour
  value         DECIMAL(10,2),           -- pourcentage ou montant
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES categories(id) ON DELETE CASCADE,
  starts_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at       TIMESTAMP WITH TIME ZONE,
  days_of_week  INTEGER[],                -- ex: [1,2,3] pour lundi-mardi-mercredi
  hour_start    INTEGER,                  -- 0-23
  hour_end      INTEGER,
  min_order     DECIMAL(10,2),
  usage_limit   INTEGER,
  usage_count   INTEGER DEFAULT 0,
  active        BOOLEAN DEFAULT true,
  generated_by  VARCHAR(30) DEFAULT 'manual',  -- manual | ai_marketing | ai_pricing
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promos_active ON promotions(active, starts_at, ends_at);

DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS coupons (
  code            VARCHAR(50) PRIMARY KEY,
  promotion_id    UUID REFERENCES promotions(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  discount_type   VARCHAR(20) DEFAULT 'percent',
  discount_value  DECIMAL(10,2) NOT NULL,
  valid_until     TIMESTAMP WITH TIME ZONE,
  used_at         TIMESTAMP WITH TIME ZONE,
  used_on_order   UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- 9. RESERVATION REMINDERS (log SMS/email)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservation_reminders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES table_reservations(id) ON DELETE CASCADE,
  channel        VARCHAR(20) NOT NULL,     -- sms | email | push | whatsapp
  sent_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success        BOOLEAN DEFAULT true,
  provider       VARCHAR(50),
  message        TEXT,
  error          TEXT
);

CREATE INDEX IF NOT EXISTS idx_reservation_reminders_res ON reservation_reminders(reservation_id);


-- -----------------------------------------------------------------------------
-- 10. SYNCHRO auth.users  ->  public.users
--     Quand un utilisateur se cree (signup), on le copie automatiquement
--     dans public.users. Les collisions email/id existantes sont ignorees
--     (pour ne jamais casser l'auth en cas de vieux stubs en base).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_auth_user_to_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  -- Si deja present par id, on met a jour les infos mutables (email, metadata)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    UPDATE public.users
    SET email     = NEW.email,
        full_name = COALESCE(
          NEW.raw_user_meta_data ->> 'full_name',
          NULLIF(CONCAT_WS(' ',
            NEW.raw_user_meta_data ->> 'first_name',
            NEW.raw_user_meta_data ->> 'last_name'
          ), ''),
          public.users.full_name
        ),
        phone = COALESCE(NEW.raw_user_meta_data ->> 'phone', public.users.phone),
        role  = COALESCE(NEW.raw_user_meta_data ->> 'role', public.users.role)
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Si un autre row a le meme email (vieux stub manuel), on skip l'insert
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    RETURN NEW;
  END IF;

  -- Sinon, creation normale
  INSERT INTO public.users (id, email, full_name, phone, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NULLIF(CONCAT_WS(' ',
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
      ), ''),
      NEW.email
    ),
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'CUSTOMER'),
    NEW.created_at
  );
  RETURN NEW;

EXCEPTION WHEN unique_violation THEN
  -- Dernier filet de securite : on ne bloque jamais le signup
  RETURN NEW;
END;
$$;

-- Le trigger est pose sur auth.users (schema protege -> SECURITY DEFINER requis)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_auth_user_to_public();

-- Synchro initiale : seulement les auth.users dont NI l'id NI l'email
-- n'existent deja dans public.users.
INSERT INTO public.users (id, email, full_name, phone, role, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data ->> 'full_name',
    NULLIF(CONCAT_WS(' ',
      au.raw_user_meta_data ->> 'first_name',
      au.raw_user_meta_data ->> 'last_name'
    ), ''),
    au.email
  ),
  au.raw_user_meta_data ->> 'phone',
  COALESCE(au.raw_user_meta_data ->> 'role', 'CUSTOMER'),
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu
  WHERE pu.id = au.id OR pu.email = au.email
);


-- -----------------------------------------------------------------------------
-- 11. VUES utilitaires pour les dashboards
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT DATE(p.created_at)                               AS day,
       COUNT(DISTINCT p.id)                              AS payments_count,
       SUM(p.amount) FILTER (WHERE p.method = 'cash')    AS cash_total,
       SUM(p.amount) FILTER (WHERE p.method = 'card')    AS card_total,
       SUM(p.amount) FILTER (WHERE p.method = 'online')  AS online_total,
       SUM(p.amount)                                     AS total
FROM payments p
WHERE p.status = 'succeeded'
GROUP BY DATE(p.created_at)
ORDER BY DATE(p.created_at) DESC;


CREATE OR REPLACE VIEW v_low_stock AS
SELECT i.id,
       i.name,
       i.stock_quantity,
       i.threshold_low,
       i.threshold_critical,
       CASE
         WHEN i.stock_quantity <= i.threshold_critical THEN 'critical'
         WHEN i.stock_quantity <= i.threshold_low      THEN 'warning'
         ELSE 'ok'
       END AS alert_status
FROM ingredients i
WHERE i.stock_quantity <= i.threshold_low
ORDER BY i.stock_quantity ASC;


CREATE OR REPLACE VIEW v_top_products AS
SELECT p.id,
       p.name,
       pa.sold_count,
       pa.revenue_total,
       pa.classification
FROM products p
LEFT JOIN product_analytics pa ON pa.product_id = p.id
ORDER BY COALESCE(pa.sold_count, 0) DESC;


-- -----------------------------------------------------------------------------
-- 12. RLS — Row Level Security (policies de base, production-ready)
-- -----------------------------------------------------------------------------
-- Strategie : le service_role bypasse tout (pour les API server-side).
--             Les clients authentifies voient leurs propres donnees.

ALTER TABLE invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_memory     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_alerts      ENABLE ROW LEVEL SECURITY;

-- INVOICES : un client voit ses propres factures
DROP POLICY IF EXISTS "invoices_own_read" ON invoices;
CREATE POLICY "invoices_own_read"
  ON invoices FOR SELECT
  USING (
    auth.uid() = customer_id
    OR (auth.jwt() ->> 'role') IN ('STAFF', 'ADMIN')
  );

-- NOTIFICATIONS : un user voit les siennes
DROP POLICY IF EXISTS "notif_own_read" ON notifications;
CREATE POLICY "notif_own_read"
  ON notifications FOR SELECT
  USING (
    auth.uid() = recipient_id
    OR (auth.jwt() ->> 'role') IN ('STAFF', 'ADMIN')
    OR recipient_role = 'broadcast'
  );

DROP POLICY IF EXISTS "notif_own_update" ON notifications;
CREATE POLICY "notif_own_update"
  ON notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- LOYALTY : un user voit son compte + ses transactions
DROP POLICY IF EXISTS "loyalty_acc_own" ON loyalty_accounts;
CREATE POLICY "loyalty_acc_own"
  ON loyalty_accounts FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') IN ('STAFF', 'ADMIN')
  );

DROP POLICY IF EXISTS "loyalty_tx_own" ON loyalty_transactions;
CREATE POLICY "loyalty_tx_own"
  ON loyalty_transactions FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') IN ('STAFF', 'ADMIN')
  );

-- REVIEWS : tout le monde lit, seulement le user peut ecrire / modifier le sien
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read"
  ON reviews FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "reviews_own_insert" ON reviews;
CREATE POLICY "reviews_own_insert"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- CLIENT_MEMORY : le user voit sa propre memoire (via auth.uid().text = client_id)
DROP POLICY IF EXISTS "memory_own" ON client_memory;
CREATE POLICY "memory_own"
  ON client_memory FOR ALL
  USING (
    client_id = auth.uid()::text
    OR (auth.jwt() ->> 'role') IN ('STAFF', 'ADMIN')
  );

-- CHAT_SESSIONS : idem
DROP POLICY IF EXISTS "chat_own" ON chat_sessions;
CREATE POLICY "chat_own"
  ON chat_sessions FOR ALL
  USING (
    client_id = auth.uid()::text
    OR (auth.jwt() ->> 'role') IN ('STAFF', 'ADMIN')
  );

-- EVENT_TICKETS : par email (ou role staff/admin)
DROP POLICY IF EXISTS "tickets_own_read" ON event_tickets;
CREATE POLICY "tickets_own_read"
  ON event_tickets FOR SELECT
  USING (
    (auth.jwt() ->> 'email') = guest_email
    OR (auth.jwt() ->> 'role') IN ('STAFF', 'ADMIN')
  );

-- TABLE_ALERTS : seul le staff voit toutes les alertes (clients n'y accedent pas)
DROP POLICY IF EXISTS "alerts_staff_only" ON table_alerts;
CREATE POLICY "alerts_staff_only"
  ON table_alerts FOR ALL
  USING ((auth.jwt() ->> 'role') IN ('STAFF', 'ADMIN'));


-- -----------------------------------------------------------------------------
-- 13. VERIFICATION FINALE
-- -----------------------------------------------------------------------------
SELECT 'Migration 06 appliquee avec succes'          AS status,
       (SELECT COUNT(*) FROM information_schema.tables
         WHERE table_schema = 'public')              AS total_tables,
       (SELECT COUNT(*) FROM information_schema.views
         WHERE table_schema = 'public')              AS total_views;
