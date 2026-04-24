-- =============================================================================
-- Migration 07 — Demo Seed (optionnel)
-- -----------------------------------------------------------------------------
-- Peuple les tables commercial-ready avec des donnees de demonstration :
--   * ingredients (stock de base + 2 en alerte pour v_low_stock)
--   * promotions actives (Happy Hour + Bienvenue)
--   * loyalty_rewards (recompenses par defaut)
--   * product_ingredients (liens de base)
-- Idempotente.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. INGREDIENTS DE DEMO (15 ingredients, dont Poulet + Tahini en alerte)
-- -----------------------------------------------------------------------------
INSERT INTO ingredients (name, unit, stock_quantity, threshold_low, threshold_critical, cost_per_unit, supplier_name)
VALUES
  ('Viande hachee',        'kg',   25.0, 10.0,  5.0,  8.50, 'Boucherie El Baraka'),
  ('Poulet',               'kg',    3.0, 10.0,  5.0,  6.00, 'Volailler du marche'),
  ('Tomates',              'kg',   18.0, 10.0,  5.0,  2.50, 'Primeurs El Baraka'),
  ('Oignons',              'kg',   22.0, 10.0,  5.0,  1.20, 'Primeurs El Baraka'),
  ('Pain Saj',             'unite', 8.0, 15.0,  5.0,  0.80, 'Boulangerie Dar Jawhar'),
  ('Tahini',               'L',     5.0, 10.0,  3.0,  6.50, 'Epicerie orientale'),
  ('Huile olive',          'L',    12.0,  6.0,  3.0,  9.00, 'Olivette & Co'),
  ('Fromage',              'kg',    7.0,  4.0,  2.0, 12.00, 'Fromagerie du Sud'),
  ('Pate pizza',           'kg',   14.0,  6.0,  3.0,  3.00, 'Boulangerie Dar Jawhar'),
  ('Cafe grain',           'kg',    6.0,  4.0,  2.0, 20.00, 'Brulerie Medina'),
  ('The menthe',           'kg',    2.5,  2.0,  1.0, 15.00, 'Brulerie Medina'),
  ('Sucre',                'kg',   18.0, 10.0,  5.0,  1.00, 'Epicerie centrale'),
  ('Citron',               'kg',    9.0,  5.0,  2.0,  2.20, 'Primeurs El Baraka'),
  ('Jus orange',           'L',    14.0,  8.0,  4.0,  2.80, 'Boissons Medina'),
  ('Eau plate',            'L',    40.0, 20.0, 10.0,  0.50, 'Boissons Medina')
ON CONFLICT (name) DO UPDATE
  SET unit           = EXCLUDED.unit,
      cost_per_unit  = EXCLUDED.cost_per_unit,
      supplier_name  = EXCLUDED.supplier_name,
      updated_at     = NOW();


-- -----------------------------------------------------------------------------
-- 2. PROMOTIONS ACTIVES
-- -----------------------------------------------------------------------------
INSERT INTO promotions (title, description, promo_type, value, min_order, starts_at, ends_at, active, generated_by)
SELECT 'Happy Hour -20%',    'Remise de 20% entre 14h et 17h', 'percent', 20, 0,  NOW(), NOW() + INTERVAL '90 days',  TRUE, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM promotions WHERE title = 'Happy Hour -20%');

INSERT INTO promotions (title, description, promo_type, value, min_order, starts_at, ends_at, active, generated_by)
SELECT 'Bienvenue -10%',     'Premiere commande -10%',         'percent', 10, 15, NOW(), NOW() + INTERVAL '180 days', TRUE, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM promotions WHERE title = 'Bienvenue -10%');

INSERT INTO promotions (title, description, promo_type, value, min_order, starts_at, ends_at, active, generated_by)
SELECT 'Famille -5 EUR',     'A partir de 40 EUR de commande', 'amount',   5, 40, NOW(), NOW() + INTERVAL '60 days',  TRUE, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM promotions WHERE title = 'Famille -5 EUR');


-- -----------------------------------------------------------------------------
-- 3. LOYALTY REWARDS (Agent Loyalty)
-- -----------------------------------------------------------------------------
INSERT INTO loyalty_rewards (name, description, points_cost, reward_type, reward_value, active)
SELECT 'Boisson offerte',     'Une boisson gratuite',           100,  'free_item',  0,   TRUE
WHERE NOT EXISTS (SELECT 1 FROM loyalty_rewards WHERE name = 'Boisson offerte');

INSERT INTO loyalty_rewards (name, description, points_cost, reward_type, reward_value, active)
SELECT 'Dessert offert',      'Un dessert gratuit',             200,  'free_item',  0,   TRUE
WHERE NOT EXISTS (SELECT 1 FROM loyalty_rewards WHERE name = 'Dessert offert');

INSERT INTO loyalty_rewards (name, description, points_cost, reward_type, reward_value, active)
SELECT 'Remise 10%',          'Remise de 10% sur la commande',  300,  'discount',  10,   TRUE
WHERE NOT EXISTS (SELECT 1 FROM loyalty_rewards WHERE name = 'Remise 10%');

INSERT INTO loyalty_rewards (name, description, points_cost, reward_type, reward_value, active)
SELECT 'Menu gratuit',        'Menu completement offert',      1000,  'free_item', 25,   TRUE
WHERE NOT EXISTS (SELECT 1 FROM loyalty_rewards WHERE name = 'Menu gratuit');


-- -----------------------------------------------------------------------------
-- 4. LIEN INGREDIENTS <-> PRODUITS (exemple basique, best-effort)
-- -----------------------------------------------------------------------------
INSERT INTO product_ingredients (product_id, ingredient_id, quantity)
SELECT p.id, i.id, 0.200
FROM products p
CROSS JOIN ingredients i
WHERE i.name = 'Poulet'
  AND (p.name ILIKE '%poulet%' OR p.name ILIKE '%chicken%' OR p.name ILIKE '%shawarma%')
ON CONFLICT (product_id, ingredient_id) DO NOTHING;

INSERT INTO product_ingredients (product_id, ingredient_id, quantity)
SELECT p.id, i.id, 1.0
FROM products p
CROSS JOIN ingredients i
WHERE i.name = 'Pain Saj'
  AND (p.name ILIKE '%shawarma%' OR p.name ILIKE '%wrap%' OR p.name ILIKE '%saj%')
ON CONFLICT (product_id, ingredient_id) DO NOTHING;

INSERT INTO product_ingredients (product_id, ingredient_id, quantity)
SELECT p.id, i.id, 0.300
FROM products p
CROSS JOIN ingredients i
WHERE i.name = 'Pate pizza'
  AND p.name ILIKE '%pizza%'
ON CONFLICT (product_id, ingredient_id) DO NOTHING;

INSERT INTO product_ingredients (product_id, ingredient_id, quantity)
SELECT p.id, i.id, 0.050
FROM products p
CROSS JOIN ingredients i
WHERE i.name = 'Huile olive'
  AND (p.name ILIKE '%pizza%' OR p.name ILIKE '%salade%' OR p.name ILIKE '%mezze%')
ON CONFLICT (product_id, ingredient_id) DO NOTHING;


-- -----------------------------------------------------------------------------
-- 5. NOTIFICATION (optionnel, pour verifier)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  ing_count    INT;
  promo_count  INT;
  reward_count INT;
  link_count   INT;
BEGIN
  SELECT COUNT(*) INTO ing_count    FROM ingredients;
  SELECT COUNT(*) INTO promo_count  FROM promotions WHERE active = TRUE;
  SELECT COUNT(*) INTO reward_count FROM loyalty_rewards WHERE active = TRUE;
  SELECT COUNT(*) INTO link_count   FROM product_ingredients;

  RAISE NOTICE 'Seed 07: % ingredients, % promos actives, % recompenses fidelite, % liens produit-ingredient',
    ing_count, promo_count, reward_count, link_count;
END $$;
