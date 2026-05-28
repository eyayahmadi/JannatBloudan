-- =============================================================================
-- Migration 31 — Client credit ("kridi") + Station revenue breakdown
-- -----------------------------------------------------------------------------
-- 1) Extend `invoices` with a richer payment_state (UNPAID | PARTIALLY_PAID |
--    CREDIT | PAID | OVERDUE) PLUS credit metadata (due date, reason, note,
--    recorded by, paid so far, remaining).
-- 2) Create `client_credit_payments` to log every payment recorded against a
--    credit invoice AFTER the initial encaissement (recovery payments).
-- 3) Create `client_credit_reminders` to log dunning / reminders.
-- 4) Create `client_credit_limits` to optionally cap credit per client.
-- 5) Snapshot `station` on `invoice_items` (so revenue stays accurate even
--    when a product changes station later) + trigger that auto-fills it from
--    the product.
-- 6) Views :
--      * v_client_credit_summary — per-client totals (debt, paid, last
--        payment, overdue flag)
--      * v_station_daily_revenue — revenue per day per station (KITCHEN, BAR,
--        SHISHA), excluding cancelled / waste / refunded / hospitality.
--      * v_daily_revenue_breakdown — full daily breakdown : totals, by
--        station, by payment method, by external platform, plus unpaid
--        credit & cancellations.
--
-- Idempotent. To be applied after migrations 06, 10, 14, 28.
-- =============================================================================

BEGIN;


-- -----------------------------------------------------------------------------
-- 1) invoices : credit metadata + payment_state
-- -----------------------------------------------------------------------------
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_state       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS credit_due_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS credit_paid         DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_remaining    DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_reason       VARCHAR(60),
  ADD COLUMN IF NOT EXISTS credit_note         TEXT,
  ADD COLUMN IF NOT EXISTS credit_recorded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS credit_recorded_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS credit_settled_at   TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'invoices_payment_state_check'
      AND table_name = 'invoices'
  ) THEN
    ALTER TABLE invoices
      ADD CONSTRAINT invoices_payment_state_check
      CHECK (payment_state IS NULL OR payment_state IN (
        'PAID', 'UNPAID', 'PARTIALLY_PAID', 'CREDIT', 'OVERDUE'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_payment_state  ON invoices(payment_state)
  WHERE payment_state IS NOT NULL AND payment_state <> 'PAID';
CREATE INDEX IF NOT EXISTS idx_invoices_credit_due     ON invoices(credit_due_at)
  WHERE credit_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_credit_client  ON invoices(customer_id, payment_state)
  WHERE customer_id IS NOT NULL AND payment_state IS NOT NULL AND payment_state <> 'PAID';

COMMENT ON COLUMN invoices.payment_state IS
  'Vue côté caisse : PAID / UNPAID / PARTIALLY_PAID / CREDIT / OVERDUE. Différent de invoices.status (workflow facture).';
COMMENT ON COLUMN invoices.credit_due_at IS
  'Date d''échéance attendue pour le règlement crédit (kridi). Sert à calculer OVERDUE.';
COMMENT ON COLUMN invoices.credit_remaining IS
  'Reste à payer sur facture crédit. Mis à jour à chaque encaissement.';


-- -----------------------------------------------------------------------------
-- 2) client_credit_payments : journal des règlements ultérieurs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_credit_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      VARCHAR(40) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  amount          DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  method          VARCHAR(30) NOT NULL
    CHECK (method IN ('cash', 'card', 'online', 'bank_transfer', 'wallet', 'other')),
  payment_id      UUID REFERENCES payments(id) ON DELETE SET NULL,
  note            TEXT,
  recorded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccp_invoice  ON client_credit_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ccp_client   ON client_credit_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_ccp_date     ON client_credit_payments(recorded_at DESC);

COMMENT ON TABLE client_credit_payments IS
  'Historique des règlements de dette client (kridi). Distinct de `payments` qui est le journal global.';


-- -----------------------------------------------------------------------------
-- 3) client_credit_reminders : journal des rappels
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_credit_reminders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   VARCHAR(40) REFERENCES invoices(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  channel      VARCHAR(20) NOT NULL DEFAULT 'manual'
    CHECK (channel IN ('manual', 'email', 'sms', 'whatsapp', 'phone')),
  message      TEXT,
  sent_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success      BOOLEAN DEFAULT true,
  error        TEXT
);

CREATE INDEX IF NOT EXISTS idx_ccr_invoice ON client_credit_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ccr_client  ON client_credit_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_ccr_date    ON client_credit_reminders(sent_at DESC);


-- -----------------------------------------------------------------------------
-- 4) client_credit_limits : plafond optionnel par client
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_credit_limits (
  client_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  credit_limit   DECIMAL(10,2) NOT NULL DEFAULT 0,
  blocked        BOOLEAN NOT NULL DEFAULT false,
  reason         TEXT,
  updated_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE client_credit_limits IS
  'Plafond de crédit autorisé par client (kridi). `blocked` = interdiction explicite.';


-- -----------------------------------------------------------------------------
-- 5) invoice_items.station — snapshot pour les rapports stations
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'station_type') THEN
    ALTER TABLE invoice_items
      ADD COLUMN IF NOT EXISTS station station_type;
  ELSE
    ALTER TABLE invoice_items
      ADD COLUMN IF NOT EXISTS station VARCHAR(20);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoice_items_station
  ON invoice_items(station);

-- Backfill : remplit la station depuis products.station quand connu
UPDATE invoice_items ii
SET station = p.station
FROM products p
WHERE ii.station IS NULL
  AND ii.product_id = p.id
  AND p.station IS NOT NULL;

-- Trigger auto-dispatch sur invoice_items (en miroir de order_items)
CREATE OR REPLACE FUNCTION auto_dispatch_invoice_item_station()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.station IS NULL AND NEW.product_id IS NOT NULL THEN
    SELECT p.station INTO NEW.station
    FROM products p
    WHERE p.id = NEW.product_id;
  END IF;
  IF NEW.station IS NULL THEN
    NEW.station := 'KITCHEN';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_dispatch_invoice_item_station ON invoice_items;
CREATE TRIGGER trg_auto_dispatch_invoice_item_station
  BEFORE INSERT ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_dispatch_invoice_item_station();


-- -----------------------------------------------------------------------------
-- 6) Vues utilitaires
-- -----------------------------------------------------------------------------

-- 6.a — Vue récap par client : dette / payé / restant / dernier paiement
DROP VIEW IF EXISTS v_client_credit_summary CASCADE;
CREATE VIEW v_client_credit_summary AS
WITH inv AS (
  SELECT
    i.customer_id                                            AS client_id,
    i.id                                                     AS invoice_id,
    i.total                                                  AS total_ttc,
    COALESCE(i.credit_paid, 0)                               AS paid,
    COALESCE(i.credit_remaining, GREATEST(i.total - COALESCE(i.credit_paid, 0), 0)) AS remaining,
    i.credit_due_at,
    i.credit_settled_at,
    i.payment_state,
    i.status,
    i.created_at
  FROM invoices i
  WHERE i.customer_id IS NOT NULL
    AND i.payment_state IN ('UNPAID', 'PARTIALLY_PAID', 'CREDIT', 'OVERDUE')
), last_pay AS (
  SELECT
    invoice_id,
    MAX(recorded_at) AS last_payment_at
  FROM client_credit_payments
  GROUP BY invoice_id
)
SELECT
  c.client_id,
  u.email                                                    AS client_email,
  u.full_name                                                AS client_name,
  COUNT(DISTINCT c.invoice_id)                               AS open_invoices,
  COUNT(DISTINCT c.invoice_id) FILTER (
    WHERE c.credit_due_at IS NOT NULL AND c.credit_due_at < NOW()
  )                                                          AS overdue_invoices,
  COALESCE(SUM(c.total_ttc), 0)                              AS total_debt_origin,
  COALESCE(SUM(c.paid), 0)                                   AS total_paid,
  COALESCE(SUM(c.remaining), 0)                              AS total_remaining,
  MAX(lp.last_payment_at)                                    AS last_payment_at,
  MIN(c.credit_due_at) FILTER (
    WHERE c.credit_due_at IS NOT NULL AND c.credit_due_at >= NOW()
  )                                                          AS next_due_at,
  MIN(c.credit_due_at) FILTER (
    WHERE c.credit_due_at IS NOT NULL AND c.credit_due_at < NOW()
  )                                                          AS earliest_overdue_at,
  l.credit_limit,
  l.blocked
FROM inv c
LEFT JOIN last_pay lp           ON lp.invoice_id = c.invoice_id
LEFT JOIN users u               ON u.id = c.client_id
LEFT JOIN client_credit_limits l ON l.client_id = c.client_id
GROUP BY c.client_id, u.email, u.full_name, l.credit_limit, l.blocked;

COMMENT ON VIEW v_client_credit_summary IS
  'Récap dette client : total dû / payé / restant / dernière échéance / dépassement plafond.';


-- 6.b — Vue revenu journalier par station (kitchen / bar / shisha)
DROP VIEW IF EXISTS v_station_daily_revenue CASCADE;
CREATE VIEW v_station_daily_revenue AS
SELECT
  DATE(i.created_at)                                         AS day,
  ii.station                                                 AS station,
  COUNT(DISTINCT ii.id)                                      AS items_count,
  SUM(ii.quantity)                                           AS units_sold,
  ROUND(SUM(
    CASE
      WHEN COALESCE(ii.line_status, 'active') IN ('cancelled', 'waste', 'refused', 'replaced')
        THEN 0
      ELSE COALESCE(ii.subtotal, ii.unit_price * ii.quantity)
    END
  )::numeric, 2)                                             AS revenue_ht,
  ROUND(SUM(
    CASE
      WHEN COALESCE(ii.line_status, 'active') IN ('cancelled', 'waste')
        THEN COALESCE(ii.subtotal, ii.unit_price * ii.quantity)
      ELSE 0
    END
  )::numeric, 2)                                             AS cancelled_amount,
  COUNT(DISTINCT ii.id) FILTER (
    WHERE COALESCE(ii.line_status, 'active') = 'waste'
  )                                                          AS waste_count
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
WHERE i.status NOT IN ('cancelled', 'refunded', 'draft')
GROUP BY DATE(i.created_at), ii.station;

COMMENT ON VIEW v_station_daily_revenue IS
  'Chiffre d''affaires par station et par jour (lignes actives uniquement).';


-- 6.c — Top items vendus par jour / station
DROP VIEW IF EXISTS v_station_top_items CASCADE;
CREATE VIEW v_station_top_items AS
SELECT
  DATE(i.created_at)                                         AS day,
  ii.station                                                 AS station,
  ii.product_id,
  ii.product_name,
  SUM(ii.quantity)                                           AS units_sold,
  ROUND(SUM(
    CASE
      WHEN COALESCE(ii.line_status, 'active') IN ('cancelled', 'waste', 'refused', 'replaced')
        THEN 0
      ELSE COALESCE(ii.subtotal, ii.unit_price * ii.quantity)
    END
  )::numeric, 2)                                             AS revenue_ht,
  COUNT(DISTINCT ii.id) FILTER (
    WHERE COALESCE(ii.line_status, 'active') = 'refused'
  )                                                          AS refused_count
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
WHERE i.status NOT IN ('cancelled', 'refunded', 'draft')
GROUP BY DATE(i.created_at), ii.station, ii.product_id, ii.product_name;


-- -----------------------------------------------------------------------------
-- 7) RPC : recompute_invoice_credit_state(invoice_id)
--    À appeler après chaque MAJ paiement. Calcule credit_paid / credit_remaining
--    / payment_state. Marque OVERDUE si due_at dépassée.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recompute_invoice_credit_state(p_invoice_id VARCHAR(40))
RETURNS TABLE (
  invoice_id      VARCHAR(40),
  payment_state   VARCHAR(20),
  credit_paid     DECIMAL(10,2),
  credit_remaining DECIMAL(10,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total         DECIMAL(10,2);
  v_paid          DECIMAL(10,2);
  v_remaining     DECIMAL(10,2);
  v_due_at        TIMESTAMPTZ;
  v_state         VARCHAR(20);
  v_credit_marked BOOLEAN;
  v_status        VARCHAR(20);
BEGIN
  SELECT total, credit_due_at, status, credit_recorded_by IS NOT NULL
    INTO v_total, v_due_at, v_status, v_credit_marked
  FROM invoices
  WHERE id = p_invoice_id;

  IF v_total IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM payments
  WHERE invoice_id = p_invoice_id
    AND status = 'succeeded';

  v_paid := ROUND(COALESCE(v_paid, 0)::numeric, 2);
  v_remaining := GREATEST(ROUND((v_total - v_paid)::numeric, 2), 0);

  IF v_remaining <= 0.02 THEN
    v_state := 'PAID';
  ELSIF v_paid > 0.02 THEN
    v_state := CASE
      WHEN v_due_at IS NOT NULL AND v_due_at < NOW() THEN 'OVERDUE'
      WHEN v_credit_marked THEN 'CREDIT'
      ELSE 'PARTIALLY_PAID'
    END;
  ELSE
    v_state := CASE
      WHEN v_due_at IS NOT NULL AND v_due_at < NOW() THEN 'OVERDUE'
      WHEN v_credit_marked THEN 'CREDIT'
      ELSE 'UNPAID'
    END;
  END IF;

  UPDATE invoices
  SET credit_paid       = v_paid,
      credit_remaining  = v_remaining,
      payment_state     = v_state,
      credit_settled_at = CASE WHEN v_state = 'PAID' THEN NOW() ELSE credit_settled_at END,
      status            = CASE
        WHEN v_state = 'PAID' AND status NOT IN ('cancelled', 'refunded') THEN 'paid'
        ELSE status
      END,
      paid_at           = CASE
        WHEN v_state = 'PAID' AND paid_at IS NULL THEN NOW()
        ELSE paid_at
      END
  WHERE id = p_invoice_id;

  RETURN QUERY
    SELECT p_invoice_id, v_state, v_paid, v_remaining;
END;
$$;

COMMENT ON FUNCTION recompute_invoice_credit_state IS
  'Recalcule l''état crédit d''une facture (paid / partially_paid / credit / overdue / paid).';


-- -----------------------------------------------------------------------------
-- 8) Job de marquage OVERDUE — appel régulier (cron applicatif)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_overdue_credit_invoices()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE invoices
  SET payment_state = 'OVERDUE'
  WHERE credit_due_at IS NOT NULL
    AND credit_due_at < NOW()
    AND payment_state IN ('CREDIT', 'PARTIALLY_PAID', 'UNPAID');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION mark_overdue_credit_invoices IS
  'À appeler 1x/jour (cron) : passe en OVERDUE toutes les factures crédit échues.';


-- -----------------------------------------------------------------------------
-- 9) RLS — staff/admin only (les CLIENT n'écrivent pas dans le crédit)
-- -----------------------------------------------------------------------------
ALTER TABLE client_credit_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_credit_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_credit_limits    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccp_staff_only"  ON client_credit_payments;
CREATE POLICY "ccp_staff_only" ON client_credit_payments
  FOR ALL USING (is_staff_or_admin());

DROP POLICY IF EXISTS "ccr_staff_only"  ON client_credit_reminders;
CREATE POLICY "ccr_staff_only" ON client_credit_reminders
  FOR ALL USING (is_staff_or_admin());

DROP POLICY IF EXISTS "ccl_staff_only"  ON client_credit_limits;
CREATE POLICY "ccl_staff_only" ON client_credit_limits
  FOR ALL USING (is_staff_or_admin());


COMMIT;


-- =============================================================================
-- Récap
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Migration 31 appliquée : crédit client + revenus par station';
  RAISE NOTICE '  Tables    : client_credit_payments, client_credit_reminders, client_credit_limits';
  RAISE NOTICE '  Colonnes  : invoices.payment_state + credit_*';
  RAISE NOTICE '              invoice_items.station';
  RAISE NOTICE '  Vues      : v_client_credit_summary, v_station_daily_revenue, v_station_top_items';
  RAISE NOTICE '  Fonctions : recompute_invoice_credit_state(), mark_overdue_credit_invoices()';
  RAISE NOTICE '================================================';
END $$;
