-- =============================================================================
-- 39 — Entrées : descriptions (DE/AR), tags, recommandations
-- Idempotent — met à jour uniquement la catégorie entrees (12 produits).
-- =============================================================================

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ar TEXT;

COMMENT ON COLUMN products.description_ar IS 'Description produit en arabe (CMS admin).';

-- Descriptions + tags
UPDATE products SET
  description = 'Hausgemachter Hummus mit Tahini, Zitronensaft und Olivenöl. Cremig, frisch und perfekt als Vorspeise.',
  description_ar = 'حمص طازج بالطحينة وعصير الليمون وزيت الزيتون، كريمي ومثالي كمقبلات.',
  tags = '["vegetarian","vegan","halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false
WHERE slug = 'hummus';

UPDATE products SET
  description = 'Cremiger Hummus mit würzigem Hackfleisch, Olivenöl und orientalischen Gewürzen.',
  description_ar = 'حمص كريمي مع لحم مفروم متبل وزيت الزيتون ونكهات شرقية.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false
WHERE slug = 'hummus-mit-hackfleisch';

UPDATE products SET
  description = 'Geräucherte Auberginencreme mit Tahini, Zitronensaft und Olivenöl. Leicht, aromatisch und frisch.',
  description_ar = 'متبل باذنجان مدخن مع الطحينة وعصير الليمون وزيت الزيتون، خفيف وطازج.',
  tags = '["vegetarian","vegan","halal"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false
WHERE slug = 'baba-ghanoug';

UPDATE products SET
  description = 'Gegrillte Auberginencreme mit Joghurt, Knoblauch, Tahini und Zitronensaft.',
  description_ar = 'متبل باذنجان مشوي مع اللبن والثوم والطحينة وعصير الليمون.',
  tags = '["vegetarian","halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false
WHERE slug = 'mutabbal';

UPDATE products SET
  description = 'Würzige Paprikapaste mit Walnüssen, Paniermehl, Olivenöl und Granatapfelsauce.',
  description_ar = 'محمرة حارة خفيفة من الفليفلة والجوز والخبز المطحون وزيت الزيتون ودبس الرمان.',
  tags = '["vegetarian","vegan","halal","spicy","contains_nuts","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false,
  spice_level = 'épicé'
WHERE slug = 'muhammara';

UPDATE products SET
  description = 'Gefüllte Weinblätter mit Reis, Kräutern und feiner Zitronennote.',
  description_ar = 'ورق عنب محشي بالأرز والأعشاب مع نكهة ليمون خفيفة.',
  tags = '["vegetarian","vegan","halal"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false
WHERE slug = 'veganer-weinblaetter';

UPDATE products SET
  description = 'Knusprige Teigröllchen gefüllt mit Frischkäse, Petersilie und Ei.',
  description_ar = 'رقائق مقرمشة محشوة بالجبنة والبقدونس والبيض.',
  tags = '["vegetarian","halal","contains_milk","contains_eggs","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false
WHERE slug = 'zigarrenburak';

UPDATE products SET
  description = 'Orientalisch gewürzter Reis, ideal als Beilage zu Grillgerichten und Vorspeisen.',
  description_ar = 'رز متبل على الطريقة الشرقية، مناسب كمرافق للمشاوي والمقبلات.',
  tags = '["vegetarian","vegan","halal"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false
WHERE slug = 'gewuerzter-reis';

UPDATE products SET
  description = 'Knusprige Pommes frites, goldbraun serviert.',
  description_ar = 'بطاطا مقلية مقرمشة تقدم ساخنة وذهبية.',
  tags = '["vegetarian","vegan","halal","kids_friendly"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false
WHERE slug = 'pommes-teller';

UPDATE products SET
  description = 'Knusprige Chicken Nuggets, serviert mit Pommes.',
  description_ar = 'قطع ناغتس دجاج مقرمشة تقدم مع البطاطا.',
  tags = '["halal","kids_friendly"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false
WHERE slug = 'chicken-nuggets-pommes';

UPDATE products SET
  description = 'Frittierte Kibbeh mit würziger Fleischfüllung und orientalischen Gewürzen.',
  description_ar = 'كبة مقلية محشوة باللحم المتبل والبهارات الشرقية.',
  tags = '["halal","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false
WHERE slug = 'kebbeh-frittiert';

UPDATE products SET
  description = 'Gegrillte Kibbeh mit feiner Fleischfüllung, aromatisch und herzhaft.',
  description_ar = 'كبة مشوية محشوة باللحم المتبل، غنية بالنكهة الشرقية.',
  tags = '["halal","chef_recommendation","contains_gluten"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true
WHERE slug = 'gegrillte-kibbeh';

-- Recommandations « Passt dazu » (product_recommendations)
DO $$
DECLARE
  pid UUID;
  rid UUID;
  rec_slugs TEXT[];
  rec_slug TEXT;
  ord INT;
BEGIN
  -- hummus → Baba Ghanoug, Tabbouleh, Stillwasser
  rec_slugs := ARRAY['baba-ghanoug', 'tabbouleh', 'stillwasser'];
  SELECT id INTO pid FROM products WHERE slug = 'hummus';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN
        INSERT INTO product_recommendations (product_id, recommended_product_id, display_order)
        VALUES (pid, rid, ord) ON CONFLICT (product_id, recommended_product_id) DO NOTHING;
        ord := ord + 1;
      END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['gewuerzter-reis', 'fattoush', 'coca-cola'];
  SELECT id INTO pid FROM products WHERE slug = 'hummus-mit-hackfleisch';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN
        INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord);
        ord := ord + 1;
      END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['hummus', 'tabbouleh', 'mineralwasser'];
  SELECT id INTO pid FROM products WHERE slug = 'baba-ghanoug';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['hummus', 'muhammara', 'schwarzer-tee'];
  SELECT id INTO pid FROM products WHERE slug = 'mutabbal';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  -- Muhammara : Ayran absent du catalogue → Hummus, Za'atar (manakish)
  rec_slugs := ARRAY['hummus', 'manakish-zaatar'];
  SELECT id INTO pid FROM products WHERE slug = 'muhammara';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['tabbouleh', 'hummus', 'eistee-zitrone'];
  SELECT id INTO pid FROM products WHERE slug = 'veganer-weinblaetter';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['hummus', 'coca-cola', 'fattoush'];
  SELECT id INTO pid FROM products WHERE slug = 'zigarrenburak';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['gemischter-grillteller', 'kebab-teller', 'stillwasser'];
  SELECT id INTO pid FROM products WHERE slug = 'gewuerzter-reis';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['shawarma-sandwich', 'coca-cola', 'chicken-nuggets-pommes'];
  SELECT id INTO pid FROM products WHERE slug = 'pommes-teller';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'sprite', 'coca-cola'];
  SELECT id INTO pid FROM products WHERE slug = 'chicken-nuggets-pommes';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  -- Kebbeh frittiert : Ayran absent → Hummus, Fattoush
  rec_slugs := ARRAY['hummus', 'fattoush'];
  SELECT id INTO pid FROM products WHERE slug = 'kebbeh-frittiert';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['hummus', 'tabbouleh', 'schwarzer-tee'];
  SELECT id INTO pid FROM products WHERE slug = 'gegrillte-kibbeh';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;
END $$;

COMMIT;
