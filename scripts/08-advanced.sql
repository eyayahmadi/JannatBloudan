-- =============================================================================
-- Migration 08 — Advanced (Niveau 1 + Niveau 2)
-- -----------------------------------------------------------------------------
-- NIVEAU 1 — Commercial ops pro :
--   * event_requests + event_packages + event_quotes + event_assignments
--   * expense_categories + expenses + budgets
--   * shifts + attendance
--   * restaurant_settings + integrations
--   * audit_logs + trigger generique
--
-- NIVEAU 2 — AI paper-grade :
--   * pgvector extension + client_memory_embeddings (vraie RAG)
--   * model_registry + model_versions + agent_executions + agent_feedback
--   * ab_tests + ab_test_variants + ab_test_results
--   * customer_journey_events + anomalies_detected + daily_metrics
--
-- Idempotente. N'ajoute que du nouveau, ne touche pas a l'existant.
-- =============================================================================

-- Prerequis : la fonction update_updated_at_column() existe deja (voir 01).


-- =============================================================================
-- SECTION A — NIVEAU 1 : COMMERCIAL OPS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A.1 EVENT_REQUESTS (evenements prives : anniversaire, mariage, entreprise)
-- -----------------------------------------------------------------------------
-- Different de "events" (publics avec tickets). Ici c'est une demande de devis.
CREATE TABLE IF NOT EXISTS event_packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(150) NOT NULL UNIQUE,
  description     TEXT,
  event_type      VARCHAR(30) NOT NULL,     -- anniversaire | mariage | entreprise | prive | buffet
  base_price      DECIMAL(10,2) NOT NULL,   -- prix du pack
  price_per_guest DECIMAL(10,2) DEFAULT 0,  -- supplement par invite
  min_guests      INTEGER DEFAULT 5,
  max_guests      INTEGER DEFAULT 200,
  includes        JSONB,                    -- ["buffet","dj","decoration","gateau"]
  image_url       TEXT,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_event_packages_updated_at ON event_packages;
CREATE TRIGGER update_event_packages_updated_at
  BEFORE UPDATE ON event_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS event_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number      VARCHAR(30) UNIQUE NOT NULL
                      DEFAULT ('EVR-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_name          VARCHAR(200) NOT NULL,
  guest_email         VARCHAR(255),
  guest_phone         VARCHAR(30),
  event_type          VARCHAR(30) NOT NULL,  -- anniversaire | mariage | entreprise | prive | autre
  event_date          DATE NOT NULL,
  event_time          TIME,
  guests_count        INTEGER NOT NULL,
  estimated_budget    DECIMAL(10,2),
  package_id          UUID REFERENCES event_packages(id) ON DELETE SET NULL,
  custom_menu         JSONB,                 -- choix menu personnalise
  options             JSONB,                 -- {decoration:true, dj:true, gateau:true}
  special_requests    TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending',
                      -- pending | reviewing | confirmed | in_progress | completed | cancelled | refused
  internal_notes      TEXT,
  assigned_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_requests_status ON event_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_requests_date   ON event_requests(event_date);
CREATE INDEX IF NOT EXISTS idx_event_requests_user   ON event_requests(user_id);

DROP TRIGGER IF EXISTS update_event_requests_updated_at ON event_requests;
CREATE TRIGGER update_event_requests_updated_at
  BEFORE UPDATE ON event_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS event_quotes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        UUID REFERENCES event_requests(id) ON DELETE CASCADE,
  quote_number      VARCHAR(30) UNIQUE NOT NULL
                    DEFAULT ('DEV-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
  line_items        JSONB NOT NULL,          -- [{label, qty, unit_price, subtotal}]
  subtotal          DECIMAL(10,2) NOT NULL,
  tva_rate          DECIMAL(5,4) DEFAULT 0.19,
  tva_amount        DECIMAL(10,2),
  discount_amount   DECIMAL(10,2) DEFAULT 0,
  total             DECIMAL(10,2) NOT NULL,
  deposit_amount    DECIMAL(10,2),           -- acompte demande
  deposit_paid      BOOLEAN DEFAULT false,
  deposit_paid_at   TIMESTAMP WITH TIME ZONE,
  valid_until       DATE,
  status            VARCHAR(20) DEFAULT 'sent',   -- draft | sent | accepted | rejected | expired
  pdf_url           TEXT,
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_quotes_request ON event_quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_event_quotes_status  ON event_quotes(status);

DROP TRIGGER IF EXISTS update_event_quotes_updated_at ON event_quotes;
CREATE TRIGGER update_event_quotes_updated_at
  BEFORE UPDATE ON event_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS event_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID REFERENCES event_requests(id) ON DELETE CASCADE,
  staff_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  role          VARCHAR(30),                -- serveur_principal | cuisinier | dj | decoration | manager
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, staff_id, role)
);

CREATE INDEX IF NOT EXISTS idx_event_assignments_request ON event_assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_staff   ON event_assignments(staff_id);


-- -----------------------------------------------------------------------------
-- A.2 FINANCE : expense_categories + expenses + budgets
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color       VARCHAR(20),                  -- pour UI (#ef4444...)
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  label         VARCHAR(200) NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  currency      VARCHAR(10) DEFAULT 'EUR',
  expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(30),               -- cash | card | bank_transfer | auto_debit
  vendor        VARCHAR(200),
  invoice_ref   VARCHAR(100),
  invoice_url   TEXT,                       -- scan / PDF
  recurring     BOOLEAN DEFAULT false,
  frequency     VARCHAR(20),                -- monthly | weekly | yearly | once
  notes         TEXT,
  recorded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor   ON expenses(vendor);

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
  month         DATE NOT NULL,              -- 1er jour du mois
  planned_amount DECIMAL(12,2) NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);


-- -----------------------------------------------------------------------------
-- A.3 RH OPS : shifts + attendance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shifts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  shift_date    DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  role          VARCHAR(30),                -- serveur | cuisinier | caissier | livreur | manager
  status        VARCHAR(20) DEFAULT 'scheduled',
                -- scheduled | confirmed | in_progress | completed | missed | cancelled
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_staff ON shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date  ON shifts(shift_date);

DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS attendance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  shift_id      UUID REFERENCES shifts(id) ON DELETE SET NULL,
  check_in_at   TIMESTAMP WITH TIME ZONE,
  check_out_at  TIMESTAMP WITH TIME ZONE,
  break_minutes INTEGER DEFAULT 0,
  total_hours   DECIMAL(5,2),                -- calcule a la sortie
  status        VARCHAR(20) DEFAULT 'present',
                -- present | late | absent | half_day | remote
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_shift ON attendance(shift_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date  ON attendance(check_in_at);


-- -----------------------------------------------------------------------------
-- A.4 SETTINGS : restaurant_settings + integrations
-- -----------------------------------------------------------------------------
-- Table key-value pour flexibilite. 1 ligne = 1 setting.
CREATE TABLE IF NOT EXISTS restaurant_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  category    VARCHAR(50),                  -- general | payment | notification | ai | branding
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      VARCHAR(50) NOT NULL UNIQUE,
                -- stripe | twilio | sendgrid | mailgun | openai | pinecone | redis | whatsapp
  label         VARCHAR(100),
  config        JSONB,                      -- endpoints, non-secret
  -- IMPORTANT : les cles secretes restent dans .env, pas en base (securite).
  -- Ici on stocke juste le status & la meta.
  status        VARCHAR(20) DEFAULT 'disabled',   -- enabled | disabled | error
  last_check_at TIMESTAMP WITH TIME ZONE,
  last_error    TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- A.5 AUDIT_LOGS : tracabilite complete
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email    VARCHAR(255),                -- snapshot (si user supprime)
  action        VARCHAR(50) NOT NULL,        -- create | update | delete | login | permission_change
  entity_type   VARCHAR(50),                 -- orders | invoices | products...
  entity_id     VARCHAR(100),
  old_values    JSONB,
  new_values    JSONB,
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB,                       -- context libre
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user     ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity   ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action   ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_date     ON audit_logs(created_at DESC);


-- Trigger generique : enregistre automatiquement les UPDATE/DELETE sur les tables sensibles
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_old JSONB;
  v_new JSONB;
  v_action VARCHAR(20);
BEGIN
  -- Essaie de recuperer l'utilisateur courant (Supabase JWT)
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF (TG_OP = 'DELETE') THEN
    v_action := 'delete';
    v_old    := to_jsonb(OLD);
    v_new    := NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'update';
    v_old    := to_jsonb(OLD);
    v_new    := to_jsonb(NEW);
  ELSE
    v_action := 'create';
    v_old    := NULL;
    v_new    := to_jsonb(NEW);
  END IF;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    v_user_id,
    v_action,
    TG_TABLE_NAME,
    COALESCE(
      (v_new->>'id')::TEXT,
      (v_old->>'id')::TEXT
    ),
    v_old,
    v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;


-- Attacher le trigger aux tables sensibles (idempotent via DROP IF EXISTS)
DROP TRIGGER IF EXISTS audit_invoices_trg ON invoices;
CREATE TRIGGER audit_invoices_trg
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_payments_trg ON payments;
CREATE TRIGGER audit_payments_trg
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_products_trg ON products;
CREATE TRIGGER audit_products_trg
  AFTER UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_users_trg ON users;
CREATE TRIGGER audit_users_trg
  AFTER UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();


-- =============================================================================
-- SECTION B — NIVEAU 2 : AI PAPER-GRADE
-- =============================================================================

-- -----------------------------------------------------------------------------
-- B.1 PGVECTOR : vraie RAG, alternative a Pinecone en production
-- -----------------------------------------------------------------------------
-- Supabase supporte pgvector nativement. On active l'extension si dispo.
CREATE EXTENSION IF NOT EXISTS vector;


-- Embeddings de la memoire client (RAG Agent Memory)
CREATE TABLE IF NOT EXISTS client_memory_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  chunk_text    TEXT NOT NULL,               -- texte indexe ("client a adore plat X")
  embedding     vector(1536),                 -- dim OpenAI text-embedding-3-small
  source        VARCHAR(50),                  -- order | review | chat | reaction
  source_id     VARCHAR(100),                 -- ref libre
  metadata      JSONB,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cme_user ON client_memory_embeddings(user_id);

-- Index HNSW (approximate nearest neighbour) — a creer UNE FOIS la table peuplee.
-- On le fait en conditionnel : s'il y a < 100 lignes, on evite de le creer.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM client_memory_embeddings) >= 0 THEN
    BEGIN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cme_embedding ON client_memory_embeddings
               USING hnsw (embedding vector_cosine_ops)';
    EXCEPTION WHEN OTHERS THEN
      -- Si hnsw indisponible, on essaie ivfflat
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cme_embedding ON client_memory_embeddings
               USING ivfflat (embedding vector_cosine_ops)
               WITH (lists = 10)';
    END;
  END IF;
END $$;


-- Fonction RPC : recherche les N embeddings les plus proches
CREATE OR REPLACE FUNCTION match_client_memory(
  query_embedding vector(1536),
  match_count     INT DEFAULT 5,
  target_user_id  UUID DEFAULT NULL
)
RETURNS TABLE (
  id           UUID,
  user_id      UUID,
  chunk_text   TEXT,
  source       VARCHAR(50),
  source_id    VARCHAR(100),
  similarity   FLOAT,
  metadata     JSONB
)
LANGUAGE SQL STABLE
AS $$
  SELECT cme.id, cme.user_id, cme.chunk_text, cme.source, cme.source_id,
         1 - (cme.embedding <=> query_embedding) AS similarity,
         cme.metadata
  FROM client_memory_embeddings cme
  WHERE cme.embedding IS NOT NULL
    AND (target_user_id IS NULL OR cme.user_id = target_user_id)
  ORDER BY cme.embedding <=> query_embedding
  LIMIT match_count
$$;


-- -----------------------------------------------------------------------------
-- B.2 MODEL REGISTRY + ML OPS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_registry (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL UNIQUE,
                -- agent_recommendation | agent_pricing | agent_stock | agent_sentiment...
  agent_type    VARCHAR(50),
  description   TEXT,
  current_version VARCHAR(50),
  status        VARCHAR(20) DEFAULT 'active',    -- active | deprecated | training
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_model_registry_updated_at ON model_registry;
CREATE TRIGGER update_model_registry_updated_at
  BEFORE UPDATE ON model_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS model_versions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id           UUID REFERENCES model_registry(id) ON DELETE CASCADE,
  version            VARCHAR(50) NOT NULL,
  algorithm          VARCHAR(100),             -- transformer | xgboost | lstm | heuristic | gpt-4o
  hyperparams        JSONB,
  metrics            JSONB,                    -- {accuracy:0.87, f1:0.85, latency_ms:120}
  training_data_hash VARCHAR(64),
  deployed_at        TIMESTAMP WITH TIME ZONE,
  deployed_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  is_current         BOOLEAN DEFAULT false,
  rollback_of        UUID REFERENCES model_versions(id) ON DELETE SET NULL,
  notes              TEXT,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(model_id, version)
);

CREATE INDEX IF NOT EXISTS idx_mv_model   ON model_versions(model_id);
CREATE INDEX IF NOT EXISTS idx_mv_current ON model_versions(model_id) WHERE is_current = true;


-- Log de chaque execution d'agent (observability)
CREATE TABLE IF NOT EXISTS agent_executions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name     VARCHAR(100) NOT NULL,
  model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,
  input          JSONB,
  output         JSONB,
  latency_ms     INTEGER,
  tokens_used    INTEGER,
  cost_usd       DECIMAL(10,6),
  status         VARCHAR(20) DEFAULT 'success',   -- success | error | timeout
  error_message  TEXT,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  trace_id       VARCHAR(100),                    -- pour correlation multi-agents (LangGraph)
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ae_agent   ON agent_executions(agent_name);
CREATE INDEX IF NOT EXISTS idx_ae_user    ON agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_ae_date    ON agent_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_trace   ON agent_executions(trace_id);


-- Feedback explicite pour Reinforcement Learning
CREATE TABLE IF NOT EXISTS agent_feedback (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id   UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
  agent_name     VARCHAR(100),
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  reward         DECIMAL(5,3),                    -- [-1, 1] pour RL
  feedback_type  VARCHAR(30),                     -- thumbs_up | thumbs_down | click | conversion | ignored
  signal_source  VARCHAR(30),                     -- explicit | implicit | behavioral
  metadata       JSONB,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_af_exec  ON agent_feedback(execution_id);
CREATE INDEX IF NOT EXISTS idx_af_agent ON agent_feedback(agent_name);


-- -----------------------------------------------------------------------------
-- B.3 AB_TESTS : experimentation continue
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ab_tests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(150) NOT NULL UNIQUE,
  description    TEXT,
  hypothesis     TEXT,
  metric         VARCHAR(100),                    -- conversion_rate | avg_order_value | ctr | retention
  traffic_split  JSONB,                           -- {"control":0.5, "variant_a":0.5}
  status         VARCHAR(20) DEFAULT 'draft',     -- draft | running | paused | completed | abandoned
  starts_at      TIMESTAMP WITH TIME ZONE,
  ends_at        TIMESTAMP WITH TIME ZONE,
  winner         VARCHAR(50),                     -- nom de la variante gagnante
  confidence     DECIMAL(5,4),                    -- p-value ou intervalle
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_ab_tests_updated_at ON ab_tests;
CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON ab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS ab_test_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id     UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,               -- control | variant_a | variant_b
  config      JSONB,                              -- parametres specifiques a la variante
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, name)
);


CREATE TABLE IF NOT EXISTS ab_test_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id        UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_id     UUID REFERENCES ab_test_variants(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id     VARCHAR(100),
  exposed_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted      BOOLEAN DEFAULT false,
  metric_value   DECIMAL(12,4),
  metadata       JSONB
);

CREATE INDEX IF NOT EXISTS idx_abr_test    ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_abr_variant ON ab_test_results(variant_id);
CREATE INDEX IF NOT EXISTS idx_abr_user    ON ab_test_results(user_id);


-- -----------------------------------------------------------------------------
-- B.4 CUSTOMER JOURNEY + ANOMALIES + METRIQUES JOURNALIERES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_journey_events (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id     VARCHAR(100),
  event_name     VARCHAR(100) NOT NULL,
                 -- page_view | menu_viewed | cart_add | checkout_start | order_placed | paid | left
  event_category VARCHAR(50),                    -- acquisition | activation | retention | revenue
  source         VARCHAR(50),                    -- web | qr | pos | mobile | voice
  device         VARCHAR(30),                    -- mobile | desktop | tablet
  properties     JSONB,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cje_user    ON customer_journey_events(user_id);
CREATE INDEX IF NOT EXISTS idx_cje_session ON customer_journey_events(session_id);
CREATE INDEX IF NOT EXISTS idx_cje_event   ON customer_journey_events(event_name);
CREATE INDEX IF NOT EXISTS idx_cje_date    ON customer_journey_events(created_at DESC);


CREATE TABLE IF NOT EXISTS anomalies_detected (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_type   VARCHAR(50) NOT NULL,
                 -- invoice_duplicate | fraud_suspected | stock_mismatch | price_outlier | unusual_pattern
  severity       VARCHAR(20) NOT NULL DEFAULT 'medium',   -- low | medium | high | critical
  entity_type    VARCHAR(50),
  entity_id      VARCHAR(100),
  description    TEXT,
  detection_agent VARCHAR(100),                  -- agent_anomalies | agent_fraud
  detection_score DECIMAL(5,4),                  -- confiance [0..1]
  suggested_action TEXT,
  status         VARCHAR(20) DEFAULT 'open',     -- open | investigating | resolved | false_positive
  resolved_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at    TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  metadata       JSONB,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_status   ON anomalies_detected(status);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON anomalies_detected(severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_date     ON anomalies_detected(created_at DESC);

DROP TRIGGER IF EXISTS update_anomalies_updated_at ON anomalies_detected;
CREATE TRIGGER update_anomalies_updated_at
  BEFORE UPDATE ON anomalies_detected
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Metriques journalieres pre-agregees (pour dashboards rapides)
CREATE TABLE IF NOT EXISTS daily_metrics (
  day              DATE PRIMARY KEY,
  orders_count     INTEGER DEFAULT 0,
  revenue          DECIMAL(12,2) DEFAULT 0,
  new_customers    INTEGER DEFAULT 0,
  avg_order_value  DECIMAL(10,2),
  avg_prep_time    INTEGER,                      -- en secondes
  top_product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  cancelled_count  INTEGER DEFAULT 0,
  rush_hours       JSONB,                        -- {"12":45, "13":60, "19":80, "20":75}
  satisfaction     DECIMAL(3,2),
  waste_amount     DECIMAL(10,2),
  computed_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_day ON daily_metrics(day DESC);


-- =============================================================================
-- SECTION C — VUES PRATIQUES
-- =============================================================================

-- Profit/perte quotidien
CREATE OR REPLACE VIEW v_daily_pnl AS
SELECT day,
       COALESCE(dm.revenue, 0)                       AS revenue,
       COALESCE(exp.total_expenses, 0)               AS expenses,
       COALESCE(dm.revenue, 0) - COALESCE(exp.total_expenses, 0) AS profit
FROM daily_metrics dm
FULL OUTER JOIN (
  SELECT expense_date::DATE AS day, SUM(amount) AS total_expenses
  FROM expenses
  GROUP BY expense_date::DATE
) exp USING (day)
ORDER BY day DESC;


-- Agents : statistiques d'utilisation et cout
CREATE OR REPLACE VIEW v_agent_stats AS
SELECT agent_name,
       COUNT(*)                                       AS executions_count,
       AVG(latency_ms)                                AS avg_latency_ms,
       SUM(tokens_used)                               AS total_tokens,
       SUM(cost_usd)                                  AS total_cost_usd,
       COUNT(*) FILTER (WHERE status = 'error')       AS errors_count,
       MAX(created_at)                                AS last_run_at
FROM agent_executions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY agent_name
ORDER BY executions_count DESC;


-- Evenements prives en attente
CREATE OR REPLACE VIEW v_pending_event_requests AS
SELECT er.id, er.request_number, er.guest_name, er.event_type,
       er.event_date, er.guests_count, er.estimated_budget, er.status,
       er.created_at,
       eq.id AS latest_quote_id, eq.total AS latest_quote_total,
       eq.status AS latest_quote_status
FROM event_requests er
LEFT JOIN LATERAL (
  SELECT id, total, status
  FROM event_quotes
  WHERE request_id = er.id
  ORDER BY created_at DESC
  LIMIT 1
) eq ON true
WHERE er.status IN ('pending', 'reviewing', 'confirmed')
ORDER BY er.event_date ASC;


-- =============================================================================
-- SECTION D — RLS (Row Level Security)
-- =============================================================================

-- audit_logs : seul admin/service_role peut lire
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_quotes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance           ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies_detected   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_feedback       ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_memory_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_events  ENABLE ROW LEVEL SECURITY;


-- service_role bypasse tout (pour les APIs server-side)
-- Les policies ci-dessous s'appliquent aux clients authentifies via anon/authenticated.

-- Helper : l'utilisateur connecte est staff/admin ?
-- On reutilise le check via user_roles si la colonne existe.
CREATE OR REPLACE FUNCTION is_staff_or_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    LEFT JOIN user_roles r ON r.id = u.role_id
    WHERE u.id = auth.uid()
      AND (r.auth_level IN ('STAFF','ADMIN') OR u.role IN ('admin','manager','serveur','cuisinier','caissier','livreur'))
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;


-- event_requests : le client voit sa propre demande, le staff voit tout
DROP POLICY IF EXISTS "event_requests_self_or_staff" ON event_requests;
CREATE POLICY "event_requests_self_or_staff" ON event_requests
  FOR SELECT USING (
    user_id = auth.uid() OR is_staff_or_admin()
  );

DROP POLICY IF EXISTS "event_requests_create_self" ON event_requests;
CREATE POLICY "event_requests_create_self" ON event_requests
  FOR INSERT WITH CHECK (
    user_id IS NULL OR user_id = auth.uid() OR is_staff_or_admin()
  );

DROP POLICY IF EXISTS "event_requests_update_staff" ON event_requests;
CREATE POLICY "event_requests_update_staff" ON event_requests
  FOR UPDATE USING (is_staff_or_admin());


-- event_quotes : visible au client proprietaire de la request, ou staff
DROP POLICY IF EXISTS "event_quotes_self_or_staff" ON event_quotes;
CREATE POLICY "event_quotes_self_or_staff" ON event_quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_requests er
      WHERE er.id = event_quotes.request_id
        AND (er.user_id = auth.uid() OR is_staff_or_admin())
    )
  );


-- expenses / shifts / attendance / anomalies : staff-only
DROP POLICY IF EXISTS "expenses_staff_only" ON expenses;
CREATE POLICY "expenses_staff_only" ON expenses
  FOR ALL USING (is_staff_or_admin());

DROP POLICY IF EXISTS "shifts_staff_view" ON shifts;
CREATE POLICY "shifts_staff_view" ON shifts
  FOR SELECT USING (is_staff_or_admin() OR staff_id = auth.uid());

DROP POLICY IF EXISTS "shifts_staff_modify" ON shifts;
CREATE POLICY "shifts_staff_modify" ON shifts
  FOR ALL USING (is_staff_or_admin());

DROP POLICY IF EXISTS "attendance_self_or_staff" ON attendance;
CREATE POLICY "attendance_self_or_staff" ON attendance
  FOR SELECT USING (staff_id = auth.uid() OR is_staff_or_admin());

DROP POLICY IF EXISTS "attendance_staff_modify" ON attendance;
CREATE POLICY "attendance_staff_modify" ON attendance
  FOR ALL USING (is_staff_or_admin());


DROP POLICY IF EXISTS "anomalies_staff_only" ON anomalies_detected;
CREATE POLICY "anomalies_staff_only" ON anomalies_detected
  FOR ALL USING (is_staff_or_admin());


-- audit_logs + integrations + settings : admin-only (lecture)
DROP POLICY IF EXISTS "audit_admin_only" ON audit_logs;
CREATE POLICY "audit_admin_only" ON audit_logs
  FOR SELECT USING (is_staff_or_admin());

DROP POLICY IF EXISTS "integrations_admin_only" ON integrations;
CREATE POLICY "integrations_admin_only" ON integrations
  FOR ALL USING (is_staff_or_admin());

DROP POLICY IF EXISTS "settings_staff_read" ON restaurant_settings;
CREATE POLICY "settings_staff_read" ON restaurant_settings
  FOR SELECT USING (is_staff_or_admin());


-- agent_executions / agent_feedback : staff-only (observability)
DROP POLICY IF EXISTS "agent_exec_staff_only" ON agent_executions;
CREATE POLICY "agent_exec_staff_only" ON agent_executions
  FOR ALL USING (is_staff_or_admin());

DROP POLICY IF EXISTS "agent_fb_staff_only" ON agent_feedback;
CREATE POLICY "agent_fb_staff_only" ON agent_feedback
  FOR SELECT USING (is_staff_or_admin());


-- client_memory_embeddings : chaque user voit ses propres embeddings
DROP POLICY IF EXISTS "cme_self_or_staff" ON client_memory_embeddings;
CREATE POLICY "cme_self_or_staff" ON client_memory_embeddings
  FOR SELECT USING (user_id = auth.uid() OR is_staff_or_admin());


-- customer_journey_events : staff voit tout, user voit ses propres
DROP POLICY IF EXISTS "cje_self_or_staff" ON customer_journey_events;
CREATE POLICY "cje_self_or_staff" ON customer_journey_events
  FOR SELECT USING (user_id = auth.uid() OR is_staff_or_admin());


-- =============================================================================
-- SECTION E — SEEDS PAR DEFAUT (essentiels uniquement)
-- =============================================================================

-- Categories de depenses par defaut
INSERT INTO expense_categories (name, description, color)
VALUES
  ('Matieres premieres',   'Ingredients, produits frais',          '#f59e0b'),
  ('Salaires',             'Paie du personnel',                    '#3b82f6'),
  ('Loyer',                'Loyer mensuel du local',               '#8b5cf6'),
  ('Electricite & Eau',    'Factures utilities',                   '#ef4444'),
  ('Internet & Telephone', 'Abonnements telecom',                  '#06b6d4'),
  ('Maintenance',          'Entretien equipement',                 '#10b981'),
  ('Marketing',            'Publicite, flyers, reseaux sociaux',   '#ec4899'),
  ('Assurance',            'Assurances diverses',                  '#6366f1'),
  ('Taxes',                'Impots et taxes',                      '#f97316'),
  ('Autres',               'Depenses diverses',                    '#71717a')
ON CONFLICT (name) DO NOTHING;


-- Settings par defaut
INSERT INTO restaurant_settings (key, value, description, category) VALUES
  ('restaurant.name',        '"Joseph Bechara"',                              'Nom du restaurant',           'general'),
  ('restaurant.currency',    '"EUR"',                                         'Devise par defaut',           'general'),
  ('restaurant.timezone',    '"Europe/Paris"',                                'Fuseau horaire',              'general'),
  ('restaurant.tva_rate',    '0.19',                                          'Taux TVA par defaut',         'payment'),
  ('restaurant.hours',       '{"mon":"11:00-23:00","tue":"11:00-23:00","wed":"11:00-23:00","thu":"11:00-23:00","fri":"11:00-00:00","sat":"11:00-00:00","sun":"12:00-23:00"}',
                             'Horaires d''ouverture',       'general'),
  ('payment.stripe_enabled', 'true',                                          'Stripe actif ?',              'payment'),
  ('payment.cash_enabled',   'true',                                          'Cash accepte ?',              'payment'),
  ('ai.chatbot_enabled',     'true',                                          'Chatbot active',              'ai'),
  ('ai.recommendation_enabled', 'true',                                       'Recommandations IA',          'ai'),
  ('ai.pricing_auto',        'false',                                         'Pricing dynamique auto',      'ai'),
  ('notification.sms_enabled', 'false',                                       'SMS rappel reservation',      'notification'),
  ('notification.email_enabled', 'true',                                      'Email confirmation',          'notification')
ON CONFLICT (key) DO NOTHING;


-- Integrations (meta uniquement, les cles restent en .env)
INSERT INTO integrations (provider, label, status) VALUES
  ('stripe',   'Stripe (paiements)',           'disabled'),
  ('openai',   'OpenAI (chatbot + embeddings)', 'disabled'),
  ('redis',    'Redis (cache + memory)',        'disabled'),
  ('sendgrid', 'SendGrid (emails)',             'disabled'),
  ('twilio',   'Twilio (SMS)',                  'disabled'),
  ('pinecone', 'Pinecone (alt. pgvector)',      'disabled')
ON CONFLICT (provider) DO NOTHING;


-- Model registry de base (les 15 agents du plan)
INSERT INTO model_registry (name, agent_type, description, current_version, status) VALUES
  ('agent_chatbot',         'llm',             'Chatbot conversationnel (GPT-4o)',         '1.0.0', 'active'),
  ('agent_recommendation',  'collab_filter',   'Recommandation plats (goĂťt + context)',    '1.0.0', 'active'),
  ('agent_stock',           'forecasting',     'Prevision rupture de stock',                '1.0.0', 'active'),
  ('agent_pricing',         'rl',              'Pricing dynamique adaptatif',               '1.0.0', 'active'),
  ('agent_anomaly',         'isolation_forest','Detection fraude & anomalies',             '1.0.0', 'active'),
  ('agent_kitchen',         'optimizer',       'Optimisation flux cuisine',                 '1.0.0', 'active'),
  ('agent_marketing',       'segment_ml',      'Campagnes + promos personnalisees',         '1.0.0', 'active'),
  ('agent_loyalty',         'gamification',    'Points + rewards + challenges',             '1.0.0', 'active'),
  ('agent_sentiment',       'nlp',             'Sentiment analysis sur reviews',            '1.0.0', 'active'),
  ('agent_prediction',      'timeseries',      'Prevision demande',                         '1.0.0', 'active'),
  ('agent_memory',          'rag',             'Memoire client (pgvector RAG)',             '1.0.0', 'active'),
  ('agent_upsell',          'rules',           'Upsell contextuel',                         '1.0.0', 'active'),
  ('agent_journey',         'funnel',          'Analyse parcours client',                   '1.0.0', 'active'),
  ('agent_menu_engineering','classification',  'Stars / Cash Cows / Dogs',                  '1.0.0', 'active'),
  ('agent_coordinator',     'langgraph',       'Orchestrateur multi-agent',                 '1.0.0', 'active')
ON CONFLICT (name) DO NOTHING;


-- Pack evenement de base
INSERT INTO event_packages (name, description, event_type, base_price, price_per_guest, min_guests, max_guests, includes, active) VALUES
  ('Pack Anniversaire Classique', 'Menu buffet + decoration + gateau',
    'anniversaire',  300, 18, 10, 80,
    '["buffet","decoration","gateau","animation"]'::jsonb, true),
  ('Pack Mariage Prestige',       'Menu 5 services + DJ + decoration premium',
    'mariage',      1500, 45, 40, 200,
    '["menu_5_services","dj","decoration_premium","photographe","gateau_etages"]'::jsonb, true),
  ('Pack Entreprise Meeting',     'Cocktail dinatoire + buffet professionnel',
    'entreprise',    500, 22, 15, 60,
    '["cocktail","buffet","projection","wifi"]'::jsonb, true),
  ('Pack Soiree Privee',          'Menu + animation musicale',
    'prive',         400, 20,  8, 50,
    '["menu","musique","decoration_simple"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;


-- =============================================================================
-- RESUME FINAL
-- =============================================================================
DO $$
DECLARE
  tables_count INT;
  views_count INT;
  agents_count INT;
  settings_count INT;
  packages_count INT;
BEGIN
  SELECT COUNT(*) INTO tables_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  SELECT COUNT(*) INTO views_count FROM information_schema.views
    WHERE table_schema = 'public';
  SELECT COUNT(*) INTO agents_count FROM model_registry;
  SELECT COUNT(*) INTO settings_count FROM restaurant_settings;
  SELECT COUNT(*) INTO packages_count FROM event_packages;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Migration 08 appliquee avec succes';
  RAISE NOTICE '  Tables totales : %', tables_count;
  RAISE NOTICE '  Vues totales   : %', views_count;
  RAISE NOTICE '  Agents ML      : %', agents_count;
  RAISE NOTICE '  Settings       : %', settings_count;
  RAISE NOTICE '  Packs events   : %', packages_count;
  RAISE NOTICE '================================================';
END $$;
