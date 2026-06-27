-- 50 — Banana Milk, Iced Coffee, Hot Drinks
BEGIN;

UPDATE products SET
  description = 'Cremiger Cocktail aus Banane, frischer Milch und Avocado.',
  description_ar = 'كوكتيل كريمي بالموز والحليب والأفوكادو.',
  tags = '["halal","contains_milk","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'banane-milch-avocado';

UPDATE products SET
  description = 'Fruchtiger Milchcocktail mit Banane und Erdbeeren.',
  description_ar = 'كوكتيل حليب بالموز والفراولة الطازجة.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'banane-milch-erdbeere';

UPDATE products SET
  description = 'Cremiger Bananen-Milchcocktail mit Schokolade.',
  description_ar = 'كوكتيل حليب بالموز والشوكولا.',
  tags = '["halal","contains_milk","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'banane-milch-schokolade';

UPDATE products SET
  description = 'Eiskalter Latte Macchiato mit cremigem Milchschaum.',
  description_ar = 'لاتيه ماكياتو بارد مع رغوة حليب كريمية.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'iced-latte-macchiato';

UPDATE products SET
  description = 'Kalter Latte mit feiner Schokolade.',
  description_ar = 'لاتيه بارد بنكهة الشوكولا.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'iced-latte-chocolate';

UPDATE products SET
  description = 'Erfrischender Latte mit Vanillearoma.',
  description_ar = 'لاتيه بارد بنكهة الفانيليا.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'iced-latte-vanilla';

UPDATE products SET
  description = 'Kalter Latte mit süßem Karamell.',
  description_ar = 'لاتيه بارد بنكهة الكراميل.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'iced-latte-caramel';

UPDATE products SET
  description = 'Cremiger Frappuccino mit Eis und Kaffee.',
  description_ar = 'فرابتشينو كريمي بالقهوة والثلج.',
  tags = '["halal","contains_milk","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'frappuccino';

UPDATE products SET
  description = 'Eiskalter Kaffee mit Schokolade.',
  description_ar = 'آيس موكا بالقهوة والشوكولا.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'iced-mocha';

UPDATE products SET
  description = 'Traditioneller arabischer Kaffee mit intensivem Aroma.',
  description_ar = 'قهوة عربية أصيلة تقدم ساخنة.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'arabic-coffee';

UPDATE products SET
  description = 'Kräftiger italienischer Espresso.',
  description_ar = 'إسبريسو مركز وغني بالنكهة.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'espresso';

UPDATE products SET
  description = 'Espresso mit feinem Milchschaum.',
  description_ar = 'إسبريسو مع رغوة حليب خفيفة.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'espresso-macchiato';

UPDATE products SET
  description = 'Cremiger Cappuccino mit Milchschaum.',
  description_ar = 'كابتشينو كريمي مع رغوة الحليب.',
  tags = '["halal","contains_milk","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'cappuccino';

UPDATE products SET
  description = 'Klassischer Latte Macchiato mit cremigem Milchschaum.',
  description_ar = 'لاتيه ماكياتو كلاسيكي برغوة حليب كريمية.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'latte-macchiato';

UPDATE products SET
  description = 'Heißer Latte mit feiner Schokolade.',
  description_ar = 'لاتيه ساخن بالشوكولا.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'chocolate-latte';

UPDATE products SET
  description = 'Latte mit feinem Vanillearoma.',
  description_ar = 'لاتيه ساخن بالفانيليا.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'vanilla-latte';

UPDATE products SET
  description = 'Latte mit cremigem Karamell.',
  description_ar = 'لاتيه ساخن بنكهة الكراميل.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'caramel-latte';

UPDATE products SET
  description = 'Hausgemachte Kaffeespezialität mit cremigem Geschmack.',
  description_ar = 'مشروب قهوة خاص بالمطعم بقوام كريمي.',
  tags = '["halal","contains_milk","chef_recommendation"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'al-pacchino';

UPDATE products SET
  description = 'Klassischer Americano aus frisch gebrühtem Espresso.',
  description_ar = 'قهوة أمريكانو كلاسيكية.',
  tags = '["halal"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'americano';

UPDATE products SET
  description = 'Kräftiger Espresso mit samtiger Milch.',
  description_ar = 'فلات وايت بقهوة قوية وحليب كريمي.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'flat-white';

UPDATE products SET
  description = 'Warmer Kaffee mit Schokolade.',
  description_ar = 'قهوة موكا بالشوكولا.',
  tags = '["halal","contains_milk"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'mocha';

UPDATE products SET
  description = 'Heiße cremige Schokolade.',
  description_ar = 'شوكولا ساخنة كريمية.',
  tags = '["halal","contains_milk","kids_friendly"]'::jsonb,
  is_popular = false, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'hot-chocolate';

UPDATE products SET
  description = 'Traditioneller orientalischer Sahlab mit Zimt.',
  description_ar = 'سحلب شرقي ساخن مع القرفة.',
  tags = '["halal","contains_milk","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'sahlab';

DO $$
DECLARE pid UUID; rid UUID; rec_slugs TEXT[]; rec_slug TEXT; ord INT;
BEGIN
  rec_slugs := ARRAY['waffle-nature', 'cheesecake-bloudan', 'shisha-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'banane-milch-avocado';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'cheesecake-oreo', 'shisha-love-66'];
  SELECT id INTO pid FROM products WHERE slug = 'banane-milch-erdbeere';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['brownie-cake', 'waffle-nature', 'cheesecake-oreo'];
  SELECT id INTO pid FROM products WHERE slug = 'banane-milch-schokolade';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'cheesecake-oreo', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'iced-latte-macchiato';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['brownie-cake', 'cheesecake-oreo', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'iced-latte-chocolate';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['cheesecake-lotus', 'crepe-nature', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'iced-latte-vanilla';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['brownie-cake', 'cheesecake-dubai', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'iced-latte-caramel';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'cheesecake-bloudan', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'frappuccino';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['brownie-cake', 'cheesecake-oreo', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'iced-mocha';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schwarzer-tee', 'noix', 'shisha-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'arabic-coffee';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['cheesecake-bloudan', 'brownie-cake', 'cheesecake-oreo'];
  SELECT id INTO pid FROM products WHERE slug = 'espresso';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['brownie-cake', 'waffle-nature', 'cheesecake-oreo'];
  SELECT id INTO pid FROM products WHERE slug = 'espresso-macchiato';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'brownie-cake', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'cappuccino';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['waffle-nature', 'cheesecake-oreo', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'latte-macchiato';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['brownie-cake', 'waffle-nature', 'cheesecake-oreo'];
  SELECT id INTO pid FROM products WHERE slug = 'chocolate-latte';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'waffle-nature', 'cheesecake-lotus'];
  SELECT id INTO pid FROM products WHERE slug = 'vanilla-latte';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['brownie-cake', 'cheesecake-oreo', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'caramel-latte';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['cheesecake-bloudan', 'brownie-cake', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'al-pacchino';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['cheesecake-oreo', 'brownie-cake', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'americano';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['crepe-nature', 'cheesecake-bloudan', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'flat-white';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['brownie-cake', 'cheesecake-oreo', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'mocha';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['waffle-nature', 'brownie-cake', 'cheesecake-lotus'];
  SELECT id INTO pid FROM products WHERE slug = 'hot-chocolate';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['schwarzer-tee', 'brownie-cake', 'shisha-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'sahlab';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
