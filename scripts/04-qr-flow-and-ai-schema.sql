-- =============================================================================
-- Migration 04 — QR Flow, Events Publics, AI Memory, Alertes temps réel
-- Idempotente : peut être exécutée plusieurs fois sans erreur.
-- A lancer dans Supabase -> SQL Editor (ou via psql).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLES DU RESTAURANT (identité QR) + statut canonique
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id             INTEGER PRIMARY KEY,
  table_number   INTEGER NOT NULL UNIQUE,
  zone           VARCHAR(50)  DEFAULT 'interieur',  -- interieur | terrasse | vip | gaming
  capacity       INTEGER      DEFAULT 4,
  qr_token       VARCHAR(128) UNIQUE,               -- optionnel, URL signée
  status         VARCHAR(30)  NOT NULL DEFAULT 'FREE',
    -- FREE | OCCUPIED | ORDERING | IN_KITCHEN | READY | SERVED
    -- | PAYMENT_REQUESTED | PAID | CALL_SERVER
  current_session_id UUID,
  last_activity  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed 20 tables si vides
INSERT INTO restaurant_tables (id, table_number, zone, capacity)
SELECT i,
       i,
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

-- -----------------------------------------------------------------------------
-- 2. SESSIONS DE TABLE (une session = client assis, plusieurs commandes possibles)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3. EXTENSIONS à la table `orders` (origine QR + table + session)
-- -----------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id     INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id   UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source       VARCHAR(20) DEFAULT 'pos';
  -- qr_self_service | server | pos | delivery

-- FK (seulement si pas déjà posée)
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

-- -----------------------------------------------------------------------------
-- 4. ALERTES TABLE (appel serveur, addition, paiement encaissé)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS table_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id     INTEGER REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  session_id   UUID REFERENCES table_sessions(id) ON DELETE SET NULL,
  type         VARCHAR(30) NOT NULL,
    -- call_server | request_bill | help | payment_done
  message      TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at  TIMESTAMP WITH TIME ZONE,
  resolved_by  UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_table
  ON table_alerts(table_id, resolved_at);
CREATE INDEX IF NOT EXISTS idx_alerts_type
  ON table_alerts(type) WHERE resolved_at IS NULL;

-- -----------------------------------------------------------------------------
-- 5. TICKETS D'ÉVÉNEMENTS PUBLICS (buffet, karaoké, soirée…)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_tickets (
  code              VARCHAR(40) PRIMARY KEY,   -- ex. "EVT-XXXX-YYYY"
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
    -- pending | paid | checked_in | cancelled
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

-- -----------------------------------------------------------------------------
-- 6. MÉMOIRE AGENT CLIENT (goûts, résumés, chunks RAG)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_memory (
  client_id        TEXT PRIMARY KEY,        -- email, id user ou session
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

-- -----------------------------------------------------------------------------
-- 7. HISTORIQUE DES SESSIONS CHATBOT (persistence optionnelle)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id    TEXT PRIMARY KEY,
  client_id     TEXT,
  messages      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{role, content, at}]
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

-- -----------------------------------------------------------------------------
-- 8. AGENT UPSELL / MENU ENGINEERING — données d'analytics simples
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_analytics (
  product_id     UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  sold_count     INTEGER DEFAULT 0,
  revenue_total  DECIMAL(12,2) DEFAULT 0,
  cost_total     DECIMAL(12,2) DEFAULT 0,
  last_sold_at   TIMESTAMP WITH TIME ZONE,
  classification VARCHAR(20),         -- star | cash_cow | puzzle | dog
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_product_analytics_updated_at ON product_analytics;
CREATE TRIGGER update_product_analytics_updated_at
  BEFORE UPDATE ON product_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 9. LOG DES DÉCISIONS AGENTS (Auto Decision Maker, Pricing, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_decisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent        VARCHAR(50) NOT NULL,       -- pricing | upsell | stock | marketing ...
  action       VARCHAR(100) NOT NULL,
  payload      JSONB,
  applied      BOOLEAN DEFAULT false,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent ON agent_decisions(agent);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_date  ON agent_decisions(created_at);

-- -----------------------------------------------------------------------------
-- 10. RLS (Row Level Security) — à activer selon ta politique d'accès
--     Par défaut : tout est ouvert au service_role, bloqué à l'anon.
--     Décommente pour activer.
-- -----------------------------------------------------------------------------
-- ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE table_alerts      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE event_tickets     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE client_memory     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions     ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "tickets_read_own" ON event_tickets
--   FOR SELECT USING (auth.jwt() ->> 'email' = guest_email);

-- -----------------------------------------------------------------------------
-- 11. VUE PRATIQUE : tableau de bord caisse (tables à encaisser)
-- -----------------------------------------------------------------------------
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

-- Fin de la migration.
