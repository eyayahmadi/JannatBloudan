-- =============================================================================
-- 44 — Grillades : descriptions (DE/AR), tags, recommandations
-- Idempotent — 14 produits catégorie grillades. Prix / noms / station inchangés.
-- lamm-teller = Schaschlik (25 €) | schisch-tawouk-teller = Hähnchenstücke (18 €)
-- Ayran absent du catalogue → slugs ignorés si introuvables.
-- =============================================================================

BEGIN;

UPDATE products SET
  description = 'Gemischter Grillteller mit gegrillten Lammstücken, Kebab und Hähnchenstücken vom Holzkohlegrill. Serviert mit Salat, Muhammara, Hummus sowie Reis oder Pommes.',
  description_ar = 'وجبة مشاوي مشكلة تضم شقف لحم وكباب وقطع دجاج مشوية على الفحم، تقدم مع الحمص والمحمرة والسلطة والأرز أو البطاطا.',
  tags = '["halal","best_seller","chef_recommendation"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'gemischter-grillteller';

-- Schaschlik Teller (slug: lamm-teller, 25 €)
UPDATE products SET
  description = 'Zarte gegrillte Lammstücke über Holzkohle mit Salat, Hummus, Muhammara und Reis oder Pommes.',
  description_ar = 'قطع لحم غنم مشوية على الفحم تقدم مع الحمص والمحمرة والسلطة والأرز أو البطاطا.',
  tags = '["halal","best_seller"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'lamm-teller';

-- Hähnchenstücke Teller (slug: schisch-tawouk-teller, 18 €)
UPDATE products SET
  description = 'Saftige marinierte Hähnchenstücke vom Holzkohlegrill. Serviert mit Salat, Hummus, Muhammara sowie Reis oder Pommes.',
  description_ar = 'قطع دجاج متبلة ومشوية على الفحم تقدم مع الحمص والمحمرة والسلطة والأرز أو البطاطا.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'schisch-tawouk-teller';

UPDATE products SET
  description = 'Traditioneller gegrillter Kebab mit orientalischen Gewürzen. Serviert mit Hummus, Muhammara, Salat und Reis oder Pommes.',
  description_ar = 'كباب مشوي على الطريقة الشرقية يقدم مع الحمص والمحمرة والسلطة والأرز أو البطاطا.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'kebab-teller';

UPDATE products SET
  description = 'Gegrillte Lammleber über Holzkohle mit orientalischen Gewürzen. Serviert mit Salat und Reis oder Pommes.',
  description_ar = 'كبدة غنم مشوية على الفحم مع البهارات الشرقية، تقدم مع السلطة والأرز أو البطاطا.',
  tags = '["halal","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'leber-teller';

UPDATE products SET
  description = 'Halbes Hähnchen vom Holzkohlegrill mit Salat, Hummus, Muhammara und Reis oder Pommes.',
  description_ar = 'نصف فروج مشوي على الفحم يقدم مع الحمص والمحمرة والسلطة والأرز أو البطاطا.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'halbes-grillhaehnchen';

UPDATE products SET
  description = 'Gegrillter Kebab mit gerösteten Auberginen, Hummus, Muhammara und Salat.',
  description_ar = 'كباب مشوي مع باذنجان مشوي يقدم مع الحمص والمحمرة والسلطة.',
  tags = '["halal","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'auberginen-kebab';

UPDATE products SET
  description = 'Knuspriges Lahmacun mit Hackfleisch und geschmolzenem Käse vom Holzkohlegrill.',
  description_ar = 'خبز مارية باللحم المفروم والجبنة الذائبة مشوي على الفحم.',
  tags = '["halal","contains_milk","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'lahmacun-mit-kaese';

UPDATE products SET
  description = 'Ein Kilogramm gemischter Grill mit Lammstücken, Kebab und Hähnchenstücken.',
  description_ar = 'كيلو مشاوي مشكلة يضم شقف لحم وكباب وقطع دجاج مشوية.',
  tags = '["halal","best_seller"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'gemischter-grill-1kg';

UPDATE products SET
  description = 'Ein Kilogramm traditioneller gegrillter Kebab.',
  description_ar = 'كيلو كباب مشوي على الفحم.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'kebab-1kg';

UPDATE products SET
  description = 'Ein Kilogramm marinierte Hähnchenstücke vom Holzkohlegrill.',
  description_ar = 'كيلو شيش طاووق متبل ومشوي على الفحم.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'schisch-tawouk-1kg';

UPDATE products SET
  description = 'Ein Kilogramm knusprige gegrillte Hähnchenflügel.',
  description_ar = 'كيلو جوانح دجاج مشوية على الفحم.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'haehnchenfluegel-1kg';

UPDATE products SET
  description = 'Frisch gegrillter Fisch über Holzkohle mit Salat und Reis oder Pommes.',
  description_ar = 'سمكة طازجة مشوية على الفحم تقدم مع السلطة والأرز أو البطاطا.',
  tags = '["halal","contains_fish","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'gegrillter-fisch-teller';

UPDATE products SET
  description = 'Frisches Gemüse vom Holzkohlegrill mit orientalischen Gewürzen.',
  description_ar = 'تشكيلة خضار طازجة مشوية على الفحم مع البهارات الشرقية.',
  tags = '["vegetarian","vegan","halal"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'gegrillter-gemueseteller';

-- Recommandations
DO $$
DECLARE
  pid UUID;
  rid UUID;
  rec_slugs TEXT[];
  rec_slug TEXT;
  ord INT;
BEGIN
  rec_slugs := ARRAY['fattoush', 'coca-cola', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'gemischter-grillteller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['tabbouleh', 'ayran', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'lamm-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['sprite', 'hummus', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'schisch-tawouk-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fattoush', 'coca-cola', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'kebab-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['tabbouleh', 'mineralwasser', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'leber-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['sprite', 'pommes-teller', 'eis-vanille'];
  SELECT id INTO pid FROM products WHERE slug = 'halbes-grillhaehnchen';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fattoush', 'coca-cola', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'auberginen-kebab';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'pommes-teller', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'lahmacun-mit-kaese';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fattoush', 'hummus', 'coca-cola'];
  SELECT id INTO pid FROM products WHERE slug = 'gemischter-grill-1kg';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['tabbouleh', 'ayran', 'coca-cola'];
  SELECT id INTO pid FROM products WHERE slug = 'kebab-1kg';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fattoush', 'sprite', 'mineralwasser'];
  SELECT id INTO pid FROM products WHERE slug = 'schisch-tawouk-1kg';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'coca-cola', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'haehnchenfluegel-1kg';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['mineralwasser', 'salat', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'gegrillter-fisch-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['hummus', 'ayran', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'gegrillter-gemueseteller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
