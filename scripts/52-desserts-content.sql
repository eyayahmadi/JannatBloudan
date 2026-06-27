-- 52 — Pancakes, Fruit Salads, Snacks, Ice Cream, Cheesecakes, Cakes
BEGIN;

UPDATE products SET
  description = 'Fluffige Pancakes nach Art des Hauses — wählen Sie Ihre Lieblings-Extras.',
  description_ar = 'بان كيك طري ومميز — اختر الإضافات المفضلة لديك.',
  tags = '["halal","contains_milk","contains_gluten","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'pancake-nature';

UPDATE products SET
  description = 'Frischer Fruchtsalat Spezialität Bloudan mit saisonalen Früchten und hausgemachter Creme.',
  description_ar = 'سلطة فواكه بلودان المميزة مع فواكه موسمية وكريمة خاصة.',
  tags = '["halal","vegetarian","contains_fruit","best_seller"]'::jsonb,
  is_popular = true, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'fruit-salad-bloudan';

UPDATE products SET
  description = 'Frischer Fruchtsalat mit Lotus-Creme und knusprigen Lotus-Keksen.',
  description_ar = 'سلطة فواكه مع كريمة اللوتس وبسكويت اللوتس.',
  tags = '["halal","vegetarian","contains_fruit","popular"]'::jsonb,
  is_popular = true, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'fruit-salad-lotus';

UPDATE products SET
  description = 'Luxuriöser Fruchtsalat mit Pistaziencreme und Schokolade nach Dubai-Art.',
  description_ar = 'سلطة فواكه فاخرة بكريمة الفستق والشوكولا على طريقة دبي.',
  tags = '["halal","vegetarian","contains_fruit","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'fruit-salad-dubai';

UPDATE products SET
  description = 'Knusprige Chips serviert mit einer Auswahl gemischter Nüsse.',
  description_ar = 'شيبس مقرمش مع تشكيلة من المكسرات.',
  tags = '["halal","vegetarian","contains_nuts"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'chips-noix';

UPDATE products SET
  description = 'Auswahl gerösteter und gesalzener Nüsse — ideal zum Teilen.',
  description_ar = 'تشكيلة مكسرات محمصة ومالحة، مثالية للمشاركة.',
  tags = '["halal","vegetarian","contains_nuts","popular"]'::jsonb,
  is_popular = true, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'noix';

UPDATE products SET
  description = 'Arabisches Eisbecher-Spezial mit Vanilleeis, Pistazien, Rosenwasser und knusprigen Toppings.',
  description_ar = 'آيس كريم عربي مميز مع الفانيليا والفستق وماء الورد.',
  tags = '["halal","contains_milk","best_seller"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'coupe-arabe';

UPDATE products SET
  description = 'Cremiges Vanilleeis — klassisch und erfrischend.',
  description_ar = 'آيس كريم فانيليا كريمي ومنعش.',
  tags = '["halal","contains_milk","vegetarian","kids_friendly"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'eis-vanille';

UPDATE products SET
  description = 'Fruchtiges Erdbeereis mit natürlichem Aroma.',
  description_ar = 'آيس كريم فراولة بطعم طبيعي.',
  tags = '["halal","contains_milk","vegetarian","contains_fruit"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'eis-fraise';

UPDATE products SET
  description = 'Reichhaltiges Schokoladeneis für Schokoladenliebhaber.',
  description_ar = 'آيس كريم شوكولا غني ولذيذ.',
  tags = '["halal","contains_milk","vegetarian","contains_chocolate","popular"]'::jsonb,
  is_popular = true, is_vegetarian = true, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'eis-chocolat';

UPDATE products SET
  description = 'Cremiger Cheesecake Spezialität Bloudan — Hausrezept.',
  description_ar = 'تشيز كيك بلودان الكريمي بوصفة المطعم الخاصة.',
  tags = '["halal","contains_milk","contains_gluten","best_seller"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'cheesecake-bloudan';

UPDATE products SET
  description = 'Cremiger Cheesecake mit Lotus-Creme und knusprigen Keksen.',
  description_ar = 'تشيز كيك باللوتس مع كريمة وبسكويت اللوتس.',
  tags = '["halal","contains_milk","contains_gluten","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'cheesecake-lotus';

UPDATE products SET
  description = 'Luxuriöser Cheesecake mit Pistaziencreme nach Dubai-Art.',
  description_ar = 'تشيز كيك فاخر بكريمة الفستق على طريقة دبي.',
  tags = '["halal","contains_milk","contains_gluten","contains_nuts","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'cheesecake-dubai';

UPDATE products SET
  description = 'Cremiger Cheesecake mit Oreo-Keksen und Schokoladensauce.',
  description_ar = 'تشيز كيك أوريو مع بسكويت أوريو وصوص الشوكولا.',
  tags = '["halal","contains_milk","contains_gluten","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'cheesecake-oreo';

UPDATE products SET
  description = 'Warmer Schokoladen-Lavakuchen mit flüssigem Kern — serviert heiß.',
  description_ar = 'كيك شوكولا ساخن بحشوة ذائبة من الداخل.',
  tags = '["halal","contains_milk","contains_gluten","contains_chocolate","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'molten-cake';

UPDATE products SET
  description = 'Saftiger Brownie-Kuchen mit intensiver Schokolade.',
  description_ar = 'كيك براونيز غني بالشوكола وطري.',
  tags = '["halal","contains_milk","contains_gluten","contains_chocolate","best_seller"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'brownie-cake';

DO $$
DECLARE pid UUID; rid UUID; rec_slugs TEXT[]; rec_slug TEXT; ord INT;
BEGIN
  rec_slugs := ARRAY['latte-macchiato', 'bloudan-smoothie', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'pancake-nature';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['bloudan-smoothie', 'mango-smoothie', 'shisha-love-66'];
  SELECT id INTO pid FROM products WHERE slug = 'fruit-salad-bloudan';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'cheesecake-lotus', 'vanilla-latte'];
  SELECT id INTO pid FROM products WHERE slug = 'fruit-salad-lotus';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'cheesecake-dubai', 'Maracuja Splash'];
  SELECT id INTO pid FROM products WHERE slug = 'fruit-salad-dubai';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['Mate', 'schwarzer-tee', 'mineralwasser'];
  SELECT id INTO pid FROM products WHERE slug = 'chips-noix';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['arabic-coffee', 'schwarzer-tee', 'shisha-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'noix';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schwarzer-tee', 'arabic-coffee', 'bloudan-smoothie'];
  SELECT id INTO pid FROM products WHERE slug = 'coupe-arabe';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['waffle-nature', 'Crepe Schoko', 'hot-chocolate'];
  SELECT id INTO pid FROM products WHERE slug = 'eis-vanille';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['erdbeer-smoothie', 'erdbeer-milkshake', 'cheesecake-oreo'];
  SELECT id INTO pid FROM products WHERE slug = 'eis-fraise';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schokoladen-milkshake', 'brownie-cake', 'Molten Cake'];
  SELECT id INTO pid FROM products WHERE slug = 'eis-chocolat';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['bloudan-milkshake', 'latte-macchiato', 'bloudan-smoothie'];
  SELECT id INTO pid FROM products WHERE slug = 'cheesecake-bloudan';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'vanilla-latte', 'erdbeer-smoothie'];
  SELECT id INTO pid FROM products WHERE slug = 'cheesecake-lotus';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'Maracuja Splash', 'arabic-coffee'];
  SELECT id INTO pid FROM products WHERE slug = 'cheesecake-dubai';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['oreo-milkshake', 'iced-mocha', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'cheesecake-oreo';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['Espresso', 'hot-chocolate', 'eis-vanille'];
  SELECT id INTO pid FROM products WHERE slug = 'molten-cake';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schokoladen-milkshake', 'Cappuccino', 'frappuccino'];
  SELECT id INTO pid FROM products WHERE slug = 'brownie-cake';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
