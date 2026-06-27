-- 53 — Shisha
BEGIN;

UPDATE products SET
  description = 'Premium Shisha Spezialität Bloudan — ausgewogene Mischung mit langanhaltendem, vollem Rauch.',
  description_ar = 'أرجيلة بلودان المميزة — مزيج متوازن ودخان غني يدوم طويلاً.',
  tags = '["halal","signature","best_seller","premium"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shisha-bloudan';

UPDATE products SET
  description = 'Klassisches Doppel-Apfel-Aroma — der beliebteste Shisha-Klassiker.',
  description_ar = 'نكهة التفاحتين الكلاسيكية — الأكثر طلباً.',
  tags = '["halal","classic","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shisha-double-apple';

UPDATE products SET
  description = 'Erfrischende Mischung aus Traube und Minze.',
  description_ar = 'مزيج منعش من العنب والنعناع.',
  tags = '["halal","fruity","mint","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shisha-grape-mint';

UPDATE products SET
  description = 'Süß-fruchtiges Love 66 Aroma — ein Favorit unter Gästen.',
  description_ar = 'نكهة Love 66 الفواكهية الحلوة — من المفضلات.',
  tags = '["halal","fruity","sweet","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shisha-love-66';

UPDATE products SET
  description = 'Fruchtiges Cinderella-Aroma mit angenehm süßer Note.',
  description_ar = 'نكهة سندريلا الفواكهية بطعم حلو لذيذ.',
  tags = '["halal","fruity","sweet"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shisha-cinderella';

UPDATE products SET
  description = 'Erfrischendes Wassermelonen-Aroma — ideal für warme Tage.',
  description_ar = 'نكهة البطيخ المنعشة — مثالية للأيام الدافئة.',
  tags = '["halal","fruity","refreshing"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shisha-watermelon';

UPDATE products SET
  description = 'Cremiges Raffaello-Aroma mit Mandel und Kokosnote.',
  description_ar = 'نكهة رافايلو الكريمية مع اللوز وجوز الهند.',
  tags = '["halal","sweet","premium"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shisha-raffaello';

UPDATE products SET
  description = 'Bunter Fruchtmix — eine harmonische Mischung tropischer Aromen.',
  description_ar = 'مزيج فواكه متنوع بنكهات استوائية متناسقة.',
  tags = '["halal","fruity","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shisha-fruits';

UPDATE products SET
  description = 'Erfrischendes Polo-Aroma mit Zitrone und Minze.',
  description_ar = 'نكهة بولو المنعشة بالليمون والنعناع.',
  tags = '["halal","mint","refreshing"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shisha-polo';

UPDATE products SET
  description = 'Premium Shisha Royale — unsere Königsklasse mit exklusiver Tabakmischung und langer Rauchdauer.',
  description_ar = 'أرجيلة رويال الفاخرة — تشكيلة تبغ حصرية ودخان يدوم طويلاً.',
  tags = '["halal","premium","chef_recommendation","signature"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'shisha-royale';

DO $$
DECLARE pid UUID; rid UUID; rec_slugs TEXT[]; rec_slug TEXT; ord INT;
BEGIN
  rec_slugs := ARRAY['schwarzer-tee', 'bloudan-smoothie', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'shisha-bloudan';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['arabic-coffee', 'mineralwasser', 'Mate'];
  SELECT id INTO pid FROM products WHERE slug = 'shisha-double-apple';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['Grün Tee', 'Mojito', 'fruit-salad-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'shisha-grape-mint';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['Mojito', 'bloudan-smoothie', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'shisha-love-66';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['Maracuja Splash', 'erdbeer-smoothie', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'shisha-cinderella';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['eistee-wassermelone', 'mango-smoothie', 'fruit-salad-dubai'];
  SELECT id INTO pid FROM products WHERE slug = 'shisha-watermelon';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['Ipanema', 'cheesecake-bloudan', 'latte-macchiato'];
  SELECT id INTO pid FROM products WHERE slug = 'shisha-raffaello';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['bloudan-smoothie', 'fruit-salad-bloudan', 'Mojito'];
  SELECT id INTO pid FROM products WHERE slug = 'shisha-fruits';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['Polo Smoothie', 'Grün Tee', 'gemischter-grillteller'];
  SELECT id INTO pid FROM products WHERE slug = 'shisha-polo';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['bloudan-milkshake', 'schwarzer-tee', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'shisha-royale';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
