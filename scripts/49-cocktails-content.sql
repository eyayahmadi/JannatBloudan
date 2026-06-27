-- 49 — Cocktails, Smoothies, Milkshakes, Imperator
BEGIN;

UPDATE products SET
  description = 'Erfrischender alkoholfreier Mojito mit frischer Minze, Limette und Sprudel.',
  description_ar = 'موهيتو منعش بدون كحول مع النعناع الطازج والليمون.',
  tags = '["halal","popular","refreshing"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'mojito';

UPDATE products SET
  description = 'Alkoholfreier Mojito mit frischen Erdbeeren und Minze.',
  description_ar = 'موهيتو فراولة منعش مع النعناع الطازج.',
  tags = '["halal","popular","refreshing"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'erdbeer-mojito';

UPDATE products SET
  description = 'Fruchtiger Maracuja-Cocktail mit tropischem Geschmack.',
  description_ar = 'كوكتيل ماراكويا استوائي منعش.',
  tags = '["halal","tropical"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'maracuja-splash';

UPDATE products SET
  description = 'Erfrischender Cocktail mit süßer Ananas.',
  description_ar = 'كوكتيل أناناس منعش بطعم استوائي.',
  tags = '["halal","tropical"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'sweet-ananas';

UPDATE products SET
  description = 'Klassischer alkoholfreier Cocktail mit Limette und Maracuja.',
  description_ar = 'كوكتيل إيبانيما المنعش بالليمون والماراكويا.',
  tags = '["halal","refreshing"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'ipanema';

UPDATE products SET
  description = 'Exotischer Fruchtcocktail mit tropischem Aroma.',
  description_ar = 'كوكتيل فواكه استوائي غني بالنكهات.',
  tags = '["halal","tropical"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'jamaica';

UPDATE products SET
  description = 'Hausgemachter Smoothie aus frischen Früchten.',
  description_ar = 'سموذي بلودان المحضر من تشكيلة فواكه طازجة.',
  tags = '["halal","popular","vegetarian"]'::jsonb,
  is_popular = true, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'bloudan-smoothie';

UPDATE products SET
  description = 'Cremiger Mango-Smoothie aus sonnengereiften Mangos.',
  description_ar = 'سموذي مانجو كريمي ومنعش.',
  tags = '["halal","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'mango-smoothie';

UPDATE products SET
  description = 'Frischer Erdbeer-Smoothie mit natürlicher Süße.',
  description_ar = 'سموذي فراولة طبيعي ومنعش.',
  tags = '["halal","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'erdbeer-smoothie';

UPDATE products SET
  description = 'Fruchtiger Ananas-Smoothie mit tropischem Geschmack.',
  description_ar = 'سموذي أناناس استوائي منعش.',
  tags = '["halal","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'ananas-smoothie';

UPDATE products SET
  description = 'Erfrischender Limetten-Minze-Smoothie.',
  description_ar = 'سموذي ليمون ونعناع منعش.',
  tags = '["halal","refreshing"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'polo-smoothie';

UPDATE products SET
  description = 'Hausgemachter Premium-Milchshake mit Spezialrezept.',
  description_ar = 'ميلك شيك بلودان الكريمي بوصفة خاصة.',
  tags = '["halal","contains_milk","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'bloudan-milkshake';

UPDATE products SET
  description = 'Cremiger Milchshake mit frischen Erdbeeren.',
  description_ar = 'ميلك شيك بالفراولة الطازجة.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'erdbeer-milkshake';

UPDATE products SET
  description = 'Schokoladiger Milchshake mit cremiger Konsistenz.',
  description_ar = 'ميلك شيك شوكولا غني وكريمي.',
  tags = '["halal","contains_milk","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'schokoladen-milkshake';

UPDATE products SET
  description = 'Milchshake mit Oreo-Keksen und cremigem Eis.',
  description_ar = 'ميلك شيك أوريو مع بسكويت أوريو وآيس كريم.',
  tags = '["halal","contains_milk","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'oreo-milkshake';

UPDATE products SET
  description = 'XXL-Fruchtmix mit Avocado, Erdbeeren, Honig und arabischer Rahmcreme.',
  description_ar = 'كوكتيل فاخر بالأفوكادو والفراولة والعسل والقشطة العربية.',
  tags = '["halal","premium","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'imperator-avoca-free';

UPDATE products SET
  description = 'XXL-Fruchtcocktail mit Ananas, Kiwi und Cornflakes.',
  description_ar = 'كوكتيل فواكه فاخر بالأناناس والكيوي والكورن فليكس.',
  tags = '["halal","premium"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'imperator-pinastro-flix';

UPDATE products SET
  description = 'Großer Fruchtmix mit Ananas, Erdbeeren, Kiwi und Zitrone.',
  description_ar = 'كوكتيل فواكه كبير بالأناناس والفراولة والكيوي والليمون.',
  tags = '["halal","premium"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'imperator-x4';

UPDATE products SET
  description = 'XXL-Fruchtmix mit Wassermelone, Erdbeeren, Zitrone und Ananas.',
  description_ar = 'كوكتيل فواكه فاخر بالبطيخ والفراولة والأناناس.',
  tags = '["halal","premium"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'imperator-thundermix';

DO $$
DECLARE pid UUID; rid UUID; rec_slugs TEXT[]; rec_slug TEXT; ord INT;
BEGIN
  rec_slugs := ARRAY['Shisha Love 66', 'waffle-nature', 'cheesecake-oreo'];
  SELECT id INTO pid FROM products WHERE slug = 'mojito';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'waffle-nature', 'shisha-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'erdbeer-mojito';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['cheesecake-dubai', 'fruit-salad-dubai', 'shisha-cinderella'];
  SELECT id INTO pid FROM products WHERE slug = 'maracuja-splash';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['waffle-nature', 'brownie-cake', 'shisha-fruits'];
  SELECT id INTO pid FROM products WHERE slug = 'sweet-ananas';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'cheesecake-oreo', 'shisha-raffaello'];
  SELECT id INTO pid FROM products WHERE slug = 'ipanema';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fruit-salad-bloudan', 'cheesecake-bloudan', 'shisha-polo'];
  SELECT id INTO pid FROM products WHERE slug = 'jamaica';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['waffle-nature', 'crepe-nature', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'bloudan-smoothie';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pancake-nature', 'cheesecake-oreo', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'mango-smoothie';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'waffle-nature', 'eis-vanille'];
  SELECT id INTO pid FROM products WHERE slug = 'erdbeer-smoothie';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fruit-salad-dubai', 'brownie-cake', 'shisha-love-66'];
  SELECT id INTO pid FROM products WHERE slug = 'ananas-smoothie';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['shawarma-arabi-teller', 'gemischter-grillteller', 'shisha-fruits'];
  SELECT id INTO pid FROM products WHERE slug = 'polo-smoothie';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['waffle-nature', 'cheesecake-bloudan', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'bloudan-milkshake';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'cheesecake-oreo', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'erdbeer-milkshake';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['brownie-cake', 'waffle-nature', 'cheesecake-oreo'];
  SELECT id INTO pid FROM products WHERE slug = 'schokoladen-milkshake';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['cheesecake-oreo', 'waffle-nature', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'oreo-milkshake';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['shisha-bloudan', 'waffle-nature', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'imperator-avoca-free';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fruit-salad-dubai', 'brownie-cake', 'shisha-love-66'];
  SELECT id INTO pid FROM products WHERE slug = 'imperator-pinastro-flix';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['cheesecake-dubai', 'crepe-nature', 'shisha-raffaello'];
  SELECT id INTO pid FROM products WHERE slug = 'imperator-x4';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fruit-salad-bloudan', 'waffle-nature', 'shisha-fruits'];
  SELECT id INTO pid FROM products WHERE slug = 'imperator-thundermix';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
