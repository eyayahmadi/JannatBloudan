-- =============================================================================
-- 42 — Plats : descriptions (DE/AR), tags, recommandations
-- Idempotent — 9 produits catégorie plats. Prix / noms / station inchangés.
-- Ayran / Tiramisu absents du catalogue → slugs ignorés si introuvables.
-- =============================================================================

BEGIN;

UPDATE products SET
  description = 'Knuspriges Crispy Chicken serviert mit Pommes frites, frischem Salat und hausgemachter Sauce.',
  description_ar = 'قطع دجاج كرسبي مقرمشة تقدم مع البطاطا المقلية والسلطة الطازجة وصوص خاص.',
  tags = '["halal","popular","kids_friendly"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'crispy-chicken-teller';

UPDATE products SET
  description = 'Knuspriges Zinger-Hähnchen mit Pommes, frischem Salat und würziger Sauce.',
  description_ar = 'وجبة زنجر مقرمشة مع البطاطا المقلية والسلطة الطازجة وصوص مميز.',
  tags = '["halal","popular","spicy"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'crispy-zinger-teller';

UPDATE products SET
  description = 'Gegrillte Hähnchenstreifen mit Paprika, Zwiebeln, Pommes und frischem Salat.',
  description_ar = 'قطع دجاج مشوية مع الفليفلة والبصل تقدم مع البطاطا المقلية والسلطة.',
  tags = '["halal","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'fajita-teller';

UPDATE products SET
  description = 'Gegrilltes Hähnchen mit Mais, Pommes, Salat und mexikanischer Sauce.',
  description_ar = 'دجاج مشوي مع الذرة والبطاطا المقلية والسلطة وصوص مكسيكي.',
  tags = '["halal","spicy","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'mexicano-teller';

UPDATE products SET
  description = 'Falafel mit gegrilltem Halloumi, Hummus, Salat und Pommes.',
  description_ar = 'فلافل مع جبنة حلوم مشوية وحمص وسلطة وبطاطا مقلية.',
  tags = '["vegetarian","halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'falafel-halloumi-teller';

UPDATE products SET
  description = 'Gegrillter Halloumi mit frischem Salat, Pommes und hausgemachter Sauce.',
  description_ar = 'جبنة حلوم مشوية تقدم مع السلطة والبطاطا المقلية وصوص خاص.',
  tags = '["vegetarian","halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'halloumi-teller';

UPDATE products SET
  description = 'Traditionelle Falafel mit Hummus, Salat und knusprigen Pommes.',
  description_ar = 'فلافل عربية تقدم مع الحمص والسلطة والبطاطا المقلية.',
  tags = '["vegetarian","vegan","halal"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'arabischer-falafel-teller';

UPDATE products SET
  description = 'Knuspriges Crispy Chicken auf goldenen Pommes mit hausgemachter Sauce.',
  description_ar = 'قطع دجاج كرسبي فوق البطاطا المقلية مع صوص خاص.',
  tags = '["halal","popular","kids_friendly"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'chicken-fries';

UPDATE products SET
  description = 'Knusprig frittierter Fisch mit Pommes, frischem Salat und hausgemachter Sauce.',
  description_ar = 'سمكة مقلية مقرمشة تقدم مع البطاطا المقلية والسلطة الطازجة وصوص خاص.',
  tags = '["halal","contains_fish","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'frittierter-fisch-teller';

-- Recommandations
DO $$
DECLARE
  pid UUID;
  rid UUID;
  rec_slugs TEXT[];
  rec_slug TEXT;
  ord INT;
BEGIN
  rec_slugs := ARRAY['coca-cola', 'pommes-teller', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'crispy-chicken-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['sprite', 'pommes-teller', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'crispy-zinger-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'fattoush', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'fajita-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'pommes-teller', 'tiramisu'];
  SELECT id INTO pid FROM products WHERE slug = 'mexicano-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'hummus', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'falafel-halloumi-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['tabbouleh', 'mineralwasser', 'pancake-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'halloumi-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'baba-ghanoug', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'arabischer-falafel-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['sprite', 'coca-cola', 'eis-vanille'];
  SELECT id INTO pid FROM products WHERE slug = 'chicken-fries';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['mineralwasser', 'salat', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'frittierter-fisch-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
