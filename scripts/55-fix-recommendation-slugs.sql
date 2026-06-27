-- Fix invalid recommendation slug reference from 51-tea-waffles-crepes-content.sql
-- ('Waffel Schoko' is a display name, not a product slug).

DO $$
DECLARE
  pid UUID;
  rid UUID;
  ord INT;
BEGIN
  SELECT id INTO pid FROM products WHERE slug = 'kamille-tee';
  IF pid IS NULL THEN RETURN; END IF;

  SELECT COALESCE(MAX(display_order), -1) + 1 INTO ord
  FROM product_recommendations WHERE product_id = pid;

  SELECT id INTO rid FROM products WHERE slug = 'waffle-nature';
  IF rid IS NOT NULL AND rid <> pid AND NOT EXISTS (
    SELECT 1 FROM product_recommendations
    WHERE product_id = pid AND recommended_product_id = rid
  ) THEN
    INSERT INTO product_recommendations (product_id, recommended_product_id, display_order)
    VALUES (pid, rid, ord);
  END IF;
END $$;
