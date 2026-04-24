-- =============================================================================
-- Migration 09 — Demo Data (30 jours)
-- -----------------------------------------------------------------------------
-- Remplit les tables de la migration 08 avec des donnees realistes
-- pour rendre les dashboards visuellement vivants en demo :
--
--   * daily_metrics     -> 30 jours de revenus (variation week-end, rush)
--   * expenses          -> ~60 depenses reparties (loyer, salaires, achats...)
--   * agent_executions  -> ~300 executions d'agents (chatbot, reco, pricing...)
--   * anomalies_detected-> 5 anomalies realistes
--   * customer_journey_events -> 200 evenements de parcours
--
-- Idempotente : on supprime d'abord les donnees "demo" (tag) puis on re-seed.
-- =============================================================================

-- Nettoyage doux : on ne touche qu'aux donnees tagees "demo" ou vides
DELETE FROM daily_metrics WHERE day >= CURRENT_DATE - INTERVAL '40 days';
DELETE FROM expenses WHERE notes LIKE '[demo]%';
DELETE FROM agent_executions WHERE trace_id LIKE 'demo-%';
DELETE FROM anomalies_detected WHERE metadata->>'seed' = 'demo';
DELETE FROM customer_journey_events WHERE (properties->>'seed') = 'demo';


-- -----------------------------------------------------------------------------
-- 1. DAILY METRICS — 30 jours de revenus
-- -----------------------------------------------------------------------------
-- Revenus plus eleves le week-end (ven/sam/dim), effet "rush" a 12h/19h
INSERT INTO daily_metrics (day, orders_count, revenue, new_customers, avg_order_value,
                           avg_prep_time, cancelled_count, rush_hours, satisfaction, waste_amount, computed_at)
SELECT
  d::DATE AS day,
  -- Commandes : base 40 + bonus week-end
  (40 + CASE EXTRACT(DOW FROM d) WHEN 5 THEN 30 WHEN 6 THEN 45 WHEN 0 THEN 35 ELSE 0 END
      + (RANDOM() * 15)::INT) AS orders_count,
  -- Revenu : base 1200 + bonus weekend + variation
  ROUND((1200 + CASE EXTRACT(DOW FROM d) WHEN 5 THEN 900 WHEN 6 THEN 1400 WHEN 0 THEN 1100 ELSE 0 END
       + RANDOM() * 400)::NUMERIC, 2) AS revenue,
  -- Nouveaux clients
  (5 + (RANDOM() * 8)::INT) AS new_customers,
  ROUND((28 + RANDOM() * 15)::NUMERIC, 2) AS avg_order_value,
  (600 + (RANDOM() * 400)::INT) AS avg_prep_time,   -- secondes
  (RANDOM() * 3)::INT AS cancelled_count,
  -- Heures de rush
  jsonb_build_object(
    '12', (35 + (RANDOM() * 25)::INT),
    '13', (45 + (RANDOM() * 30)::INT),
    '19', (50 + (RANDOM() * 30)::INT),
    '20', (65 + (RANDOM() * 35)::INT),
    '21', (55 + (RANDOM() * 25)::INT)
  ) AS rush_hours,
  ROUND((4.0 + RANDOM() * 0.8)::NUMERIC, 2) AS satisfaction,
  ROUND((30 + RANDOM() * 70)::NUMERIC, 2) AS waste_amount,
  NOW()
FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d
ON CONFLICT (day) DO UPDATE SET
  orders_count    = EXCLUDED.orders_count,
  revenue         = EXCLUDED.revenue,
  new_customers   = EXCLUDED.new_customers,
  avg_order_value = EXCLUDED.avg_order_value,
  rush_hours      = EXCLUDED.rush_hours,
  satisfaction    = EXCLUDED.satisfaction,
  waste_amount    = EXCLUDED.waste_amount,
  computed_at     = NOW();


-- -----------------------------------------------------------------------------
-- 2. EXPENSES — 30 jours de depenses realistes
-- -----------------------------------------------------------------------------
-- Categories fixes de debut de mois
DO $$
DECLARE
  cat_salaires  UUID;
  cat_loyer     UUID;
  cat_mp        UUID;
  cat_elec      UUID;
  cat_internet  UUID;
  cat_maint     UUID;
  cat_market    UUID;
  cat_autres    UUID;
BEGIN
  SELECT id INTO cat_salaires FROM expense_categories WHERE name = 'Salaires';
  SELECT id INTO cat_loyer    FROM expense_categories WHERE name = 'Loyer';
  SELECT id INTO cat_mp       FROM expense_categories WHERE name = 'Matieres premieres';
  SELECT id INTO cat_elec     FROM expense_categories WHERE name = 'Electricite & Eau';
  SELECT id INTO cat_internet FROM expense_categories WHERE name = 'Internet & Telephone';
  SELECT id INTO cat_maint    FROM expense_categories WHERE name = 'Maintenance';
  SELECT id INTO cat_market   FROM expense_categories WHERE name = 'Marketing';
  SELECT id INTO cat_autres   FROM expense_categories WHERE name = 'Autres';

  -- Loyer mensuel (1 entree)
  INSERT INTO expenses (category_id, label, amount, expense_date, payment_method, vendor, recurring, frequency, notes)
  VALUES (cat_loyer, 'Loyer du local', 3500, date_trunc('month', CURRENT_DATE)::DATE, 'bank_transfer',
          'Immobilier Medina', true, 'monthly', '[demo] Loyer mensuel');

  -- Salaires mensuels (5 entrees le 1er du mois)
  INSERT INTO expenses (category_id, label, amount, expense_date, payment_method, vendor, recurring, frequency, notes)
  VALUES
    (cat_salaires, 'Salaire Chef cuisinier',     2200, date_trunc('month', CURRENT_DATE)::DATE, 'bank_transfer', 'Karim (chef)',       true, 'monthly', '[demo] Salaire'),
    (cat_salaires, 'Salaire Serveur 1',          1400, date_trunc('month', CURRENT_DATE)::DATE, 'bank_transfer', 'Ahmed (serveur)',    true, 'monthly', '[demo] Salaire'),
    (cat_salaires, 'Salaire Serveur 2',          1400, date_trunc('month', CURRENT_DATE)::DATE, 'bank_transfer', 'Marie (serveuse)',   true, 'monthly', '[demo] Salaire'),
    (cat_salaires, 'Salaire Caissier',           1600, date_trunc('month', CURRENT_DATE)::DATE, 'bank_transfer', 'Sophie (caissiere)', true, 'monthly', '[demo] Salaire'),
    (cat_salaires, 'Salaire Commis cuisine',     1200, date_trunc('month', CURRENT_DATE)::DATE, 'bank_transfer', 'Youssef (commis)',   true, 'monthly', '[demo] Salaire');

  -- Factures energie & internet (mensuel)
  INSERT INTO expenses (category_id, label, amount, expense_date, payment_method, vendor, recurring, frequency, notes)
  VALUES
    (cat_elec,     'Electricite',     ROUND((380 + RANDOM()*80)::NUMERIC, 2), (date_trunc('month', CURRENT_DATE) + INTERVAL '5 days')::DATE, 'auto_debit', 'STEG',         true, 'monthly', '[demo] Electricite'),
    (cat_elec,     'Eau',             ROUND((95  + RANDOM()*25)::NUMERIC, 2), (date_trunc('month', CURRENT_DATE) + INTERVAL '5 days')::DATE, 'auto_debit', 'SONEDE',       true, 'monthly', '[demo] Eau'),
    (cat_internet, 'Internet+Tel',    65,  (date_trunc('month', CURRENT_DATE) + INTERVAL '3 days')::DATE, 'auto_debit', 'Topnet',        true, 'monthly', '[demo] Forfait'),
    (cat_maint,    'Menage/Entretien',220, (date_trunc('month', CURRENT_DATE) + INTERVAL '15 days')::DATE, 'cash',       'Service Propre',true, 'monthly', '[demo] Menage');

  -- Matieres premieres : ~25 entrees sur 30 jours
  INSERT INTO expenses (category_id, label, amount, expense_date, payment_method, vendor, notes)
  SELECT
    cat_mp,
    CASE (RANDOM() * 5)::INT
      WHEN 0 THEN 'Achat viande + poulet'
      WHEN 1 THEN 'Achat legumes frais'
      WHEN 2 THEN 'Achat fromage + produits laitiers'
      WHEN 3 THEN 'Achat epices + condiments'
      ELSE       'Achat boissons'
    END,
    ROUND((180 + RANDOM() * 320)::NUMERIC, 2),
    (CURRENT_DATE - ((RANDOM() * 30)::INT * INTERVAL '1 day'))::DATE,
    CASE WHEN RANDOM() > 0.5 THEN 'cash' ELSE 'card' END,
    CASE (RANDOM() * 3)::INT
      WHEN 0 THEN 'Boucherie El Baraka'
      WHEN 1 THEN 'Primeurs Medina'
      ELSE       'Grossiste Sfax'
    END,
    '[demo] Appro matieres premieres'
  FROM generate_series(1, 25);

  -- Marketing : 3-4 entrees
  INSERT INTO expenses (category_id, label, amount, expense_date, payment_method, vendor, notes)
  VALUES
    (cat_market, 'Publicite Facebook',       ROUND((50 + RANDOM()*50)::NUMERIC, 2), (CURRENT_DATE - INTERVAL '25 days')::DATE, 'card', 'Meta Ads',     '[demo] Campagne FB'),
    (cat_market, 'Pub Instagram',            ROUND((40 + RANDOM()*40)::NUMERIC, 2), (CURRENT_DATE - INTERVAL '15 days')::DATE, 'card', 'Meta Ads',     '[demo] Campagne IG'),
    (cat_market, 'Flyers impression',        120,                                   (CURRENT_DATE - INTERVAL '10 days')::DATE, 'cash', 'Imprimerie',   '[demo] Flyers'),
    (cat_market, 'Partenariat influenceur',  300,                                   (CURRENT_DATE -  INTERVAL '5 days')::DATE, 'bank_transfer', 'Influenceur local', '[demo] Collab');

  -- Autres : 3-4 entrees
  INSERT INTO expenses (category_id, label, amount, expense_date, payment_method, vendor, notes)
  VALUES
    (cat_autres, 'Serviettes en papier',     45, (CURRENT_DATE - INTERVAL '18 days')::DATE, 'cash', 'Hygiene+',    '[demo] Consommables'),
    (cat_autres, 'Reparation frigo',        180, (CURRENT_DATE - INTERVAL '12 days')::DATE, 'cash', 'Froid Service','[demo] Reparation'),
    (cat_autres, 'Fournitures bureau',       60, (CURRENT_DATE -  INTERVAL '7 days')::DATE, 'card', 'Papeterie',   '[demo] Bureau');
END $$;


-- -----------------------------------------------------------------------------
-- 3. AGENT EXECUTIONS — 300 executions reparties sur 30 jours
-- -----------------------------------------------------------------------------
INSERT INTO agent_executions (agent_name, input, output, latency_ms, tokens_used, cost_usd, status, trace_id, created_at)
SELECT
  CASE (RANDOM() * 10)::INT
    WHEN 0 THEN 'agent_chatbot'
    WHEN 1 THEN 'agent_recommendation'
    WHEN 2 THEN 'agent_stock'
    WHEN 3 THEN 'agent_pricing'
    WHEN 4 THEN 'agent_anomaly'
    WHEN 5 THEN 'agent_sentiment'
    WHEN 6 THEN 'agent_upsell'
    WHEN 7 THEN 'agent_memory'
    WHEN 8 THEN 'agent_marketing'
    ELSE       'agent_coordinator'
  END AS agent_name,
  jsonb_build_object('query', 'demo_input', 'context', 'table-' || (1 + (RANDOM()*20)::INT)) AS input,
  jsonb_build_object('result', 'demo_output', 'confidence', ROUND(RANDOM()::NUMERIC, 3)) AS output,
  (50 + (RANDOM() * 2000)::INT) AS latency_ms,
  (100 + (RANDOM() * 1500)::INT) AS tokens_used,
  ROUND((RANDOM() * 0.05)::NUMERIC, 6) AS cost_usd,
  CASE WHEN RANDOM() > 0.05 THEN 'success' ELSE 'error' END AS status,
  'demo-' || substr(md5(random()::text), 1, 12) AS trace_id,
  NOW() - ((RANDOM() * 30)::INT * INTERVAL '1 day')
       - ((RANDOM() * 24)::INT * INTERVAL '1 hour')
FROM generate_series(1, 300);


-- -----------------------------------------------------------------------------
-- 4. ANOMALIES DETECTED — 5 anomalies realistes
-- -----------------------------------------------------------------------------
INSERT INTO anomalies_detected (anomaly_type, severity, description, detection_agent, detection_score, suggested_action, status, metadata, created_at)
VALUES
  ('invoice_duplicate', 'high',     'Facture identique detectee a 2 minutes d''intervalle (meme montant, meme table)', 'agent_anomaly', 0.94, 'Verifier si erreur caisse ou double facturation', 'open',          '{"seed":"demo","table":5}'::jsonb, NOW() - INTERVAL '2 days'),
  ('stock_mismatch',    'medium',   'Stock Poulet : 3kg attendus vs 0.5kg reel (ecart -83%)',                           'agent_stock',   0.87, 'Inventaire physique + verifier pertes',            'investigating', '{"seed":"demo","ingredient":"poulet"}'::jsonb, NOW() - INTERVAL '4 days'),
  ('price_outlier',     'low',      'Prix d''un plat 2.3x superieur a la moyenne historique',                           'agent_pricing', 0.72, 'Revoir la grille tarifaire',                        'resolved',      '{"seed":"demo"}'::jsonb, NOW() - INTERVAL '7 days'),
  ('unusual_pattern',   'high',     'Pic de commandes anormal a 03h du matin (hors horaires)',                          'agent_anomaly', 0.88, 'Audit securite compte caisse',                      'open',          '{"seed":"demo"}'::jsonb, NOW() - INTERVAL '1 days'),
  ('fraud_suspected',   'critical', 'Meme carte bancaire utilisee 7 fois en 10 minutes avec nom different',             'agent_anomaly', 0.96, 'Bloquer transactions + alerter banque',             'investigating', '{"seed":"demo","card_hash":"xxx"}'::jsonb, NOW() - INTERVAL '12 hours');


-- -----------------------------------------------------------------------------
-- 5. CUSTOMER JOURNEY EVENTS — 200 events simulant un funnel
-- -----------------------------------------------------------------------------
INSERT INTO customer_journey_events (event_name, event_category, source, device, properties, created_at)
SELECT
  CASE (RANDOM() * 6)::INT
    WHEN 0 THEN 'page_view'
    WHEN 1 THEN 'menu_viewed'
    WHEN 2 THEN 'cart_add'
    WHEN 3 THEN 'checkout_start'
    WHEN 4 THEN 'order_placed'
    ELSE       'paid'
  END,
  CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'acquisition'
    WHEN 1 THEN 'activation'
    WHEN 2 THEN 'revenue'
    ELSE       'retention'
  END,
  CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'web'
    WHEN 1 THEN 'qr'
    WHEN 2 THEN 'pos'
    ELSE       'mobile'
  END,
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'mobile'
    WHEN 1 THEN 'desktop'
    ELSE       'tablet'
  END,
  jsonb_build_object('seed', 'demo', 'session', 'sess-' || (RANDOM()*1000)::INT),
  NOW() - ((RANDOM() * 30)::INT * INTERVAL '1 day')
       - ((RANDOM() * 86400)::INT * INTERVAL '1 second')
FROM generate_series(1, 200);


-- -----------------------------------------------------------------------------
-- RESUME
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_metrics   INT;
  v_expenses  INT;
  v_agents    INT;
  v_anomalies INT;
  v_events    INT;
BEGIN
  SELECT COUNT(*) INTO v_metrics   FROM daily_metrics WHERE day >= CURRENT_DATE - INTERVAL '31 days';
  SELECT COUNT(*) INTO v_expenses  FROM expenses      WHERE notes LIKE '[demo]%';
  SELECT COUNT(*) INTO v_agents    FROM agent_executions WHERE trace_id LIKE 'demo-%';
  SELECT COUNT(*) INTO v_anomalies FROM anomalies_detected WHERE metadata->>'seed' = 'demo';
  SELECT COUNT(*) INTO v_events    FROM customer_journey_events WHERE properties->>'seed' = 'demo';

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Seed 09 (demo data) applique :';
  RAISE NOTICE '  daily_metrics            : % lignes (30 jours)', v_metrics;
  RAISE NOTICE '  expenses                 : % lignes', v_expenses;
  RAISE NOTICE '  agent_executions         : % lignes', v_agents;
  RAISE NOTICE '  anomalies_detected       : % lignes', v_anomalies;
  RAISE NOTICE '  customer_journey_events  : % lignes', v_events;
  RAISE NOTICE '================================================';
END $$;
