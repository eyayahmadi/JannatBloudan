-- =============================================================================
-- 45 — Pizza : descriptions (DE/AR), tags, recommandations
-- Idempotent — 10 produits catégorie pizza. Prix / noms / station inchangés.
-- =============================================================================

BEGIN;

UPDATE products SET
  description = 'Klassische Pizza mit Tomatensauce, Mozzarella und Oregano. Einfach, frisch und authentisch.',
  description_ar = 'بيتزا كلاسيكية بصلصة الطماطم والموزاريلا والأوريغانو، بطعم إيطالي أصيل.',
  tags = '["vegetarian","halal","popular","contains_milk","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'pizza-margherita';

UPDATE products SET
  description = 'Pizza mit Mortadella, Oliven, Champignons, Paprika und Mozzarella.',
  description_ar = 'بيتزا بالفصول الأربعة مع المرتديلا والزيتون والفطر والفليفلة والموزاريلا.',
  tags = '["halal","popular","contains_milk","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'pizza-quattro-stagioni';

UPDATE products SET
  description = 'Pizza mit Hähnchenstreifen, Champignons, Käse und cremiger Hollandaise-Sauce.',
  description_ar = 'بيتزا مع شرائح الدجاج والفطر والجبنة وصوص الهولنديز الكريمي.',
  tags = '["halal","popular","contains_milk","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'pizza-hollandaise';

UPDATE products SET
  description = 'Herzhafte Pizza mit Sucuk, Spiegelei und geschmolzenem Käse.',
  description_ar = 'بيتزا بالسجق والبيض والجبنة الذائبة.',
  tags = '["halal","popular","contains_milk","contains_eggs","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'pizza-sucuk-ei';

UPDATE products SET
  description = 'Pizza mit frischer Mozzarella, Tomaten und Basilikum.',
  description_ar = 'بيتزا بالموزاريلا الطازجة والطماطم والريحان.',
  tags = '["vegetarian","halal","contains_milk","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'pizza-mozzarella-tomaten';

UPDATE products SET
  description = 'Vegetarische Pizza mit Gemüse, Champignons, Mais, Paprika, Oliven und Käse.',
  description_ar = 'بيتزا نباتية بالخضار الطازجة والفطر والذرة والزيتون والجبنة.',
  tags = '["vegetarian","halal","contains_milk","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'pizza-vegetarisch';

UPDATE products SET
  description = 'Pizza mit Putenmortadella, Tomatensauce und Mozzarella.',
  description_ar = 'بيتزا بمرتديلا الديك الرومي والموزاريلا وصلصة الطماطم.',
  tags = '["halal","popular","contains_milk","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'pizza-putenmortadella';

UPDATE products SET
  description = 'Würzige Pizza mit Hähnchen, Jalapeños, Mais, Paprika und Käse.',
  description_ar = 'بيتزا مكسيكية بالدجاج والهالبينو والذرة والفليفلة والجبنة.',
  tags = '["halal","spicy","popular","contains_milk","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'pizza-mexikano';

UPDATE products SET
  description = 'Pizza mit Salami, Mozzarella und Tomatensauce.',
  description_ar = 'بيتزا سلامي مع الموزاريلا وصلصة الطماطم.',
  tags = '["halal","popular","contains_milk","contains_gluten"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'pizza-salami';

UPDATE products SET
  description = 'Pizza mit Thunfisch, Mozzarella und Tomatensauce.',
  description_ar = 'بيتزا بالتونا والموزاريلا وصلصة الطماطم.',
  tags = '["halal","contains_fish","contains_milk","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'pizza-tonno';

-- Recommandations
DO $$
DECLARE
  pid UUID;
  rid UUID;
  rec_slugs TEXT[];
  rec_slug TEXT;
  ord INT;
BEGIN
  rec_slugs := ARRAY['coca-cola', 'salat', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'pizza-margherita';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fattoush', 'sprite', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'pizza-quattro-stagioni';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'pommes-teller', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'pizza-hollandaise';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['sprite', 'salat', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'pizza-sucuk-ei';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['salat', 'mineralwasser', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'pizza-mozzarella-tomaten';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['tabbouleh', 'mineralwasser', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'pizza-vegetarisch';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['sprite', 'pommes-teller', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'pizza-putenmortadella';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'pommes-teller', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'pizza-mexikano';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['sprite', 'salat', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'pizza-salami';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['mineralwasser', 'salat', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'pizza-tonno';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
