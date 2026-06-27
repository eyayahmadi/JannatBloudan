-- =============================================================================
-- 41 — Manakish : descriptions (DE/AR), tags, recommandations
-- Idempotent — 25 produits catégorie manakish. Prix / noms / station inchangés.
-- Ayran absent du catalogue → recommandations ignorées si slug introuvable.
-- =============================================================================

BEGIN;

-- 1. Manakish à la Souradia
UPDATE products SET
  description = 'Traditionelle syrische Manakish mit Hackfleisch, Käse, Za''atar, Muhammara und frischem Spinat.',
  description_ar = 'منقوشة سورية تقليدية محضرة باللحم المفروم والجبنة والزعتر والمحمرة والسبانخ.',
  tags = '["halal","chef_recommendation","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'manakish-a-la-souradia';

-- 2. Toshka
UPDATE products SET
  description = 'Knuspriges Fladenbrot mit Hackfleisch, geschmolzenem Käse und orientalischen Gewürzen.',
  description_ar = 'خبز طازج محشو باللحم المفروم والجبنة الذائبة والبهارات الشرقية.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-toshka';

-- 3. Fleischstreifen auf Teig
UPDATE products SET
  description = 'Frisch gebackener Teig mit zarten Fleischstreifen und orientalischen Gewürzen.',
  description_ar = 'عجينة طازجة مع شرحات لحم متبلة بالبهارات الشرقية.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-fleischstreifen-auf-teig';

-- 4. Lamm Stückchen auf Teig
UPDATE products SET
  description = 'Knuspriger Teig belegt mit zarten Lammstückchen und feinen orientalischen Gewürzen.',
  description_ar = 'عجينة طازجة مع قطع لحم غنم متبلة ومشوية.',
  tags = '["halal","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'manakish-lamm-stueckchen-auf-teig';

-- 5. Schisch Tawouk
UPDATE products SET
  description = 'Frischer Teig mit marinierten Hähnchenbruststreifen und geschmolzenem Käse.',
  description_ar = 'عجينة طازجة مع شيش طاووق متبل وجبنة ذائبة.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-schisch-tawouk';

-- 6. Za'atar
UPDATE products SET
  description = 'Traditionelle Manakish mit aromatischem Za''atar und nativem Olivenöl.',
  description_ar = 'منقوشة زعتر طازجة مع زيت الزيتون البكر.',
  tags = '["vegetarian","vegan","halal"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-zaatar';

-- 7. Za'atar mit Käse
UPDATE products SET
  description = 'Aromatische Za''atar-Manakish mit geschmolzenem Käse.',
  description_ar = 'منقوشة زعتر مع جبنة ذائبة طازجة.',
  tags = '["vegetarian","halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-zaatar-mit-kaese';

-- 8. Käse Pide
UPDATE products SET
  description = 'Frisch gebackene Pide mit geschmolzenem Käse.',
  description_ar = 'فطيرة جبنة طازجة بجبنة ذائبة.',
  tags = '["vegetarian","halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-kaese-pide';

-- 9. Calzoni
UPDATE products SET
  description = 'Knusprige Calzone gefüllt mit Kaschkawal-Käse.',
  description_ar = 'كالزوني محشو بجبنة القشقوان الذائبة.',
  tags = '["vegetarian","halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-calazoni';

-- 10. Muhammara mit Kaschkawal
UPDATE products SET
  description = 'Knusprige Manakish mit Muhammara und Kaschkawal-Käse.',
  description_ar = 'منقوشة محمرة مع جبنة قشقوان الذائبة.',
  tags = '["vegetarian","halal","spicy","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'manakish-muhammara-kaschkawal';

-- 11. Spinat Dreieckig
UPDATE products SET
  description = 'Dreieckige Manakish mit frischem Spinat, Zwiebeln und orientalischen Gewürzen.',
  description_ar = 'فطيرة سبانخ مثلثة مع البصل والبهارات الشرقية.',
  tags = '["vegetarian","vegan","halal"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-spinat-dreieckig';

-- 12. Sucuk Calzone
UPDATE products SET
  description = 'Knusprige Calzone mit würziger Sucuk und geschmolzenem Käse.',
  description_ar = 'كالزوني محشو بسجق متبل وجبنة ذائبة.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-sucuk-calzone';

-- 13. Lahmacun
UPDATE products SET
  description = 'Dünner knuspriger Teig mit würzigem Hackfleisch und orientalischen Gewürzen.',
  description_ar = 'لحمة بالعجين محضرة باللحم المفروم والبهارات الشرقية.',
  tags = '["halal","best_seller"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-lammacun';

-- 14. Lahmacun Syrisch
UPDATE products SET
  description = 'Syrische Lahmacun mit feinem Hackfleisch und orientalischen Gewürzen.',
  description_ar = 'صفيحة شامية تقليدية باللحم المفروم والبهارات الشرقية.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-lammacun-syrisch';

-- 15. Lahmacun mit Joghurt
UPDATE products SET
  description = 'Syrische Lahmacun serviert mit frischem Joghurt.',
  description_ar = 'صفيحة شامية تقدم مع اللبن الطازج.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-lammacun-mit-joghurt';

-- 16. Sanfura
UPDATE products SET
  description = 'Knusprige Spezialität mit Kaschkawal-Käse und cremiger Mayonnaise.',
  description_ar = 'سنفورة محشوة بجبنة القشقوان والمايونيز.',
  tags = '["vegetarian","halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-sanfura';

-- 17. Kartoffel Ecke
UPDATE products SET
  description = 'Knusprige Teigtasche gefüllt mit gewürzten Kartoffeln.',
  description_ar = 'فطيرة محشوة بالبطاطا المتبلة.',
  tags = '["vegetarian","vegan","halal"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-kartoffel-ecke';

-- 18. Oliven
UPDATE products SET
  description = 'Frische Manakish mit aromatischen Oliven und Olivenöl.',
  description_ar = 'منقوشة بالزيتون الطازج وزيت الزيتون.',
  tags = '["vegetarian","vegan","halal"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-oliven';

-- 19. Chicken mit Käse
UPDATE products SET
  description = 'Frischer Teig mit Hähnchenbrust und geschmolzenem Käse.',
  description_ar = 'عجينة طازجة مع الدجاج المشوي والجبنة الذائبة.',
  tags = '["halal","popular","contains_milk"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-chicken-mit-kaese';

-- 20. Mexican Chicken
UPDATE products SET
  description = 'Würziges Hähnchen nach mexikanischer Art mit geschmolzenem Käse.',
  description_ar = 'دجاج مكسيكي متبل مع جبنة ذائبة.',
  tags = '["halal","spicy","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'manakish-mexican-chicken';

-- 21. Muhammara mit Oliven
UPDATE products SET
  description = 'Muhammara mit aromatischen Oliven auf knusprigem Teig.',
  description_ar = 'منقوشة محمرة مع الزيتون.',
  tags = '["vegetarian","vegan","halal","spicy"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'manakish-muhamara-mit-oliven';

-- 22. Muhammara mit Nüsse
UPDATE products SET
  description = 'Muhammara mit Walnüssen auf frisch gebackenem Teig.',
  description_ar = 'منقوشة محمرة مع الجوز.',
  tags = '["vegetarian","halal","spicy","contains_nuts"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'manakish-muhammara-mit-nuesse';

-- 23. Libanesischer Käse
UPDATE products SET
  description = 'Traditionelle libanesische Käse-Manakish.',
  description_ar = 'منقوشة جبنة بلدية لبنانية.',
  tags = '["vegetarian","halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-libanesischer-kaese';

-- 24. Akkawi-Käse
UPDATE products SET
  description = 'Frisch gebackene Manakish mit originalem Akkawi-Käse.',
  description_ar = 'منقوشة بجبنة عكاوي الأصلية.',
  tags = '["vegetarian","halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'manakish-akkawi-kaese';

-- 25. Spezial Bloudan
UPDATE products SET
  description = 'Spezialität des Hauses mit Lahmacun, Schisch Tawouk, Kaschkawal, Muhammara, Nüssen und Za''atar.',
  description_ar = 'منقوشة بلودان الخاصة مع اللحمة بالعجين وشيش طاووق وجبنة قشقوان والمحمرة والجوز والزعتر.',
  tags = '["halal","chef_recommendation","best_seller"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'manakish-spezial-bloudan';

-- Recommandations « Passt dazu »
DO $$
DECLARE
  pid UUID;
  rid UUID;
  rec_slugs TEXT[];
  rec_slug TEXT;
  ord INT;
BEGIN
  rec_slugs := ARRAY['ayran', 'fattoush', 'schwarzer-tee'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-a-la-souradia';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'pommes-teller', 'ayran'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-toshka';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['salat', 'stillwasser', 'ayran'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-fleischstreifen-auf-teig';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['tabbouleh', 'mineralwasser', 'schwarzer-tee'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-lamm-stueckchen-auf-teig';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'salat', 'pommes-teller'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-schisch-tawouk';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schwarzer-tee', 'ayran', 'tabbouleh'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-zaatar';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'mineralwasser', 'salat'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-zaatar-mit-kaese';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schwarzer-tee', 'ayran', 'salat'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-kaese-pide';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'salat', 'ayran'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-calazoni';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'tabbouleh', 'mineralwasser'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-muhammara-kaschkawal';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schwarzer-tee', 'ayran', 'salat'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-spinat-dreieckig';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'pommes-teller', 'ayran'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-sucuk-calzone';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'salat', 'mineralwasser'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-lammacun';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'tabbouleh', 'coca-cola'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-lammacun-syrisch';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'salat', 'schwarzer-tee'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-lammacun-mit-joghurt';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'pommes-teller'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-sanfura';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'salat'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-kartoffel-ecke';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schwarzer-tee', 'salat'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-oliven';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'ayran'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-chicken-mit-kaese';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'pommes-teller'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-mexican-chicken';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'salat'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-muhamara-mit-oliven';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schwarzer-tee', 'ayran'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-muhammara-mit-nuesse';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'salat'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-libanesischer-kaese';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schwarzer-tee', 'ayran'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-akkawi-kaese';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['ayran', 'fattoush', 'coca-cola'];
  SELECT id INTO pid FROM products WHERE slug = 'manakish-spezial-bloudan';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
