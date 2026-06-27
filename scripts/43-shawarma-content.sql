-- =============================================================================
-- 43 — Shawarma : descriptions (DE/AR), tags, recommandations
-- Idempotent — 6 produits catégorie shawarma. Prix / noms / station inchangés.
-- =============================================================================

BEGIN;

-- Shawarma Arabi Teller (= Shawarma Teller traditionnel)
UPDATE products SET
  description = 'Traditioneller Shawarma-Teller mit mariniertem Hähnchenfleisch, knusprigen Pommes, frischem Salat, Knoblauchsauce und hausgemachten Beilagen.',
  description_ar = 'وجبة شاورما دجاج تقليدية تقدم مع البطاطا المقلية والسلطة الطازجة وصوص الثوم والمقبلات.',
  tags = '["halal","popular","best_seller"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shawarma-arabi-teller';

-- Shawarma Marina Teller (= Shawarma mit Käse)
UPDATE products SET
  description = 'Saftige Hähnchen-Shawarma mit geschmolzenem Käse, serviert mit Pommes, Salat und hausgemachter Knoblauchsauce.',
  description_ar = 'وجبة شاورما دجاج مع جبنة ذائبة تقدم مع البطاطا المقلية والسلطة وصوص الثوم.',
  tags = '["halal","popular","contains_milk"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shawarma-marina-teller';

-- Shawarma Frat Teller (= Shawarma Fret)
UPDATE products SET
  description = 'Geschnittene Hähnchen-Shawarma mit Pommes, frischem Salat, Gewürzgurken und verschiedenen hausgemachten Saucen.',
  description_ar = 'شاورما دجاج مقطعة تقدم مع البطاطا المقلية والسلطة والمخلل وتشكيلة من الصوصات.',
  tags = '["halal","chef_recommendation","best_seller"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'shawarma-frat-teller';

-- Shawarma Bloudan Teller
UPDATE products SET
  description = 'Spezialität des Hauses: Shawarma im Fladenbrot mit geschmolzenem Käse, Gewürzgurken und hausgemachter Sauce, anschließend goldbraun überbacken.',
  description_ar = 'اختصاص مطعم بلودان، شاورما داخل الخبز مع الجبنة الذائبة والمخلل والصوص الخاص ثم تشوى حتى تصبح ذهبية ومقرمشة.',
  tags = '["halal","chef_recommendation","best_seller","contains_milk"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = true,
  spice_level = NULL
WHERE slug = 'shawarma-bloudan-teller';

-- Shawarma Sandwich
UPDATE products SET
  description = 'Frisch gebackenes Brot gefüllt mit saftiger Hähnchen-Shawarma, Knoblauchsauce und Gewürzgurken.',
  description_ar = 'ساندويش شاورما دجاج طازج مع صوص الثوم والمخلل.',
  tags = '["halal","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'shawarma-sandwich';

-- Double Shawarma Sandwich
UPDATE products SET
  description = 'Extra großes Shawarma-Sandwich mit doppelter Portion Hähnchenfleisch, Knoblauchsauce und Gewürzgurken.',
  description_ar = 'ساندويش شاورما دبل بكمية مضاعفة من الشاورما مع صوص الثوم والمخلل.',
  tags = '["halal","best_seller","popular"]'::jsonb,
  is_popular = true, is_vegetarian = false, is_vegan = false, is_halal = true, is_chef_choice = false,
  spice_level = NULL
WHERE slug = 'double-shawarma-sandwich';

-- Recommandations
DO $$
DECLARE
  pid UUID;
  rid UUID;
  rec_slugs TEXT[];
  rec_slug TEXT;
  ord INT;
BEGIN
  rec_slugs := ARRAY['coca-cola', 'hummus', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'shawarma-arabi-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['sprite', 'pommes-teller', 'brownie-cake'];
  SELECT id INTO pid FROM products WHERE slug = 'shawarma-marina-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['mineralwasser', 'fattoush', 'waffle-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'shawarma-frat-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['coca-cola', 'pommes-teller', 'cheesecake-bloudan'];
  SELECT id INTO pid FROM products WHERE slug = 'shawarma-bloudan-teller';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'coca-cola', 'eis-vanille'];
  SELECT id INTO pid FROM products WHERE slug = 'shawarma-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;

  rec_slugs := ARRAY['pommes-teller', 'sprite', 'crepe-nature'];
  SELECT id INTO pid FROM products WHERE slug = 'double-shawarma-sandwich';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;
END $$;

COMMIT;
