-- 48 — Cold Drinks, Soft Drinks, Ice Tea
BEGIN;

UPDATE products SET
  description = 'Natürliches stilles Mineralwasser, perfekt gekühlt und die ideale Begleitung zu jeder Mahlzeit.',
  description_ar = 'مياه معدنية طبيعية باردة، مثالية مع جميع الوجبات.',
  tags = '["halal","vegan","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'stillwasser';

UPDATE products SET
  description = 'Erfrischendes Mineralwasser mit Kohlensäure.',
  description_ar = 'مياه غازية باردة ومنعشة.',
  tags = '["halal","vegan","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'mineralwasser';

UPDATE products SET
  description = 'Fruchtiger Ananassaft mit natürlicher Süße und tropischem Aroma.',
  description_ar = 'عصير أناناس طبيعي بطعم استوائي منعش.',
  tags = '["halal","vegan","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'ananassaft';

UPDATE products SET
  description = 'Frischer Apfelsaft mit ausgewogenem Geschmack.',
  description_ar = 'عصير تفاح طبيعي ومنعش.',
  tags = '["halal","vegan","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'apfelsaft';

UPDATE products SET
  description = 'Frischer Orangensaft voller Vitamine.',
  description_ar = 'عصير برتقال طبيعي غني بالنكهة.',
  tags = '["halal","vegan","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'orangensaft';

UPDATE products SET
  description = 'Exotischer Mangosaft mit intensivem Fruchtgeschmack.',
  description_ar = 'عصير مانجو استوائي غني بالطعم.',
  tags = '["halal","vegan","vegetarian","popular"]'::jsonb,
  is_popular = true, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'mangosaft';

UPDATE products SET
  description = 'Fruchtiger Erdbeersaft, frisch und erfrischend.',
  description_ar = 'عصير فراولة طبيعي ومنعش.',
  tags = '["halal","vegan","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'erdbeersaft';

UPDATE products SET
  description = 'Exotischer Maracujasaft mit angenehm fruchtiger Note.',
  description_ar = 'عصير ماراكويا استوائي ومنعش.',
  tags = '["halal","vegan","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'maracujasaft';

UPDATE products SET
  description = 'Fruchtige Mischung aus Banane und Kirsche.',
  description_ar = 'مزيج منعش من الموز والكرز.',
  tags = '["halal","vegetarian"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'kiba';

UPDATE products SET
  description = 'Eiskalte Coca-Cola – der Klassiker zu jeder Mahlzeit.',
  description_ar = 'كوكاكولا باردة ومنعشة.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'coca-cola';

UPDATE products SET
  description = 'Kalorienfreie Coca-Cola Zero mit vollem Geschmack.',
  description_ar = 'كوكاكولا زيرو بدون سكر.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'coca-cola-zero';

UPDATE products SET
  description = 'Erfrischende Orangenlimonade.',
  description_ar = 'فانتا بنكهة البرتقال.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'fanta';

UPDATE products SET
  description = 'Spritzige Zitronenlimonade, eisgekühlt serviert.',
  description_ar = 'سبرايت منعش بنكهة الليمون.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'sprite';

UPDATE products SET
  description = 'Original Red Bull Energy Drink.',
  description_ar = 'مشروب ريد بول الأصلي للطاقة.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'red-bull';

UPDATE products SET
  description = 'Zuckerfreier Energy Drink.',
  description_ar = 'ريد بول بدون سكر.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'red-bull-sugar-free';

UPDATE products SET
  description = 'Red Bull White Edition mit fruchtigem Geschmack.',
  description_ar = 'ريد بول وايت بنكهة مميزة.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'red-bull-white';

UPDATE products SET
  description = 'Erfrischender Pfirsich-Eistee.',
  description_ar = 'شاي مثلج بنكهة الخوخ.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'eistee-pfirsich';

UPDATE products SET
  description = 'Klassischer Zitronen-Eistee.',
  description_ar = 'شاي مثلج بنكهة الليمون.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'eistee-zitrone';

UPDATE products SET
  description = 'Fruchtiger Eistee mit Wassermelonengeschmack.',
  description_ar = 'شاي مثلج بنكهة البطيخ.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'eistee-wassermelone';

DO $$
DECLARE pid UUID; rid UUID; rec_slugs TEXT[]; rec_slug TEXT; ord INT;
BEGIN
  rec_slugs := ARRAY['gemischter-grillteller', 'shawarma-arabi-teller', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'stillwasser';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['kebab-teller', 'salat', 'hummus'];
  SELECT id INTO pid FROM products WHERE slug = 'mineralwasser';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['chicken-nuggets-pommes', 'waffle-nature', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'ananassaft';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['halloumi-teller', 'cheesecake-bloudan', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'apfelsaft';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['falafel-halloumi-teller', 'pancake-nature', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'orangensaft';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['chicken-fries', 'crepe-nature', 'cheesecake-dubai'];
  SELECT id INTO pid FROM products WHERE slug = 'mangosaft';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['waffle-nature', 'brownie-cake', 'eis-fraise'];
  SELECT id INTO pid FROM products WHERE slug = 'erdbeersaft';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fruit-salad-dubai', 'pancake-nature', 'cheesecake-oreo'];
  SELECT id INTO pid FROM products WHERE slug = 'maracujasaft';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'waffle-nature', 'coupe-arabe'];
  SELECT id INTO pid FROM products WHERE slug = 'kiba';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['klassik-burger', 'shawarma-sandwich', 'pommes-teller'];
  SELECT id INTO pid FROM products WHERE slug = 'coca-cola';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['chicken-fries', 'crispy-chicken-burger', 'gemischter-grillteller'];
  SELECT id INTO pid FROM products WHERE slug = 'coca-cola-zero';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pizza-mexikano', 'chicken-nuggets-pommes', 'crispy-chicken-sandwich'];
  SELECT id INTO pid FROM products WHERE slug = 'fanta';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['fajita-teller', 'shawarma-arabi-teller', 'chicken-fries'];
  SELECT id INTO pid FROM products WHERE slug = 'sprite';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['shisha-bloudan', 'shisha-love-66', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'red-bull';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['shisha-fruits', 'waffle-nature', 'cheesecake-lotus'];
  SELECT id INTO pid FROM products WHERE slug = 'red-bull-sugar-free';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['shisha-cinderella', 'cheesecake-oreo', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'red-bull-white';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pizza-margherita', 'crispy-chicken-sandwich', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'eistee-pfirsich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['gemischter-grillteller', 'shawarma-arabi-teller', 'fruit-salad-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'eistee-zitrone';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['bloudan-burger', 'crispy-chicken-burger', 'cheesecake-dubai'];
  SELECT id INTO pid FROM products WHERE slug = 'eistee-wassermelone';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
