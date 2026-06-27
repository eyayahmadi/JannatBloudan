-- =============================================================================
-- 40 — Salades : descriptions (DE/AR), tags, variantes Klein/Groß, recommandations
-- Idempotent — 4 produits (rucola-salat, tabbouleh, fattoush, salat).
-- =============================================================================

BEGIN;

-- Descriptions + tags (prix de base = variante Klein)
UPDATE products SET
  description = 'Frischer Rucola mit Tomaten, Zwiebeln, Granatapfelkernen, Zitronensaft und nativem Olivenöl.',
  description_ar = 'سلطة جرجير طازجة مع الطماطم والبصل وحبوب الرمان وعصير الليمون وزيت الزيتون البكر.',
  tags = '["vegetarian","vegan","halal","healthy","chef_recommendation","has_variants"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = true
WHERE slug = 'rucola-salat';

UPDATE products SET
  description = 'Traditioneller orientalischer Petersiliensalat mit feinem Bulgur, Minze, Tomaten, Frühlingszwiebeln, Gurken und frischem Zitronensaft.',
  description_ar = 'تبولة شرقية تقليدية بالبقدونس الطازج والبرغل الناعم والنعناع والطماطم والبصل الأخضر والخيار وعصير الليمون.',
  tags = '["vegetarian","vegan","halal","healthy","popular","has_variants"]'::jsonb,
  is_popular = true, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false
WHERE slug = 'tabbouleh';

UPDATE products SET
  description = 'Knackiger orientalischer Salat mit Römersalat, Tomaten, Gurken, Radieschen, Petersilie, Minze, geröstetem Brot und Sumach.',
  description_ar = 'سلطة فتوش مقرمشة مع الخس والطماطم والخيار والفجل والبقدونس والنعناع والخبز المحمص والسماق.',
  tags = '["vegetarian","vegan","halal","healthy","best_seller","has_variants"]'::jsonb,
  is_popular = true, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false
WHERE slug = 'fattoush';

UPDATE products SET
  description = 'Frischer gemischter Salat mit Eisbergsalat, Tomaten, Gurken und Olivenöl.',
  description_ar = 'سلطة خضراء طازجة مع الخس والطماطم والخيار وزيت الزيتون.',
  tags = '["vegetarian","vegan","halal","healthy","has_variants"]'::jsonb,
  is_popular = false, is_vegetarian = true, is_vegan = true, is_halal = true, is_chef_choice = false
WHERE slug = 'salat';

-- Variantes Klein / Groß (prix existants conservés)
DO $$
DECLARE
  pid UUID;
  vgid UUID;
BEGIN
  -- Rucola-Salat: Klein 6 €, Groß 10 €
  SELECT id INTO pid FROM products WHERE slug = 'rucola-salat';
  IF pid IS NOT NULL THEN
    DELETE FROM product_variants WHERE group_id IN (SELECT id FROM product_variant_groups WHERE product_id = pid);
    DELETE FROM product_variant_groups WHERE product_id = pid;
    INSERT INTO product_variant_groups (product_id, name_de, name_ar, min_selections, max_selections, display_order)
    VALUES (pid, 'Größe', 'الحجم', 1, 1, 0) RETURNING id INTO vgid;
    INSERT INTO product_variants (group_id, slug, name_de, name_ar, price, display_order) VALUES
      (vgid, 'klein', 'Klein', 'صغير', 6, 0),
      (vgid, 'gross', 'Groß', 'كبير', 10, 1);
  END IF;

  -- Tabbouleh: Klein 6 €, Groß 10 €
  SELECT id INTO pid FROM products WHERE slug = 'tabbouleh';
  IF pid IS NOT NULL THEN
    DELETE FROM product_variants WHERE group_id IN (SELECT id FROM product_variant_groups WHERE product_id = pid);
    DELETE FROM product_variant_groups WHERE product_id = pid;
    INSERT INTO product_variant_groups (product_id, name_de, name_ar, min_selections, max_selections, display_order)
    VALUES (pid, 'Größe', 'الحجم', 1, 1, 0) RETURNING id INTO vgid;
    INSERT INTO product_variants (group_id, slug, name_de, name_ar, price, display_order) VALUES
      (vgid, 'klein', 'Klein', 'صغير', 6, 0),
      (vgid, 'gross', 'Groß', 'كبير', 10, 1);
  END IF;

  -- Fattoush: Klein 6 €, Groß 9 €
  SELECT id INTO pid FROM products WHERE slug = 'fattoush';
  IF pid IS NOT NULL THEN
    DELETE FROM product_variants WHERE group_id IN (SELECT id FROM product_variant_groups WHERE product_id = pid);
    DELETE FROM product_variant_groups WHERE product_id = pid;
    INSERT INTO product_variant_groups (product_id, name_de, name_ar, min_selections, max_selections, display_order)
    VALUES (pid, 'Größe', 'الحجم', 1, 1, 0) RETURNING id INTO vgid;
    INSERT INTO product_variants (group_id, slug, name_de, name_ar, price, display_order) VALUES
      (vgid, 'klein', 'Klein', 'صغير', 6, 0),
      (vgid, 'gross', 'Groß', 'كبير', 9, 1);
  END IF;

  -- Salat: Klein 5 €, Groß 9 €
  SELECT id INTO pid FROM products WHERE slug = 'salat';
  IF pid IS NOT NULL THEN
    DELETE FROM product_variants WHERE group_id IN (SELECT id FROM product_variant_groups WHERE product_id = pid);
    DELETE FROM product_variant_groups WHERE product_id = pid;
    INSERT INTO product_variant_groups (product_id, name_de, name_ar, min_selections, max_selections, display_order)
    VALUES (pid, 'Größe', 'الحجم', 1, 1, 0) RETURNING id INTO vgid;
    INSERT INTO product_variants (group_id, slug, name_de, name_ar, price, display_order) VALUES
      (vgid, 'klein', 'Klein', 'صغير', 5, 0),
      (vgid, 'gross', 'Groß', 'كبير', 9, 1);
  END IF;
END $$;

-- Recommandations
DO $$
DECLARE
  pid UUID;
  rid UUID;
  rec_slugs TEXT[];
  rec_slug TEXT;
  ord INT;
BEGIN
  rec_slugs := ARRAY['gemischter-grillteller', 'schisch-tawouk-teller', 'mineralwasser'];
  SELECT id INTO pid FROM products WHERE slug = 'rucola-salat';
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

  rec_slugs := ARRAY['hummus', 'baba-ghanoug'];
  SELECT id INTO pid FROM products WHERE slug = 'tabbouleh';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['hummus', 'muhammara', 'coca-cola'];
  SELECT id INTO pid FROM products WHERE slug = 'fattoush';
  IF pid IS NOT NULL THEN
    DELETE FROM product_recommendations WHERE product_id = pid;
    ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP
      SELECT id INTO rid FROM products WHERE slug = rec_slug;
      IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF;
    END LOOP;
  END IF;

  rec_slugs := ARRAY['gemischter-grillteller', 'shawarma-arabi-teller', 'stillwasser'];
  SELECT id INTO pid FROM products WHERE slug = 'salat';
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
