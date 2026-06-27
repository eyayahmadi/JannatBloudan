-- =============================================================================
-- 47 — Sandwiches : descriptions (DE/AR), tags, recommandations
-- Idempotent — 9 produits catégorie sandwiches. Prix / noms / station inchangés.
-- Ayran absent du catalogue → slugs ignorés si introuvables.
-- =============================================================================

BEGIN;

UPDATE products SET
  description = 'Knuspriges Crispy Chicken mit Eisbergsalat, Krautsalat, Tomaten und hausgemachter Sauce.',
  description_ar = 'ساندويش دجاج كرسبي مقرمش مع الخس وسلطة الملفوف والطماطم وصوص خاص.',
  tags = '["halal","popular","kids_friendly","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'crispy-chicken-sandwich';

UPDATE products SET
  description = 'Scharfes Crispy Chicken mit Salat, Krautsalat, Tomaten und würziger Sauce.',
  description_ar = 'ساندويش زنجر حار مع الخس وسلطة الملفوف والطماطم والصوص الحار.',
  tags = '["halal","spicy","popular","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'zinger-sandwich';

UPDATE products SET
  description = 'Gegrillte Hähnchenstücke mit orientalischen Gewürzen, Salat und hausgemachter Sauce.',
  description_ar = 'قطع دجاج مشوية متبلة مع الخس والطماطم والصوص الخاص.',
  tags = '["halal","popular","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'fajita-sandwich';

UPDATE products SET
  description = 'Gegrilltes Hähnchen mit Mais, Salat, Tomaten und würziger Sauce.',
  description_ar = 'ساندويش مكسيكانو بالدجاج المشوي والذرة والخس والطماطم وصوص مميز.',
  tags = '["halal","spicy","popular","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'mexicano-sandwich';

UPDATE products SET
  description = 'Frisch gebackenes Brot mit Falafel, Hummus, Salat, Tomaten und Tahini-Sauce.',
  description_ar = 'ساندويش فلافل مع الحمص والخس والطماطم وصوص الطحينة.',
  tags = '["vegetarian","vegan","halal","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'falafel-sandwich';

UPDATE products SET
  description = 'Gegrillte Lammstücke über Holzkohle mit Salat und hausgemachter Sauce.',
  description_ar = 'ساندويش شقف لحم غنم مشوي على الفحم مع السلطة والصوص الخاص.',
  tags = '["halal","popular","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'schaschlik-sandwich';

UPDATE products SET
  description = 'Orientalischer Kebab vom Holzkohlegrill mit Salat, Tomaten und hausgemachter Sauce.',
  description_ar = 'ساندويش كباب مشوي على الفحم مع السلطة والطماطم والصوص الخاص.',
  tags = '["halal","popular","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'kebab-sandwich';

UPDATE products SET
  description = 'Saftige gegrillte Lammstücke mit Salat, Tomaten und orientalischer Sauce.',
  description_ar = 'ساندويش شقف لحم غنم مشوي مع السلطة والطماطم والصوص الشرقي.',
  tags = '["halal","chef_recommendation","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'lammfleisch-sandwich';

UPDATE products SET
  description = 'Gegrillte Lammleber mit orientalischen Gewürzen, Salat und hausgemachter Sauce.',
  description_ar = 'ساندويش كبدة غنم مشوية مع السلطة والصوص الخاص.',
  tags = '["halal","chef_recommendation","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'lammleber-sandwich';

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
  SELECT id INTO pid FROM products WHERE slug = 'crispy-chicken-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'sprite', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'zinger-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fattoush', 'coca-cola', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'fajita-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'sprite', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'mexicano-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['tabbouleh', 'ayran', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'falafel-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'coca-cola', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'schaschlik-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'sprite', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'kebab-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fattoush', 'coca-cola', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'lammfleisch-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['tabbouleh', 'mineralwasser', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'lammleber-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
