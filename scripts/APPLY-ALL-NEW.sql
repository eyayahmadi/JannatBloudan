-- =============================================================================
-- APPLY-ALL-NEW.sql
-- =============================================================================
-- COPIE TOUT CE FICHIER ET COLLE-LE DANS : Supabase -> SQL Editor -> RUN.
-- Cela applique en une fois les migrations 04 (QR flow + AI) et 05 (roles).
-- Idempotent : tu peux le relancer autant de fois que tu veux sans erreur.
-- =============================================================================

-- S'assure que la fonction utilitaire `update_updated_at_column` existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- #############################################################################
-- ##################### MIGRATION 04 — QR Flow + AI ###########################
-- #############################################################################

-- 1. TABLES DU RESTAURANT + statut canonique
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id             INTEGER PRIMARY KEY,
  table_number   INTEGER NOT NULL UNIQUE,
  zone           VARCHAR(50)  DEFAULT 'interieur',
  capacity       INTEGER      DEFAULT 4,
  qr_token       VARCHAR(128) UNIQUE,
  status         VARCHAR(30)  NOT NULL DEFAULT 'FREE',
  current_session_id UUID,
  last_activity  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO restaurant_tables (id, table_number, zone, capacity)
SELECT i, i,
       CASE
         WHEN i <= 8  THEN 'interieur'
         WHEN i <= 14 THEN 'terrasse'
         WHEN i <= 17 THEN 'vip'
         ELSE              'gaming'
       END,
       CASE WHEN i <= 17 THEN 4 ELSE 6 END
FROM generate_series(1, 20) AS i
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS update_restaurant_tables_updated_at ON restaurant_tables;
CREATE TRIGGER update_restaurant_tables_updated_at
  BEFORE UPDATE ON restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_tables_status ON restaurant_tables(status);


-- 2. SESSIONS DE TABLE
CREATE TABLE IF NOT EXISTS table_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id     INTEGER REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  opened_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at    TIMESTAMP WITH TIME ZONE,
  total        DECIMAL(10,2) DEFAULT 0,
  paid         BOOLEAN DEFAULT false,
  payment_method VARCHAR(30),
  client_id    UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_table ON table_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_sessions_open  ON table_sessions(closed_at)
  WHERE closed_at IS NULL;


-- 3. EXTENSIONS à orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id     INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id   UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source       VARCHAR(20) DEFAULT 'pos';

DO $$ BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT orders_table_fk
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT orders_session_fk
    FOREIGN KEY (session_id) REFERENCES table_sessions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_orders_table   ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_source  ON orders(source);


-- 4. ALERTES TABLE
CREATE TABLE IF NOT EXISTS table_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id     INTEGER REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  session_id   UUID REFERENCES table_sessions(id) ON DELETE SET NULL,
  type         VARCHAR(30) NOT NULL,
  message      TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at  TIMESTAMP WITH TIME ZONE,
  resolved_by  UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_table
  ON table_alerts(table_id, resolved_at);
CREATE INDEX IF NOT EXISTS idx_alerts_type
  ON table_alerts(type) WHERE resolved_at IS NULL;


-- 5. TICKETS D'ÉVÉNEMENTS
CREATE TABLE IF NOT EXISTS event_tickets (
  code              VARCHAR(40) PRIMARY KEY,
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_title       VARCHAR(200),
  guest_name        VARCHAR(200) NOT NULL,
  guest_email       VARCHAR(255) NOT NULL,
  guest_phone       VARCHAR(20),
  adults            INTEGER NOT NULL DEFAULT 1,
  children          INTEGER NOT NULL DEFAULT 0,
  unit_price_adult  DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_price_child  DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid              BOOLEAN NOT NULL DEFAULT false,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending',
  special_requests  TEXT,
  checked_in_at     TIMESTAMP WITH TIME ZONE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_tickets_event  ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_status ON event_tickets(status);

DROP TRIGGER IF EXISTS update_event_tickets_updated_at ON event_tickets;
CREATE TRIGGER update_event_tickets_updated_at
  BEFORE UPDATE ON event_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 6. MÉMOIRE AGENT CLIENT
CREATE TABLE IF NOT EXISTS client_memory (
  client_id        TEXT PRIMARY KEY,
  taste_vector     JSONB DEFAULT '{}'::jsonb,
  order_summaries  JSONB DEFAULT '[]'::jsonb,
  reactions        JSONB DEFAULT '[]'::jsonb,
  chunks           JSONB DEFAULT '[]'::jsonb,
  learning_score   DECIMAL(5,2) DEFAULT 0,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_client_memory_updated_at ON client_memory;
CREATE TRIGGER update_client_memory_updated_at
  BEFORE UPDATE ON client_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 7. HISTORIQUE CHATBOT
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id    TEXT PRIMARY KEY,
  client_id     TEXT,
  messages      JSONB NOT NULL DEFAULT '[]'::jsonb,
  lang          VARCHAR(10),
  last_intent   VARCHAR(50),
  sentiment     DECIMAL(4,2),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_client ON chat_sessions(client_id);

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 8. PRODUCT ANALYTICS (Menu Engineering)
CREATE TABLE IF NOT EXISTS product_analytics (
  product_id     UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  sold_count     INTEGER DEFAULT 0,
  revenue_total  DECIMAL(12,2) DEFAULT 0,
  cost_total     DECIMAL(12,2) DEFAULT 0,
  last_sold_at   TIMESTAMP WITH TIME ZONE,
  classification VARCHAR(20),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_product_analytics_updated_at ON product_analytics;
CREATE TRIGGER update_product_analytics_updated_at
  BEFORE UPDATE ON product_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 9. AGENT DECISIONS LOG
CREATE TABLE IF NOT EXISTS agent_decisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent        VARCHAR(50) NOT NULL,
  action       VARCHAR(100) NOT NULL,
  payload      JSONB,
  applied      BOOLEAN DEFAULT false,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent ON agent_decisions(agent);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_date  ON agent_decisions(created_at);


-- 10. VUE tables à encaisser
CREATE OR REPLACE VIEW v_tables_to_cashout AS
SELECT t.id                                                   AS table_id,
       t.table_number,
       t.status                                               AS table_status,
       COALESCE(SUM(o.total), 0)                              AS open_total,
       COUNT(o.id) FILTER (WHERE o.status <> 'annulée'
                           AND COALESCE(o.payment_status,'en attente') <> 'payé')
                                                              AS open_orders,
       BOOL_OR(a.type = 'request_bill'
               AND a.resolved_at IS NULL)                     AS bill_requested,
       BOOL_OR(a.type = 'call_server'
               AND a.resolved_at IS NULL)                     AS calling_server
FROM restaurant_tables t
LEFT JOIN orders        o ON o.table_id = t.id
LEFT JOIN table_alerts  a ON a.table_id = t.id
GROUP BY t.id, t.table_number, t.status;


-- #############################################################################
-- ##################### MIGRATION 05 — Roles & Auth ###########################
-- #############################################################################

-- 1. Elargir user_roles
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS auth_level VARCHAR(20) DEFAULT 'STAFF';

UPDATE user_roles SET auth_level = 'CUSTOMER', description = 'Client du restaurant'
  WHERE name = 'client';
UPDATE user_roles SET auth_level = 'STAFF',    description = 'Serveur en salle'
  WHERE name = 'serveur';
UPDATE user_roles SET auth_level = 'STAFF',    description = 'Caissier / POS'
  WHERE name = 'caissier';
UPDATE user_roles SET auth_level = 'ADMIN',    description = 'Administrateur - acces total'
  WHERE name = 'admin';

INSERT INTO user_roles (name, auth_level, description, permissions) VALUES
  ('manager',    'ADMIN', 'Manager / responsable restaurant',
    '{"can_manage_staff": true, "can_view_reports": true, "can_manage_menu": true, "can_view_finance": true}'::jsonb),
  ('cuisinier',  'STAFF', 'Cuisinier / KDS',
    '{"can_view_kitchen": true, "can_update_order_status": true, "can_report_stock_issue": true}'::jsonb),
  ('livreur',    'STAFF', 'Livreur',
    '{"can_view_orders": true, "can_update_delivery_status": true}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  auth_level  = EXCLUDED.auth_level,
  description = EXCLUDED.description,
  permissions = user_roles.permissions || EXCLUDED.permissions;


-- 2. Colonne role sur users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'CUSTOMER';

UPDATE users u
SET role = ur.auth_level
FROM user_roles ur
WHERE u.role_id = ur.id
  AND (u.role IS NULL OR u.role = 'CUSTOMER')
  AND ur.auth_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);


-- 3. Trigger de synchro
CREATE OR REPLACE FUNCTION sync_user_role_from_role_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role_id IS NOT NULL THEN
    SELECT auth_level INTO NEW.role
    FROM user_roles
    WHERE id = NEW.role_id;
    IF NEW.role IS NULL THEN
      NEW.role := 'STAFF';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_sync_role_from_role_id ON users;
CREATE TRIGGER users_sync_role_from_role_id
  BEFORE INSERT OR UPDATE OF role_id ON users
  FOR EACH ROW EXECUTE FUNCTION sync_user_role_from_role_id();


-- 4. staff_profiles
CREATE TABLE IF NOT EXISTS staff_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  job_role      VARCHAR(30) NOT NULL,
  status        VARCHAR(20) DEFAULT 'active',
  hire_date     DATE,
  hourly_rate   DECIMAL(8,2),
  orders_done   INTEGER DEFAULT 0,
  avg_time      INTEGER,
  rating        DECIMAL(3,2) DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_job_role ON staff_profiles(job_role);
CREATE INDEX IF NOT EXISTS idx_staff_status   ON staff_profiles(status);

DROP TRIGGER IF EXISTS update_staff_profiles_updated_at ON staff_profiles;
CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 5. Vue pratique
CREATE OR REPLACE VIEW v_users_with_role AS
SELECT u.id,
       u.email,
       u.full_name,
       u.phone,
       u.role                   AS auth_role,
       ur.name                  AS job_role,
       ur.description           AS job_description,
       u.is_active,
       u.created_at
FROM users u
LEFT JOIN user_roles ur ON ur.id = u.role_id;


-- =============================================================================
-- VERIFICATIONS (à executer apres)
-- =============================================================================
-- 1. Les 7 roles :
--    SELECT name, auth_level, description FROM user_roles ORDER BY auth_level, name;
--
-- 2. Les nouvelles tables :
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--      AND table_name IN (
--        'restaurant_tables','table_sessions','table_alerts','event_tickets',
--        'client_memory','chat_sessions','product_analytics','agent_decisions',
--        'staff_profiles'
--      )
--    ORDER BY table_name;
--
-- 3. Les 20 tables seedees :
--    SELECT count(*) FROM restaurant_tables;
--
-- 4. La vue :
--    SELECT * FROM v_tables_to_cashout LIMIT 5;
-- =============================================================================

SELECT 'Migration 04+05 appliquee avec succes' AS status,
       (SELECT count(*) FROM user_roles)              AS roles_count,
       (SELECT count(*) FROM restaurant_tables)       AS tables_count;
