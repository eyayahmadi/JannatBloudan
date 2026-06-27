-- =============================================================================
-- 46 — Burgers : descriptions (DE/AR), tags, recommandations
-- Idempotent — 5 produits catégorie burgers. Prix / noms / station inchangés.
-- =============================================================================

BEGIN;

UPDATE products SET
  description = 'Saftiger Rindfleisch-Burger mit Salat, Tomaten, Zwiebeln und Gewürzgurken im weichen Burgerbrötchen.',
  description_ar = 'برغر كلاسيكي بلحم بقري طازج مع الخس والطماطم والبصل والمخلل داخل خبز البرغر الطري.',
  tags = '["halal","popular","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'klassik-burger';

UPDATE products SET
  description = 'Rindfleisch-Burger mit Cheddar-Käse, Salat, Tomaten, Zwiebeln und Gewürzgurken.',
  description_ar = 'برغر لحم بقري مع جبنة شيدر والخس والطماطم والبصل والمخلل.',
  tags = '["halal","popular","contains_milk","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'cheeseburger';

UPDATE products SET
  description = 'Saftiger Cheeseburger mit Jalapeños und würziger Sauce für alle, die es scharf mögen.',
  description_ar = 'برغر لحم مع جبنة شيدر وفلفل هالبينو وصوص حار لعشاق النكهة الحارة.',
  tags = '["halal","spicy","popular","contains_milk","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'spicy-cheeseburger';

UPDATE products SET
  description = 'Doppelter Rindfleisch-Burger mit Ei, Cheddar, Röstzwiebeln und Jalapeños – die Spezialität des Hauses.',
  description_ar = 'برغر بلودان المميز مع قطعتين من اللحم والبيض وجبنة الشيدر والبصل المقرمش والهالبينو.',
  tags = '["halal","best_seller","chef_recommendation","contains_milk","contains_gluten","contains_eggs"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'bloudan-burger';

UPDATE products SET
  description = 'Knuspriges Hähnchenfilet mit Salat, Tomaten, Zwiebeln und BBQ-Sauce.',
  description_ar = 'برغر دجاج كرسبي مقرمش مع الخس والطماطم والبصل وصوص الباربكيو.',
  tags = '["halal","popular","kids_friendly","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'crispy-chicken-burger';

-- Recommandations
DO $$
DECLARE
  pid UUID;
  rid UUID;
  rec_slugs TEXT[];
  rec_slug TEXT;
  ord INT;
BEGIN
  rec_slugs := ARRAY['pommes-teller', 'coca-cola', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'klassik-burger';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'sprite', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'cheeseburger';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'coca-cola', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'spicy-cheeseburger';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'coca-cola', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'bloudan-burger';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'sprite', 'eis-vanille'];
  SELECT id INTO pid FROM products WHERE slug = 'crispy-chicken-burger';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
