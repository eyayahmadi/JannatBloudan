-- =============================================================================
-- Migration 57 — Wasser: Stillwasser / Mineralwasser variantes Klein · 0.25 L / Groß · 0.75 L
-- =============================================================================

BEGIN;

UPDATE products SET
  name = 'Stillwasser',
  name_ar = 'مياه معدنية',
  description = 'Natürliches stilles Mineralwasser, perfekt gekühlt und die ideale Begleitung zu jeder Mahlzeit.',
  description_ar = 'مياه معدنية طبيعية باردة، مثالية مع جميع الوجبات.',
  price = 2.5,
  tags = '["halal","vegan","vegetarian","has_variants"]'::jsonb
WHERE slug = 'stillwasser';

UPDATE products SET
  name_ar = 'مياه غازية',
  description = 'Erfrischendes Mineralwasser mit Kohlensäure.',
  description_ar = 'مياه غازية باردة ومنعشة.',
  price = 2.5,
  tags = '["halal","vegan","vegetarian","has_variants"]'::jsonb
WHERE slug = 'mineralwasser';

DO $$
DECLARE
  prod_id UUID;
  var_grp_id UUID;
BEGIN
  FOR prod_id IN SELECT id FROM products WHERE slug IN ('stillwasser', 'mineralwasser')
  LOOP
    SELECT id INTO var_grp_id
    FROM product_variant_groups
    WHERE product_id = prod_id
    ORDER BY display_order
    LIMIT 1;

    IF var_grp_id IS NULL THEN
      INSERT INTO product_variant_groups (product_id, name_de, name_ar, min_selections, max_selections, display_order)
      VALUES (prod_id, 'Größe', 'الحجم', 1, 1, 0)
      RETURNING id INTO var_grp_id;
    END IF;

    UPDATE product_variants SET
      slug = 'klein',
      name_de = 'Klein · 0.25 L',
      name_ar = 'صغير · 0.25 لتر',
      price = 2.5,
      display_order = 1,
      is_available = true
    WHERE group_id = var_grp_id AND slug IN ('klein', '025l');

    IF NOT FOUND THEN
      INSERT INTO product_variants (group_id, slug, name_de, name_ar, price, display_order, is_available)
      VALUES (var_grp_id, 'klein', 'Klein · 0.25 L', 'صغير · 0.25 لتر', 2.5, 1, true);
    END IF;

    UPDATE product_variants SET
      slug = 'gross',
      name_de = 'Groß · 0.75 L',
      name_ar = 'كبير · 0.75 لتر',
      price = 4,
      display_order = 2,
      is_available = true
    WHERE group_id = var_grp_id AND slug IN ('gross', '075l');

    IF NOT FOUND THEN
      INSERT INTO product_variants (group_id, slug, name_de, name_ar, price, display_order, is_available)
      VALUES (var_grp_id, 'gross', 'Groß · 0.75 L', 'كبير · 0.75 لتر', 4, 2, true);
    END IF;

    DELETE FROM product_variants
    WHERE group_id = var_grp_id
      AND slug NOT IN ('klein', 'gross');
  END LOOP;
END $$;

COMMIT;
