-- =============================================================================
-- Migration 30 — Achats à prévoir (purchase recommendations)
-- =============================================================================
-- Objectif :
--   Détecter automatiquement les ingrédients / produits à racheter et exposer
--   une vue + des actions (valider, assigner, ignorer, marquer acheté) côté
--   ADMIN, ainsi qu'une vue « Achats urgents » côté CAISSE.
--
-- Architecture :
--   1) Étendre `reorder_requests` :
--        - urgency        : LOW | MEDIUM | HIGH | CRITICAL
--        - reason_code    : low_stock | zero_stock | predicted_rupture |
--                           high_consumption | event_demand | manual | other
--        - reason_detail  : texte libre / contexte
--        - product_id     : pour les produits finis (boissons, packs charbon…)
--        - assigned_to    : employé responsable de l'achat
--        - event_id       : si lié à un événement / réservation
--        - deadline       : date butoir (ex. avant l'événement)
--        - ignored_at / ignored_by / ignore_reason
--        - bought_at / bought_by / receipt_url / actual_cost
--        - expense_id, cash_movement_id, stock_movement_id
--        - validated_at / validated_by
--   2) Ajouter `purchase_recommendation_log` (audit fin)
--   3) Ajouter `purchase_notification_seen` (déduplication notifications jour)
--   4) Vue `v_purchase_recommendations` (jointures ingrédients/produits/event)
--   5) Vue `v_urgent_purchases` (filtre HIGH+CRITICAL non clôturées)
--   6) Fonction `generate_purchase_recommendations(p_window_days)` : règles
--      simples (low_stock, zero_stock, predicted_rupture).
--   7) Trigger : au passage status='received' → on crée stock_movement IN si
--      manquant, on marque les colonnes bought_*.
--
-- Toutes les opérations sont idempotentes.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Extension de la table reorder_requests
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS reorder_requests
  ADD COLUMN IF NOT EXISTS urgency           VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
    CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  ADD COLUMN IF NOT EXISTS reason_code       VARCHAR(40) NOT NULL DEFAULT 'low_stock',
  ADD COLUMN IF NOT EXISTS reason_detail     TEXT,
  ADD COLUMN IF NOT EXISTS product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to       UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_id          UUID REFERENCES event_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deadline          DATE,
  ADD COLUMN IF NOT EXISTS validated_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ignored_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ignored_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ignore_reason     TEXT,
  ADD COLUMN IF NOT EXISTS bought_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bought_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actual_cost       DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS receipt_url       TEXT,
  ADD COLUMN IF NOT EXISTS expense_id        UUID REFERENCES expenses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cash_movement_id  UUID,
  ADD COLUMN IF NOT EXISTS stock_movement_id UUID REFERENCES stock_movements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit              VARCHAR(20),
  ADD COLUMN IF NOT EXISTS current_stock     DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS threshold_low     DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS dedup_key         VARCHAR(120);

-- Statut élargi : pending | validated | assigned | ordered | received | ignored | cancelled
ALTER TABLE IF EXISTS reorder_requests
  DROP CONSTRAINT IF EXISTS reorder_requests_status_check;
ALTER TABLE IF EXISTS reorder_requests
  ADD CONSTRAINT reorder_requests_status_check
  CHECK (status IN ('pending','validated','assigned','ordered','received','ignored','cancelled'));

-- Lien optionnel vers cash_register_movements (introduit en 13)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='cash_register_movements') THEN
    BEGIN
      ALTER TABLE reorder_requests
        ADD CONSTRAINT reorder_requests_cash_movement_fk
        FOREIGN KEY (cash_movement_id) REFERENCES cash_register_movements(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_reorder_urgency      ON reorder_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_reorder_status_urg   ON reorder_requests(status, urgency);
CREATE INDEX IF NOT EXISTS idx_reorder_assigned     ON reorder_requests(assigned_to)        WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reorder_event        ON reorder_requests(event_id)           WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reorder_deadline     ON reorder_requests(deadline)           WHERE deadline IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_reorder_dedup_open
  ON reorder_requests(dedup_key)
  WHERE dedup_key IS NOT NULL AND status IN ('pending','validated','assigned','ordered');

COMMENT ON COLUMN reorder_requests.urgency IS
  'Niveau d''urgence calculé (LOW < MEDIUM < HIGH < CRITICAL).';
COMMENT ON COLUMN reorder_requests.reason_code IS
  'Code raison: low_stock | zero_stock | predicted_rupture | high_consumption | event_demand | manual | other.';
COMMENT ON COLUMN reorder_requests.dedup_key IS
  'Clé unique de déduplication (ex. ingredient:<id>:low_stock) pour éviter les doublons sur les recommandations actives.';

-- ---------------------------------------------------------------------------
-- 2. Audit fin des recommandations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_recommendation_log (
  id              BIGSERIAL PRIMARY KEY,
  recommendation_id UUID REFERENCES reorder_requests(id) ON DELETE CASCADE,
  action          VARCHAR(40) NOT NULL,
                   -- generated | validated | assigned | ignored | bought |
                   -- received | cancelled | manual_create | edited
  actor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  payload         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prl_reco ON purchase_recommendation_log(recommendation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prl_action_date ON purchase_recommendation_log(action, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Notifications anti-spam (groupage jour)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_notification_seen (
  id            BIGSERIAL PRIMARY KEY,
  business_date DATE NOT NULL,
  audience_role VARCHAR(20) NOT NULL,        -- ADMIN | CASHIER
  digest_key    VARCHAR(120) NOT NULL,       -- ex: purchases-CRITICAL:2026-05-08
  recos_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_at       TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pns_day_role_digest
  ON purchase_notification_seen(business_date, audience_role, digest_key);

COMMENT ON TABLE purchase_notification_seen IS
  'Limite le nombre de notifications « achats à prévoir » par jour et par rôle. Les recommandations restantes sont visibles dans la page admin / panneau caisse.';

-- ---------------------------------------------------------------------------
-- 4. Vue v_purchase_recommendations (lecture API admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_purchase_recommendations AS
SELECT
  r.id,
  r.urgency,
  r.status,
  r.reason_code,
  r.reason_detail,
  r.suggested_qty,
  r.unit,
  r.estimated_cost,
  r.actual_cost,
  r.current_stock,
  r.threshold_low,
  r.deadline,
  r.expected_at,
  r.notes,
  r.supplier_name,
  r.generated_by,
  r.assigned_to,
  r.validated_at,
  r.validated_by,
  r.ignored_at,
  r.ignored_by,
  r.ignore_reason,
  r.bought_at,
  r.bought_by,
  r.receipt_url,
  r.expense_id,
  r.cash_movement_id,
  r.stock_movement_id,
  r.event_id,
  r.dedup_key,
  r.created_at,
  r.updated_at,
  -- ingrédient / produit
  r.ingredient_id,
  i.name        AS ingredient_name,
  COALESCE(r.unit, i.unit)               AS effective_unit,
  COALESCE(r.current_stock, i.stock_quantity) AS effective_current_stock,
  COALESCE(r.threshold_low, i.threshold_low)  AS effective_threshold_low,
  i.threshold_critical,
  i.cost_per_unit,
  COALESCE(i.supplier_name, r.supplier_name)  AS effective_supplier,
  r.product_id,
  p.name        AS product_name,
  -- événement
  ev.event_date AS event_date,
  ev.event_time AS event_time,
  ev.guest_name AS event_label,
  ev.event_type AS event_type,
  CASE
    WHEN r.urgency = 'CRITICAL' THEN 4
    WHEN r.urgency = 'HIGH'     THEN 3
    WHEN r.urgency = 'MEDIUM'   THEN 2
    ELSE 1
  END AS urgency_rank,
  CASE r.status
    WHEN 'pending'   THEN 1
    WHEN 'validated' THEN 2
    WHEN 'assigned'  THEN 3
    WHEN 'ordered'   THEN 4
    WHEN 'received'  THEN 5
    WHEN 'ignored'   THEN 6
    WHEN 'cancelled' THEN 7
    ELSE 99
  END AS status_rank,
  CASE
    WHEN r.status IN ('received','ignored','cancelled') THEN FALSE
    ELSE TRUE
  END AS is_open
FROM reorder_requests r
LEFT JOIN ingredients     i  ON i.id  = r.ingredient_id
LEFT JOIN products        p  ON p.id  = r.product_id
LEFT JOIN event_requests  ev ON ev.id = r.event_id;

COMMENT ON VIEW v_purchase_recommendations IS
  'Vue enrichie utilisée par /api/admin/purchases/recommendations (joins ingrédients/produits/événements + ranks tri).';

-- ---------------------------------------------------------------------------
-- 5. Vue v_urgent_purchases (panneau caisse)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_urgent_purchases AS
SELECT *
FROM v_purchase_recommendations
WHERE is_open = TRUE
  AND urgency IN ('HIGH', 'CRITICAL');

COMMENT ON VIEW v_urgent_purchases IS
  'Restreinte aux recos ouvertes HIGH/CRITICAL — affichée côté CAISSE (« Achats urgents »).';

-- ---------------------------------------------------------------------------
-- 6. Fonction de génération automatique
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_purchase_recommendations(
  p_window_days INTEGER DEFAULT 7
) RETURNS TABLE (created_count INTEGER) AS $$
DECLARE
  v_count   INTEGER := 0;
  rec       RECORD;
  v_urgency TEXT;
  v_reason  TEXT;
  v_qty     NUMERIC;
  v_dedup   TEXT;
  v_avg     NUMERIC;
  v_days_left NUMERIC;
BEGIN
  -- Boucle sur les ingrédients en alerte
  FOR rec IN
    SELECT
      i.id,
      i.name,
      i.unit,
      i.stock_quantity,
      i.threshold_low,
      i.threshold_critical,
      i.cost_per_unit,
      i.supplier_name,
      COALESCE((
        SELECT SUM(ABS(sm.quantity)) / GREATEST(p_window_days, 1)
        FROM stock_movements sm
        WHERE sm.ingredient_id = i.id
          AND sm.movement_type IN ('out','loss')
          AND sm.created_at >= NOW() - (p_window_days || ' days')::INTERVAL
      ), 0) AS avg_daily_usage
    FROM ingredients i
    WHERE COALESCE(i.threshold_low, 0) > 0
       OR i.stock_quantity = 0
  LOOP
    v_avg := COALESCE(rec.avg_daily_usage, 0);
    v_days_left := CASE WHEN v_avg > 0 THEN rec.stock_quantity / v_avg ELSE NULL END;

    IF rec.stock_quantity = 0 THEN
      v_urgency := 'CRITICAL';
      v_reason  := 'zero_stock';
    ELSIF rec.threshold_critical IS NOT NULL
          AND rec.threshold_critical > 0
          AND rec.stock_quantity <= rec.threshold_critical THEN
      v_urgency := 'CRITICAL';
      v_reason  := 'low_stock';
    ELSIF rec.threshold_low IS NOT NULL
          AND rec.threshold_low > 0
          AND rec.stock_quantity <= rec.threshold_low THEN
      v_urgency := 'HIGH';
      v_reason  := 'low_stock';
    ELSIF v_days_left IS NOT NULL AND v_days_left <= 3 THEN
      v_urgency := 'MEDIUM';
      v_reason  := 'predicted_rupture';
    ELSE
      CONTINUE;
    END IF;

    -- Quantité recommandée : viser ~ 2× threshold_low ou couvrir 7 jours de conso
    v_qty := GREATEST(
      COALESCE(rec.threshold_low, 0) * 2 - rec.stock_quantity,
      v_avg * 7,
      1
    );
    v_qty := ROUND(v_qty::NUMERIC, 3);

    v_dedup := 'ingredient:' || rec.id::TEXT || ':' || v_reason;

    INSERT INTO reorder_requests (
      ingredient_id, suggested_qty, estimated_cost, status,
      generated_by, supplier_name, urgency, reason_code, reason_detail,
      unit, current_stock, threshold_low, dedup_key
    )
    VALUES (
      rec.id,
      v_qty,
      ROUND((v_qty * COALESCE(rec.cost_per_unit, 0))::NUMERIC, 2),
      'pending',
      'auto',
      rec.supplier_name,
      v_urgency,
      v_reason,
      CASE
        WHEN v_reason = 'zero_stock'        THEN 'Stock à 0 — rachat immédiat'
        WHEN v_reason = 'predicted_rupture' THEN
             'Conso moy. ' || ROUND(v_avg::NUMERIC, 2) || ' / j → ~' ||
             COALESCE(ROUND(v_days_left::NUMERIC, 1)::TEXT, '?') || ' j restants'
        ELSE 'Stock ' || rec.stock_quantity || ' ≤ seuil ' || rec.threshold_low
      END,
      rec.unit,
      rec.stock_quantity,
      rec.threshold_low,
      v_dedup
    )
    ON CONFLICT (dedup_key)
    WHERE dedup_key IS NOT NULL AND status IN ('pending','validated','assigned','ordered')
    DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    -- v_count vaut 0 si la reco existait déjà (pas de doublon)
    IF v_count > 0 THEN
      INSERT INTO purchase_recommendation_log (recommendation_id, action, payload)
      SELECT id, 'generated', jsonb_build_object(
          'reason_code', v_reason,
          'urgency', v_urgency,
          'avg_daily_usage', v_avg,
          'days_left', v_days_left
        )
      FROM reorder_requests
      WHERE dedup_key = v_dedup AND status IN ('pending','validated','assigned','ordered')
      ORDER BY created_at DESC LIMIT 1;
    END IF;
  END LOOP;

  -- Nombre total de recos OUVERTES après exécution (utile pour la notif jour)
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM reorder_requests
  WHERE status IN ('pending','validated','assigned','ordered')
    AND generated_by = 'auto';

  created_count := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_purchase_recommendations IS
  'Détecte les ingrédients à racheter (stock=0, ≤seuil_critique, ≤seuil_bas, prédit rupture) et insère des reorder_requests dédupliqués.';

-- ---------------------------------------------------------------------------
-- 7. Trigger pour propager status='received' → stock + bought_*
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reorder_requests_apply_received()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE'
      AND NEW.status = 'received'
      AND OLD.status <> 'received'
      AND NEW.bought_at IS NULL) THEN
    NEW.bought_at := NOW();
  END IF;

  IF (TG_OP = 'UPDATE'
      AND NEW.status = 'ignored'
      AND OLD.status <> 'ignored'
      AND NEW.ignored_at IS NULL) THEN
    NEW.ignored_at := NOW();
  END IF;

  IF (TG_OP = 'UPDATE'
      AND NEW.status = 'validated'
      AND OLD.status <> 'validated'
      AND NEW.validated_at IS NULL) THEN
    NEW.validated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reorder_requests_apply_received ON reorder_requests;
CREATE TRIGGER trg_reorder_requests_apply_received
  BEFORE UPDATE ON reorder_requests
  FOR EACH ROW
  EXECUTE FUNCTION reorder_requests_apply_received();

COMMIT;
