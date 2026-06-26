-- =============================================================================
-- 13 — Menu digital (sections), métadonnées produit, stock par recette
-- Exécuter après 01, 03 (RPC), 06 (ingredients + product_ingredients).
-- =============================================================================

-- Sections de carte : food | desserts | drinks | special
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS section VARCHAR(32) NOT NULL DEFAULT 'food';
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_ar VARCHAR(200);
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS icon_emoji VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_categories_section ON categories (section, display_order);

COMMENT ON COLUMN categories.section IS 'food | desserts | drinks | special';

-- Produits : libellé arabe, tags JSON, metas UX
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS name_ar VARCHAR(200);
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_chef_choice BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN products.tags IS 'ex: ["popular","spicy","vegetarian","new"]';

-- Décrémentation stock pour toute la commande (ingrédients ou stock produit legacy)
CREATE OR REPLACE FUNCTION public.decrement_stock_for_order(p_order_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  li RECORD;
  r RECORD;
  v_need NUMERIC;
  v_stock NUMERIC;
BEGIN
  FOR li IN
    SELECT product_id, quantity::integer AS q
    FROM order_items
    WHERE order_id = p_order_id AND product_id IS NOT NULL
  LOOP
    IF li.q <= 0 THEN
      CONTINUE;
    END IF;

    IF EXISTS (SELECT 1 FROM product_ingredients WHERE product_id = li.product_id) THEN
      FOR r IN
        SELECT pi.ingredient_id, pi.quantity AS need_per_unit
        FROM product_ingredients pi
        WHERE pi.product_id = li.product_id
      LOOP
        v_need := r.need_per_unit * li.q;
        SELECT i.stock_quantity INTO v_stock
        FROM ingredients i
        WHERE i.id = r.ingredient_id
        FOR UPDATE;
        IF v_stock IS NULL THEN
          RAISE EXCEPTION 'ingredient_inconnu %', r.ingredient_id;
        END IF;
        IF v_stock < v_need THEN
          RAISE EXCEPTION 'stock_ingredient_insuffisant %', r.ingredient_id;
        END IF;
        UPDATE ingredients
        SET stock_quantity = stock_quantity - v_need
        WHERE id = r.ingredient_id;
        INSERT INTO stock_movements (
          ingredient_id, movement_type, quantity, unit_cost, reason,
          reference_id, reference_type, performed_by
        ) VALUES (
          r.ingredient_id, 'out', v_need, NULL,
          'Commande ' || p_order_id::text,
          p_order_id, 'order', p_user_id
        );
      END LOOP;
    ELSE
      UPDATE products
      SET stock_quantity = stock_quantity - li.q
      WHERE id = li.product_id AND stock_quantity >= li.q;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'stock_produit_insuffisant %', li.product_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.decrement_stock_for_order IS
  'Décrémente ingrédients (recette) ou produits.stock_quantity ; mouvements liés order';

-- Exemple de structure (Allemand) : à adapter / dupliquer pour chaque ligne réelle.
-- Idempotent et sûr à rejouer : `categories` possède DEUX contraintes uniques
-- (name → categories_name_key, slug → categories_slug_key). Un simple
-- ON CONFLICT (slug) ne couvre pas un doublon sur `name` et provoque l'erreur
-- « duplicate key value violates unique constraint "categories_name_key" ».
-- On met donc à jour les catégories déjà présentes (clé = name) et on n'insère
-- que celles dont NI le name NI le slug n'existent encore — les IDs existants
-- sont préservés.
WITH seed(name, slug, description, section, display_order, is_active, icon_emoji) AS (
  VALUES
    ('Vorspeisen',  'vorspeisen',  'Starters',     'food',     10, true, '🥗'),
    ('Pizza',       'pizza-de',    'Pizza & Ofen', 'food',     40, true, '🍕'),
    ('Waffel',      'waffel',      'Dessert',      'desserts', 10, true, '🧇'),
    ('Soft drinks', 'soft-drinks', 'Softs',        'drinks',   10, true, '🥤'),
    ('Shisha',      'shisha',      'Lounge',       'special',   1, true, '💨')
),
upd AS (
  UPDATE categories c SET
    section       = s.section,
    display_order = s.display_order,
    icon_emoji    = s.icon_emoji,
    slug          = COALESCE(NULLIF(c.slug, ''), s.slug)
  FROM seed s
  WHERE c.name = s.name
  RETURNING c.name
)
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji)
SELECT s.name, s.slug, s.description, s.section, s.display_order, s.is_active, s.icon_emoji
FROM seed s
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = s.name OR c.slug = s.slug
);
