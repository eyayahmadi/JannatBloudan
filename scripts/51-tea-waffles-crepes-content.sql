-- 51 — Tea, Waffles, Crêpes
BEGIN;

UPDATE products SET
  description = 'Traditioneller schwarzer Tee nach orientalischer Art, serviert mit frischer Minze oder mit Ingwer und Honig.',
  description_ar = 'شاي أسود بالطريقة الشرقية التقليدية يقدم مع النعناع الطازج أو الزنجبيل والعسل.',
  tags = '["halal","vegan","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'schwarzer-tee';

UPDATE products SET
  description = 'Aromatischer grüner Tee mit mildem Geschmack, frisch zubereitet.',
  description_ar = 'شاي أخضر طبيعي بطعم منعش وخفيف.',
  tags = '["halal","vegan"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'gruen-tee';

UPDATE products SET
  description = 'Wärmender Ingwertee mit frischer Zitrone.',
  description_ar = 'مشروب زنجبيل طازج مع الليمون.',
  tags = '["halal","vegan"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'ingwer-zitrone';

UPDATE products SET
  description = 'Beruhigender Kamillentee mit feinem Aroma.',
  description_ar = 'شاي بابونج طبيعي ومهدئ.',
  tags = '["halal","vegan"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'kamille-tee';

UPDATE products SET
  description = 'Traditionelle Mate nach orientalischer Art serviert.',
  description_ar = 'متة أصلية تقدم بالطريقة التقليدية.',
  tags = '["halal","vegan","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'mate';

UPDATE products SET
  description = 'Warmes Getränk aus Kreuzkümmel und frischer Zitrone.',
  description_ar = 'مشروب ساخن من الكمون والليمون.',
  tags = '["halal","vegan"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'cumin-lemon-tea';

UPDATE products SET
  description = 'Frisch gebackene goldene Waffel mit feinem Zucker.',
  description_ar = 'وافل طازج ومقرمش يقدم ساخناً.',
  tags = '["halal","contains_milk","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'waffle-nature';

UPDATE products SET
  description = 'Frisch zubereiteter Crêpe nach Wunsch — wählen Sie aus unserer Auswahl an Extras und Füllungen.',
  description_ar = 'كريب طازج حسب الطلب — اختر من تشكيلة الإضافات والحشوات.',
  tags = '["halal","contains_milk","contains_gluten","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'crepe-nature';

DO $$
DECLARE pid UUID; rid UUID; rec_slugs TEXT[]; rec_slug TEXT; ord INT;
BEGIN
  rec_slugs := ARRAY['waffle-nature', 'crepe-nature', 'shisha-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'schwarzer-tee';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['waffle-nature', 'fruit-salad-lotus', 'shisha-love-66'];
  SELECT id INTO pid FROM products WHERE slug = 'gruen-tee';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'cheesecake-bloudan', 'shisha-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'ingwer-zitrone';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['Waffel Schoko', 'cheesecake-oreo', 'shisha-fruits'];
  SELECT id INTO pid FROM products WHERE slug = 'kamille-tee';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['shisha-bloudan', 'noix', 'arabic-coffee'];
  SELECT id INTO pid FROM products WHERE slug = 'mate';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['arabic-coffee', 'shisha-love-66', 'noix'];
  SELECT id INTO pid FROM products WHERE slug = 'cumin-lemon-tea';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schwarzer-tee', 'erdbeer-smoothie', 'hot-chocolate'];
  SELECT id INTO pid FROM products WHERE slug = 'waffle-nature';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['vanilla-latte', 'mango-smoothie', 'cheesecake-lotus'];
  SELECT id INTO pid FROM products WHERE slug = 'crepe-nature';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
