-- =============================================================================
-- 33 — Jannat Bloudan — Carte complète (remplace les données démo)
-- Généré par scripts/generate-jannat-menu-sql.mjs — ne pas éditer à la main
-- Source: data/jannat-bloudan-menu.json
-- =============================================================================

BEGIN;

-- Tables pour les extras (Waffle / Crêpe / Pancake Nature)
CREATE TABLE IF NOT EXISTS product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_de VARCHAR(100) NOT NULL DEFAULT 'Extras',
  name_ar VARCHAR(100),
  min_selections INT NOT NULL DEFAULT 0,
  max_selections INT NOT NULL DEFAULT 12,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES product_modifier_groups(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  name_de VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_modifier_groups_product ON product_modifier_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_modifiers_group ON product_modifiers(group_id);

-- Nettoyage des anciennes données démo
DELETE FROM product_modifiers;
DELETE FROM product_modifier_groups;
DELETE FROM product_ingredients;
DELETE FROM products;
DELETE FROM categories;


INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Entrées', 'entrees', 'Entrées', 'food', 10, true, '🥗', 'المقبلات')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Salades', 'salades', 'Salades', 'food', 20, true, '🥙', 'السلطات')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Plats', 'plats', 'Plats', 'food', 30, true, '🍽️', 'الوجبات')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Shawarma', 'shawarma', 'Shawarma', 'food', 40, true, '🌯', 'شاورما')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Grillades', 'grillades', 'Grillades', 'food', 50, true, '🔥', 'مشاوي')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Pizza', 'pizza', 'Pizza', 'food', 60, true, '🍕', 'بيتزا')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Burgers', 'burgers', 'Burgers', 'food', 70, true, '🍔', 'برغر')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Sandwiches', 'sandwiches', 'Sandwiches', 'food', 80, true, '🥪', 'ساندويتش')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Waffeln', 'waffeln', 'Waffeln', 'desserts', 10, true, '🧇', 'وافل')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Crêpes', 'crepes', 'Crêpes', 'desserts', 20, true, '🥞', 'كريب')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Pancakes', 'pancakes', 'Pancakes', 'desserts', 30, true, '🥞', 'بان كيك')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Fruit Salads', 'fruit-salads', 'Fruit Salads', 'desserts', 40, true, '🍓', 'سلطات فواكه')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Ice Cream', 'ice-cream', 'Ice Cream', 'desserts', 50, true, '🍨', 'آيس كريم')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Cheesecakes', 'cheesecakes', 'Cheesecakes', 'desserts', 60, true, '🍰', 'تشيز كيك')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Cakes', 'cakes', 'Cakes', 'desserts', 70, true, '🍫', 'كيك')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Snacks', 'snacks', 'Snacks', 'desserts', 80, true, '🥜', 'سناك')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Water', 'water', 'Water', 'drinks', 10, true, '💧', 'مياه')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Juices', 'juices', 'Juices', 'drinks', 20, true, '🧃', 'عصائر')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Soft Drinks', 'soft-drinks', 'Soft Drinks', 'drinks', 30, true, '🥤', 'مشروبات غازية')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Ice Tea', 'ice-tea', 'Ice Tea', 'drinks', 40, true, '🧊', 'شاي مثلج')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Cocktails', 'cocktails', 'Cocktails', 'drinks', 50, true, '🍹', 'كوكتيلات')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Smoothies', 'smoothies', 'Smoothies', 'drinks', 60, true, '🥤', 'سموذي')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Milkshakes', 'milkshakes', 'Milkshakes', 'drinks', 70, true, '🥛', 'ميلك شيك')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Banana Milk Cocktails', 'banana-milk-cocktails', 'Banana Milk Cocktails', 'drinks', 80, true, '🍌', 'كوكتيلات موز بالحليب')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Coffee', 'coffee', 'Coffee', 'drinks', 90, true, '☕', 'قهوة')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Tea', 'tea', 'Tea', 'drinks', 100, true, '🍵', 'شاي')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Iced Coffee', 'iced-coffee', 'Iced Coffee', 'drinks', 110, true, '🧋', 'قهوة مثلجة')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Shisha', 'shisha', 'Shisha', 'special', 10, true, '💨', 'شيشة')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;
INSERT INTO categories (name, slug, description, section, display_order, is_active, icon_emoji, name_ar)
VALUES ('Imperator', 'imperator', 'Imperator', 'special', 20, true, '💨', 'إمبيراتور')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  section = EXCLUDED.section,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  icon_emoji = EXCLUDED.icon_emoji,
  name_ar = EXCLUDED.name_ar;

DO $$
DECLARE
  cat_entrees UUID;
  cat_salades UUID;
  cat_plats UUID;
  cat_shawarma UUID;
  cat_grillades UUID;
  cat_pizza UUID;
  cat_burgers UUID;
  cat_sandwiches UUID;
  cat_waffeln UUID;
  cat_crepes UUID;
  cat_pancakes UUID;
  cat_fruit_salads UUID;
  cat_ice_cream UUID;
  cat_cheesecakes UUID;
  cat_cakes UUID;
  cat_snacks UUID;
  cat_water UUID;
  cat_juices UUID;
  cat_soft_drinks UUID;
  cat_ice_tea UUID;
  cat_cocktails UUID;
  cat_smoothies UUID;
  cat_milkshakes UUID;
  cat_banana_milk_cocktails UUID;
  cat_coffee UUID;
  cat_tea UUID;
  cat_iced_coffee UUID;
  cat_shisha UUID;
  cat_imperator UUID;
  prod_id UUID;
  grp_id UUID;
BEGIN
  SELECT id INTO cat_entrees FROM categories WHERE slug = 'entrees';
  SELECT id INTO cat_salades FROM categories WHERE slug = 'salades';
  SELECT id INTO cat_plats FROM categories WHERE slug = 'plats';
  SELECT id INTO cat_shawarma FROM categories WHERE slug = 'shawarma';
  SELECT id INTO cat_grillades FROM categories WHERE slug = 'grillades';
  SELECT id INTO cat_pizza FROM categories WHERE slug = 'pizza';
  SELECT id INTO cat_burgers FROM categories WHERE slug = 'burgers';
  SELECT id INTO cat_sandwiches FROM categories WHERE slug = 'sandwiches';
  SELECT id INTO cat_waffeln FROM categories WHERE slug = 'waffeln';
  SELECT id INTO cat_crepes FROM categories WHERE slug = 'crepes';
  SELECT id INTO cat_pancakes FROM categories WHERE slug = 'pancakes';
  SELECT id INTO cat_fruit_salads FROM categories WHERE slug = 'fruit-salads';
  SELECT id INTO cat_ice_cream FROM categories WHERE slug = 'ice-cream';
  SELECT id INTO cat_cheesecakes FROM categories WHERE slug = 'cheesecakes';
  SELECT id INTO cat_cakes FROM categories WHERE slug = 'cakes';
  SELECT id INTO cat_snacks FROM categories WHERE slug = 'snacks';
  SELECT id INTO cat_water FROM categories WHERE slug = 'water';
  SELECT id INTO cat_juices FROM categories WHERE slug = 'juices';
  SELECT id INTO cat_soft_drinks FROM categories WHERE slug = 'soft-drinks';
  SELECT id INTO cat_ice_tea FROM categories WHERE slug = 'ice-tea';
  SELECT id INTO cat_cocktails FROM categories WHERE slug = 'cocktails';
  SELECT id INTO cat_smoothies FROM categories WHERE slug = 'smoothies';
  SELECT id INTO cat_milkshakes FROM categories WHERE slug = 'milkshakes';
  SELECT id INTO cat_banana_milk_cocktails FROM categories WHERE slug = 'banana-milk-cocktails';
  SELECT id INTO cat_coffee FROM categories WHERE slug = 'coffee';
  SELECT id INTO cat_tea FROM categories WHERE slug = 'tea';
  SELECT id INTO cat_iced_coffee FROM categories WHERE slug = 'iced-coffee';
  SELECT id INTO cat_shisha FROM categories WHERE slug = 'shisha';
  SELECT id INTO cat_imperator FROM categories WHERE slug = 'imperator';
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Hummus', 'hummus', 'Klassischer Hummus mit Tahini und Olivenöl', 6, cat_entrees,
    '/placeholder.svg', 15, true, true, false,
    false, false, true, 100,
    NULL, 'حمص', 'KITCHEN', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Hummus mit Hackfleisch', 'hummus-mit-hackfleisch', 'Cremiger Hummus mit gewürztem Hackfleisch', 9, cat_entrees,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'حمص باللحمة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Baba Ghanoug', 'baba-ghanoug', 'Geräucherter Auberginen-Dip mit Tahini', 6, cat_entrees,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'بابا غنوج', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Mutabbal', 'mutabbal', 'Auberginenpüree mit Tahini und Knoblauch', 6, cat_entrees,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'متبل', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Muhammara', 'muhammara', 'Würzige Paprika-Walnuss-Paste', 5.5, cat_entrees,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'محمرة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Veganer Weinblätter', 'veganer-weinblaetter', 'Gefüllte Weinblätter mit Reis und Kräutern', 9, cat_entrees,
    '/placeholder.svg', 15, false, true, true,
    false, false, true, 100,
    NULL, 'ورق عنب', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Zigarrenburak', 'zigarrenburak', 'Knusprige Teigröllchen mit Füllung', 2.5, cat_entrees,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بورك', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Gewürzter Reis', 'gewuerzter-reis', 'Orientalisch gewürzter Reis', 6, cat_entrees,
    '/placeholder.svg', 15, false, true, true,
    false, false, true, 100,
    NULL, 'رز', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pommes Teller', 'pommes-teller', 'Goldene Pommes frites', 5, cat_entrees,
    '/placeholder.svg', 15, false, true, true,
    false, false, true, 100,
    NULL, 'بطاطا مقلية', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Chicken Nuggets + Pommes', 'chicken-nuggets-pommes', 'Knusprige Chicken Nuggets mit Pommes', 7, cat_entrees,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ناغتس مع بطاطا', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Kebbeh frittiert', 'kebbeh-frittiert', 'Frittierte Bulgur-Bällchen mit Fleischfüllung', 4.5, cat_entrees,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كبة مقلية', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Gegrillte Kibbeh', 'gegrillte-kibbeh', 'Gegrillte Kibbeh vom Grill', 5.5, cat_entrees,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كبة مشوية', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Rucola Salat Small', 'rucola-salat-small', 'Frischer Rucola-Salat — kleine Portion', 6, cat_salades,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'سلطة جرجير صغيرة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Rucola Salat Large', 'rucola-salat-large', 'Frischer Rucola-Salat — große Portion', 10, cat_salades,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'سلطة جرجير كبيرة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Tabbouleh Small', 'tabbouleh-small', 'Klassische Tabbouleh — kleine Portion', 6, cat_salades,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'تبولة صغيرة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Tabbouleh Large', 'tabbouleh-large', 'Klassische Tabbouleh — große Portion', 10, cat_salades,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'تبولة كبيرة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Fattoush Small', 'fattoush-small', 'Knackiger Fattoush-Salat — kleine Portion', 6, cat_salades,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'فتوش صغير', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Fattoush Large', 'fattoush-large', 'Knackiger Fattoush-Salat — große Portion', 9, cat_salades,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'فتوش كبير', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Grüner Salat Small', 'gruener-salat-small', 'Frischer grüner Salat — kleine Portion', 5, cat_salades,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'سلطة خضراء صغيرة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Grüner Salat Large', 'gruener-salat-large', 'Frischer grüner Salat — große Portion', 9, cat_salades,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'سلطة خضراء كبيرة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Crispy Chicken Teller', 'crispy-chicken-teller', 'Knuspriges Hähnchen mit Beilagen', 13, cat_plats,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'طبق دجاج مقرمش', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Crispy Zinger Teller', 'crispy-zinger-teller', 'Scharfes Zinger-Hähnchen mit Beilagen', 13.5, cat_plats,
    '/placeholder.svg', 15, true, false, false,
    false, false, true, 100,
    NULL, 'طبق زنجر مقرمش', 'KITCHEN', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Fajita Teller', 'fajita-teller', 'Fajita-Hähnchen mit Paprika und Zwiebeln', 13, cat_plats,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'طبق فاهيتا', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Mexicano Teller', 'mexicano-teller', 'Mexikanisch gewürztes Hähnchengericht', 13, cat_plats,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'طبق مكسيكانو', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Falafel Halloumi Teller', 'falafel-halloumi-teller', 'Falafel mit gegrilltem Halloumi', 12, cat_plats,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'طبق فلافل حلوم', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Halloumi Teller', 'halloumi-teller', 'Gegrillter Halloumi mit Beilagen', 10, cat_plats,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'طبق حلوم', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Arabischer Falafel Teller', 'arabischer-falafel-teller', 'Hausgemachter Falafel nach arabischer Art', 10, cat_plats,
    '/placeholder.svg', 15, false, true, true,
    false, false, true, 100,
    NULL, 'طبق فلافل عربي', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Chicken Fries', 'chicken-fries', 'Hähnchenstreifen mit Pommes frites', 9.5, cat_plats,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'دجاج مع بطاطا', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Frittierter Fisch Teller', 'frittierter-fisch-teller', 'Knusprig frittierter Fisch mit Beilagen', 18, cat_plats,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'طبق سمك مقلي', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Shawarma Arabi Teller', 'shawarma-arabi-teller', 'Arabisches Shawarma mit Reis und Salat', 12.5, cat_shawarma,
    '/placeholder.svg', 15, true, false, false,
    true, false, true, 100,
    NULL, 'وجبة شاورما عربي', 'KITCHEN', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Shawarma Marina Teller', 'shawarma-marina-teller', 'Shawarma Marina mit Beilagen', 10, cat_shawarma,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'وجبة شاورما مارينا', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Shawarma Bloudan Teller', 'shawarma-bloudan-teller', 'Haus-Spezialität Shawarma Bloudan', 13.5, cat_shawarma,
    '/placeholder.svg', 15, true, false, false,
    false, true, true, 100,
    NULL, 'وجبة شاورما بلودان', 'KITCHEN', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Shawarma Frat Teller', 'shawarma-frat-teller', 'Shawarma Frat mit Beilagen', 13.5, cat_shawarma,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'وجبة شاورما فرات', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Shawarma Sandwich', 'shawarma-sandwich', 'Shawarma im frischen Fladenbrot', 6, cat_shawarma,
    '/placeholder.svg', 15, true, false, false,
    false, false, true, 100,
    NULL, 'ساندويتش شاورما', 'KITCHEN', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Double Shawarma Sandwich', 'double-shawarma-sandwich', 'Doppelportion Shawarma im Sandwich', 8, cat_shawarma,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ساندويتش شاورما دبل', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Gemischter Grillteller', 'gemischter-grillteller', 'Auswahl gegrillter Fleischspezialitäten', 22, cat_grillades,
    '/placeholder.svg', 15, true, false, false,
    true, false, true, 100,
    NULL, 'مشاوي مشكلة', 'KITCHEN', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Lamm Teller', 'lamm-teller', 'Zartes Lammfleisch vom Grill', 25, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'طبق لحم غنم', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Schisch Tawouk Teller', 'schisch-tawouk-teller', 'Mariniertes Hähnchenspieß vom Grill', 18, cat_grillades,
    '/placeholder.svg', 15, true, false, false,
    false, false, true, 100,
    NULL, 'طبق شيش طاووق', 'KITCHEN', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Kebab Teller', 'kebab-teller', 'Gegrillte Kebab-Spieße mit Beilagen', 20, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'طبق كباب', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Leber Teller', 'leber-teller', 'Gegrillte Leber mit Gewürzen', 18, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'طبق كبدة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Halbes Grillhähnchen', 'halbes-grillhaehnchen', 'Halbes Hähnchen vom Grill', 16, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'نصف دجاج مشوي', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Auberginen Kebab', 'auberginen-kebab', 'Kebab mit gegrillter Aubergine', 20, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كباب باذنجان', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Lahmacun mit Käse', 'lahmacun-mit-kaese', 'Türkische Pizza mit Käse', 16, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'لحم بعجين بالجبنة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Gegrillter Fisch Teller', 'gegrillter-fisch-teller', 'Frischer Fisch vom Grill', 23, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'طبق سمك مشوي', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Gegrillter Gemüseteller', 'gegrillter-gemueseteller', 'Saisonales Grillgemüse', 12, cat_grillades,
    '/placeholder.svg', 15, false, true, true,
    false, false, true, 100,
    NULL, 'طبق خضار مشوية', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Gemischter Grill 1kg', 'gemischter-grill-1kg', 'Gemischte Grillplatte — 1 kg', 55, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'مشاوي مشكلة ١ كغ', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Kebab 1kg', 'kebab-1kg', 'Kebab — 1 kg', 50, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كباب ١ كغ', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Schisch Tawouk 1kg', 'schisch-tawouk-1kg', 'Schisch Tawouk — 1 kg', 35, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شيش طاووق ١ كغ', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Hähnchenflügel 1kg', 'haehnchenfluegel-1kg', 'Gegrillte Hähnchenflügel — 1 kg', 18, cat_grillades,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'أجنحة دجاج ١ كغ', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pizza Margherita', 'pizza-margherita', 'Tomate, Mozzarella, Basilikum', 11, cat_pizza,
    '/placeholder.svg', 15, true, true, false,
    false, false, true, 100,
    NULL, 'بيتزا مارغريتا', 'KITCHEN', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pizza Quattro Stagioni', 'pizza-quattro-stagioni', 'Vier Jahreszeiten — Schinken, Pilze, Artischocken, Oliven', 13.5, cat_pizza,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بيتزا فور سيزوني', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pizza Hollandaise', 'pizza-hollandaise', 'Mit Sauce Hollandaise und Schinken', 13.5, cat_pizza,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بيتزا هولنديز', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pizza Sucuk & Ei', 'pizza-sucuk-ei', 'Türkische Sucuk-Wurst mit Spiegelei', 12.5, cat_pizza,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بيتزا سجق وبيض', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pizza Mozzarella & Tomaten', 'pizza-mozzarella-tomaten', 'Frische Mozzarella und Tomaten', 12.5, cat_pizza,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'بيتزا موزاريلا وطماطم', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pizza Vegetarisch', 'pizza-vegetarisch', 'Mit frischem Grillgemüse', 12, cat_pizza,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'بيتزا نباتية', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pizza Putenmortadella', 'pizza-putenmortadella', 'Mit Putenmortadella', 12, cat_pizza,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بيتزا مرتديلا ديك رومي', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pizza Mexikano', 'pizza-mexikano', 'Würzig mit Jalapeños und Mais', 13.5, cat_pizza,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بيتزا مكسيكانو', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pizza Salami', 'pizza-salami', 'Klassisch mit Salami', 12.5, cat_pizza,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بيتزا سلامي', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pizza Tonno', 'pizza-tonno', 'Mit Thunfisch und Zwiebeln', 12.5, cat_pizza,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بيتزا تونة', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Klassik Burger', 'klassik-burger', 'Rindfleisch-Patty mit frischem Gemüse', 12, cat_burgers,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'برغر كلاسيك', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Cheeseburger', 'cheeseburger', 'Mit geschmolzenem Cheddar', 13.5, cat_burgers,
    '/placeholder.svg', 15, true, false, false,
    false, false, true, 100,
    NULL, 'تشيز برغر', 'KITCHEN', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Spicy Cheeseburger', 'spicy-cheeseburger', 'Scharfer Cheeseburger mit Jalapeños', 13.5, cat_burgers,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    'épicé', 'تشيز برغر حار', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Bloudan Burger', 'bloudan-burger', 'Haus-Spezialität Burger Bloudan', 17, cat_burgers,
    '/placeholder.svg', 15, true, false, false,
    false, true, true, 100,
    NULL, 'برغر بلودان', 'KITCHEN', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Crispy Chicken Burger', 'crispy-chicken-burger', 'Knuspriges Hähnchen im Burger', 12, cat_burgers,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'برغر دجاج مقرمش', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Crispy Chicken', 'crispy-chicken-sandwich', 'Knuspriges Hähnchen-Sandwich', 10, cat_sandwiches,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'دجاج مقرمش', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Zinger', 'zinger-sandwich', 'Scharfes Zinger-Sandwich', 10, cat_sandwiches,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'زنجر', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Fajita', 'fajita-sandwich', 'Fajita-Sandwich mit Paprika', 10, cat_sandwiches,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'فاهيتا', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Mexicano', 'mexicano-sandwich', 'Mexikanisch gewürztes Sandwich', 10, cat_sandwiches,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'مكسيكانو', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Falafel', 'falafel-sandwich', 'Falafel im frischen Brot', 7, cat_sandwiches,
    '/placeholder.svg', 15, false, true, true,
    false, false, true, 100,
    NULL, 'فلافل', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Schaschlik', 'schaschlik-sandwich', 'Schaschlik-Spieß im Sandwich', 10, cat_sandwiches,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شاشليك', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Kebab', 'kebab-sandwich', 'Kebab im Fladenbrot', 10, cat_sandwiches,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كباب', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Lammfleisch', 'lammfleisch-sandwich', 'Lammfleisch-Sandwich', 12, cat_sandwiches,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'لحم غنم', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Lammleber', 'lammleber-sandwich', 'Lammleber im Sandwich', 8, cat_sandwiches,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كبدة غنم', 'KITCHEN', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Waffle Nature', 'waffle-nature', 'Frische Waffel — wählen Sie Ihre Extras', 6, cat_waffeln,
    '/placeholder.svg', 15, true, false, false,
    false, false, true, 100,
    NULL, 'وافل طبيعي', 'BAR', '["customizable","popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Crêpe Nature', 'crepe-nature', 'Frischer Crêpe — wählen Sie Ihre Extras', 6, cat_crepes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كريب طبيعي', 'BAR', '["customizable"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pancake Nature', 'pancake-nature', 'Fluffige Pancakes — wählen Sie Ihre Extras', 6, cat_pancakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بان كيك طبيعي', 'BAR', '["customizable"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Bloudan', 'fruit-salad-bloudan', 'Fruchtsalat Spezialität Bloudan', 15, cat_fruit_salads,
    '/placeholder.svg', 15, true, false, false,
    false, false, true, 100,
    NULL, 'بلودان', 'BAR', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Lotus', 'fruit-salad-lotus', 'Fruchtsalat mit Lotus', 9, cat_fruit_salads,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'لوتس', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Dubai', 'fruit-salad-dubai', 'Fruchtsalat Dubai Style', 11, cat_fruit_salads,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'دبي', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Coupe Arabe', 'coupe-arabe', 'Arabisches Eisbecher-Spezial', 7, cat_ice_cream,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كوب عربي', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Vanille', 'eis-vanille', 'Vanilleeis', 5.5, cat_ice_cream,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'فانيليا', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Fraise', 'eis-fraise', 'Erdbeereis', 5.5, cat_ice_cream,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'فراولة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Chocolat', 'eis-chocolat', 'Schokoladeneis', 5.5, cat_ice_cream,
    '/placeholder.svg', 15, false, true, false,
    false, false, true, 100,
    NULL, 'شوكولاتة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Bloudan', 'cheesecake-bloudan', 'Cheesecake Spezialität Bloudan', 7.5, cat_cheesecakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بلودان', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Lotus', 'cheesecake-lotus', 'Cheesecake mit Lotus', 6, cat_cheesecakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'لوتس', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Dubai', 'cheesecake-dubai', 'Cheesecake Dubai Style', 7, cat_cheesecakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'دبي', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Oreo', 'cheesecake-oreo', 'Cheesecake mit Oreo', 6, cat_cheesecakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'أوريو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Molten Cake', 'molten-cake', 'Warmer Schokoladen-Lavakuchen', 5.5, cat_cakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'مولتن كيك', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Brownie Cake', 'brownie-cake', 'Saftiger Brownie-Kuchen', 6.5, cat_cakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كيك براوني', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Chips & Noix', 'chips-noix', 'Chips mit gemischten Nüssen', 5, cat_snacks,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شيبس ومكسرات', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Noix', 'noix', 'Gemischte Nüsse', 6, cat_snacks,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'مكسرات', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Still Water 0.25L', 'still-water-025', 'Stilles Wasser 0,25 L', 2.5, cat_water,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'مياه طبيعية صغيرة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Still Water 0.75L', 'still-water-075', 'Stilles Wasser 0,75 L', 4, cat_water,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'مياه طبيعية كبيرة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Mineral Water 0.25L', 'mineral-water-025', 'Mineralwasser 0,25 L', 2.5, cat_water,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'مياه غازية صغيرة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Mineral Water 0.75L', 'mineral-water-075', 'Mineralwasser 0,75 L', 4, cat_water,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'مياه غازية كبيرة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Ananassaft', 'ananassaft', 'Frischer Ananassaft', 4, cat_juices,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'عصير أناناس', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Apfelsaft', 'apfelsaft', 'Frischer Apfelsaft', 4, cat_juices,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'عصير تفاح', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Orangensaft', 'orangensaft', 'Frischer Orangensaft', 4, cat_juices,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'عصير برتقال', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Mangosaft', 'mangosaft', 'Frischer Mangosaft', 4, cat_juices,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'عصير مانجو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Erdbeersaft', 'erdbeersaft', 'Frischer Erdbeersaft', 4, cat_juices,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'عصير فراولة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Maracujasaft', 'maracujasaft', 'Frischer Maracujasaft', 4, cat_juices,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'عصير باشن فروت', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Kiba (Kirsche & Banane)', 'kiba', 'Kiba — Kirsche und Banane', 4, cat_juices,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كيبا (كرز وموز)', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Coca-Cola', 'coca-cola', 'Coca-Cola 0,33 L', 4, cat_soft_drinks,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كوكا كولا', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Coca-Cola Zero', 'coca-cola-zero', 'Coca-Cola Zero 0,33 L', 4, cat_soft_drinks,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كوكا كولا زيرو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Fanta', 'fanta', 'Fanta Orange 0,33 L', 4, cat_soft_drinks,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'فانتا', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Sprite', 'sprite', 'Sprite 0,33 L', 4, cat_soft_drinks,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'سبرايت', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Red Bull', 'red-bull', 'Red Bull Energy Drink', 4, cat_soft_drinks,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ريد بول', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Red Bull Sugar Free', 'red-bull-sugar-free', 'Red Bull Sugarfree', 4, cat_soft_drinks,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ريد بول بدون سكر', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Red Bull White Edition', 'red-bull-white', 'Red Bull White Edition', 4, cat_soft_drinks,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ريد بول وايت', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Eistee Pfirsich', 'eistee-pfirsich', 'Eistee Pfirsichgeschmack', 4, cat_ice_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شاي مثلج خوخ', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Eistee Zitrone', 'eistee-zitrone', 'Eistee Zitronengeschmack', 4, cat_ice_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شاي مثلج ليمون', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Eistee Wassermelone', 'eistee-wassermelone', 'Eistee Wassermelonengeschmack', 4, cat_ice_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شاي مثلج بطيخ', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Mojito', 'mojito', 'Klassischer Mojito', 7.5, cat_cocktails,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'موهيتو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Erdbeer Mojito', 'erdbeer-mojito', 'Mojito mit frischen Erdbeeren', 7.5, cat_cocktails,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'موهيتو فراولة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Maracuja Splash', 'maracuja-splash', 'Erfrischender Maracuja-Cocktail', 7.5, cat_cocktails,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ماراكويا سبلاش', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Sweet Ananas', 'sweet-ananas', 'Süßer Ananas-Cocktail', 7.5, cat_cocktails,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'سويت أناناس', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Ipanema', 'ipanema', 'Ipanema — alkoholfrei', 7.5, cat_cocktails,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'إيبانيما', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Jamaica', 'jamaica', 'Jamaica-Cocktail', 7.5, cat_cocktails,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'جامايكا', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Bloudan Smoothie', 'bloudan-smoothie', 'Haus-Smoothie Bloudan', 8, cat_smoothies,
    '/placeholder.svg', 15, true, false, false,
    false, false, true, 100,
    NULL, 'سموذي بلودان', 'BAR', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Mango Smoothie', 'mango-smoothie', 'Cremiger Mango-Smoothie', 6.5, cat_smoothies,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'سموذي مانجو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Erdbeer Smoothie', 'erdbeer-smoothie', 'Frischer Erdbeer-Smoothie', 6.5, cat_smoothies,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'سموذي فراولة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Ananas Smoothie', 'ananas-smoothie', 'Tropischer Ananas-Smoothie', 6.5, cat_smoothies,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'سموذي أناناس', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Polo Smoothie (Zitrone & Minze)', 'polo-smoothie', 'Erfrischender Zitrone-Minze-Smoothie', 7.5, cat_smoothies,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'سموذي بولو (ليمون ونعناع)', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Bloudan Milkshake', 'bloudan-milkshake', 'Haus-Milkshake Bloudan', 9, cat_milkshakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ميلك شيك بلودان', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Erdbeer Milkshake', 'erdbeer-milkshake', 'Cremiger Erdbeer-Milkshake', 7, cat_milkshakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ميلك شيك فراولة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Schokoladen Milkshake', 'schokoladen-milkshake', 'Schokoladen-Milkshake', 7, cat_milkshakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ميلك شيك شوكولاتة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Oreo Milkshake', 'oreo-milkshake', 'Milkshake mit Oreo-Keksen', 7.5, cat_milkshakes,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ميلك شيك أوريو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Banane, Milch & Avocado', 'banane-milch-avocado', 'Bananen-Milch-Cocktail mit Avocado', 7.5, cat_banana_milk_cocktails,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'موز، حليب وأفوكادو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Banane, Milch & Erdbeere', 'banane-milch-erdbeere', 'Bananen-Milch-Cocktail mit Erdbeere', 7.5, cat_banana_milk_cocktails,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'موز، حليب وفراولة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Banane, Milch & Schokolade', 'banane-milch-schokolade', 'Bananen-Milch-Cocktail mit Schokolade', 7.5, cat_banana_milk_cocktails,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'موز، حليب وشوكولاتة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Arabic Coffee', 'arabic-coffee', 'Traditioneller arabischer Kaffee', 3, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'قهوة عربية', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Espresso', 'espresso', 'Espresso', 3, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'إسبريسو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Espresso Macchiato', 'espresso-macchiato', 'Espresso mit Milchschaum', 3.5, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'إسبريسو ماكياتو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Cappuccino', 'cappuccino', 'Cappuccino', 4, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'كابتشينو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Latte Macchiato', 'latte-macchiato', 'Latte Macchiato', 4.5, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'لاتيه ماكياتو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Chocolate Latte', 'chocolate-latte', 'Schokoladen-Latte', 5, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'لاتيه شوكولاتة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Vanilla Latte', 'vanilla-latte', 'Vanille-Latte', 5, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'لاتيه فانيليا', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Caramel Latte', 'caramel-latte', 'Karamell-Latte', 5, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'لاتيه كراميل', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Al Pacchino', 'al-pacchino', 'Al Pacchino — Haus-Spezialität', 4.5, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'آل باتشينو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Americano', 'americano', 'Caffè Americano', 3, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'أمريكانو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Flat White', 'flat-white', 'Flat White', 4.5, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'فلات وايت', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Mocha', 'mocha', 'Mocha mit Schokolade', 4.5, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'موكا', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Hot Chocolate', 'hot-chocolate', 'Heiße Schokolade', 4, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شوكولاتة ساخنة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Sahlab', 'sahlab', 'Traditionelles Sahlab-Getränk', 3.5, cat_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'سحلب', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Black Tea', 'black-tea', 'Schwarzer Tee', 3, cat_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شاي أسود', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Black Tea Pot', 'black-tea-pot', 'Schwarzer Tee — Teekanne', 8, cat_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'إبريق شاي أسود', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Green Tea', 'green-tea', 'Grüner Tee', 3, cat_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شاي أخضر', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Green Tea Pot', 'green-tea-pot', 'Grüner Tee — Teekanne', 8, cat_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'إبريق شاي أخضر', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Ginger Lemon Tea', 'ginger-lemon-tea', 'Ingwer-Zitronen-Tee', 3, cat_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شاي زنجبيل وليمون', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Ginger Lemon Tea Pot', 'ginger-lemon-tea-pot', 'Ingwer-Zitronen-Tee — Teekanne', 8, cat_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'إبريق شاي زنجبيل وليمون', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Chamomile Tea', 'chamomile-tea', 'Kamillentee', 3, cat_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شاي بابونج', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Chamomile Tea Pot', 'chamomile-tea-pot', 'Kamillentee — Teekanne', 8, cat_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'إبريق شاي بابونج', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Mate', 'mate', 'Mate-Tee', 5.5, cat_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ماتيه', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Cumin Lemon Tea', 'cumin-lemon-tea', 'Kreuzkümmel-Zitronen-Tee', 3.5, cat_tea,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'شاي كمون وليمون', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Iced Latte Macchiato', 'iced-latte-macchiato', 'Eiskalter Latte Macchiato', 6, cat_iced_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'آيس لاتيه ماكياتو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Iced Latte Chocolate', 'iced-latte-chocolate', 'Eiskalter Schokoladen-Latte', 6.5, cat_iced_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'آيس لاتيه شوكولاتة', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Iced Latte Vanilla', 'iced-latte-vanilla', 'Eiskalter Vanille-Latte', 6.5, cat_iced_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'آيس لاتيه فانيليا', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Iced Latte Caramel', 'iced-latte-caramel', 'Eiskalter Karamell-Latte', 6.5, cat_iced_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'آيس لاتيه كراميل', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Frappuccino', 'frappuccino', 'Frappuccino', 7, cat_iced_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'فرابتشينو', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Iced Mocha', 'iced-mocha', 'Eiskalter Mocha', 6.5, cat_iced_coffee,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'آيس موكا', 'BAR', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Bloudan', 'shisha-bloudan', 'Shisha Spezialität Bloudan', 20, cat_shisha,
    '/placeholder.svg', 15, true, false, false,
    false, false, true, 100,
    NULL, 'بلودان', 'SHISHA', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Double Apple', 'shisha-double-apple', 'Klassisches Doppel-Apfel-Aroma', 15, cat_shisha,
    '/placeholder.svg', 15, true, false, false,
    false, false, true, 100,
    NULL, 'تفاحتين', 'SHISHA', '["popular"]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Grape Mint', 'shisha-grape-mint', 'Traube mit Minze', 15, cat_shisha,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'عنب ونعناع', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Love 66', 'shisha-love-66', 'Love 66 Aroma', 15, cat_shisha,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'لوف ٦٦', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Cinderella', 'shisha-cinderella', 'Cinderella Aroma', 15, cat_shisha,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'سندريلا', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Watermelon', 'shisha-watermelon', 'Wassermelonen-Aroma', 15, cat_shisha,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بطيخ', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Raffaello', 'shisha-raffaello', 'Raffaello Aroma', 20, cat_shisha,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'رافايلو', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Fruits', 'shisha-fruits', 'Fruchtmix-Aroma', 15, cat_shisha,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'فواكه', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Polo', 'shisha-polo', 'Polo Aroma', 15, cat_shisha,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بولو', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Shisha Royale', 'shisha-royale', 'Premium Shisha Royale', 55, cat_shisha,
    '/placeholder.svg', 15, false, false, false,
    true, false, true, 100,
    NULL, 'شيشة رويال', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Avoca Free', 'imperator-avoca-free', 'Imperator Tabak — Avoca Free', 14, cat_imperator,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'أفوكا فري', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Pinastro Flix', 'imperator-pinastro-flix', 'Imperator Tabak — Pinastro Flix', 13, cat_imperator,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'بيناسترو فليكس', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'X4', 'imperator-x4', 'Imperator Tabak — X4', 13, cat_imperator,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'إكس ٤', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;
  INSERT INTO products (
    name, slug, description, price, category_id, image_url,
    preparation_time, is_popular, is_vegetarian, is_vegan,
    is_chef_choice, is_recommended, is_available, stock_quantity,
    spice_level, name_ar, station, tags
  ) VALUES (
    'Thundermix', 'imperator-thundermix', 'Imperator Tabak — Thundermix', 13, cat_imperator,
    '/placeholder.svg', 15, false, false, false,
    false, false, true, 100,
    NULL, 'ثاندرميكس', 'SHISHA', '[]'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    station = EXCLUDED.station,
    is_popular = EXCLUDED.is_popular,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_chef_choice = EXCLUDED.is_chef_choice,
    is_recommended = EXCLUDED.is_recommended,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url;

  -- Extras pour Waffle / Crêpe / Pancake Nature
  SELECT id INTO prod_id FROM products WHERE slug = 'waffle-nature';
  IF prod_id IS NOT NULL THEN
    INSERT INTO product_modifier_groups (product_id, name_de, name_ar, min_selections, max_selections, display_order)
    VALUES (prod_id, 'Extras', 'إضافات', 0, 12, 0)
    RETURNING id INTO grp_id;
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-nutella', 'Nutella', 'نوتيلا', 2, 1);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-oreo', 'Oreo', 'أوريو', 2, 2);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-lotus', 'Lotus', 'لوتس', 2, 3);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-kinder', 'Kinder', 'كيندر', 2, 4);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-white-chocolate', 'White Chocolate', 'شوكولاتة بيضاء', 2, 5);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-brownie', 'Brownie', 'براوني', 2.5, 6);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-pistachio', 'Pistachio', 'فستق', 2.5, 7);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-banana', 'Banana', 'موز', 1.5, 8);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-strawberry', 'Strawberry', 'فراولة', 1.5, 9);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-vanilla-ice-cream', 'Vanilla Ice Cream', 'آيس كريم فانيليا', 2, 10);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-chocolate-ice-cream', 'Chocolate Ice Cream', 'آيس كريم شوكولاتة', 2, 11);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-chocolate-sauce', 'Extra Chocolate Sauce', 'صوص شوكولاتة إضافي', 1, 12);
  END IF;
  SELECT id INTO prod_id FROM products WHERE slug = 'crepe-nature';
  IF prod_id IS NOT NULL THEN
    INSERT INTO product_modifier_groups (product_id, name_de, name_ar, min_selections, max_selections, display_order)
    VALUES (prod_id, 'Extras', 'إضافات', 0, 12, 0)
    RETURNING id INTO grp_id;
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-nutella', 'Nutella', 'نوتيلا', 2, 1);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-oreo', 'Oreo', 'أوريو', 2, 2);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-lotus', 'Lotus', 'لوتس', 2, 3);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-kinder', 'Kinder', 'كيندر', 2, 4);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-white-chocolate', 'White Chocolate', 'شوكولاتة بيضاء', 2, 5);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-brownie', 'Brownie', 'براوني', 2.5, 6);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-pistachio', 'Pistachio', 'فستق', 2.5, 7);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-banana', 'Banana', 'موز', 1.5, 8);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-strawberry', 'Strawberry', 'فراولة', 1.5, 9);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-vanilla-ice-cream', 'Vanilla Ice Cream', 'آيس كريم فانيليا', 2, 10);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-chocolate-ice-cream', 'Chocolate Ice Cream', 'آيس كريم شوكولاتة', 2, 11);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-chocolate-sauce', 'Extra Chocolate Sauce', 'صوص شوكولاتة إضافي', 1, 12);
  END IF;
  SELECT id INTO prod_id FROM products WHERE slug = 'pancake-nature';
  IF prod_id IS NOT NULL THEN
    INSERT INTO product_modifier_groups (product_id, name_de, name_ar, min_selections, max_selections, display_order)
    VALUES (prod_id, 'Extras', 'إضافات', 0, 12, 0)
    RETURNING id INTO grp_id;
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-nutella', 'Nutella', 'نوتيلا', 2, 1);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-oreo', 'Oreo', 'أوريو', 2, 2);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-lotus', 'Lotus', 'لوتس', 2, 3);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-kinder', 'Kinder', 'كيندر', 2, 4);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-white-chocolate', 'White Chocolate', 'شوكولاتة بيضاء', 2, 5);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-brownie', 'Brownie', 'براوني', 2.5, 6);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-pistachio', 'Pistachio', 'فستق', 2.5, 7);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-banana', 'Banana', 'موز', 1.5, 8);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-strawberry', 'Strawberry', 'فراولة', 1.5, 9);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-vanilla-ice-cream', 'Vanilla Ice Cream', 'آيس كريم فانيليا', 2, 10);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-chocolate-ice-cream', 'Chocolate Ice Cream', 'آيس كريم شوكولاتة', 2, 11);
    INSERT INTO product_modifiers (group_id, slug, name_de, name_ar, price, display_order)
    VALUES (grp_id, 'extra-chocolate-sauce', 'Extra Chocolate Sauce', 'صوص شوكولاتة إضافي', 1, 12);
  END IF;
END $$;

COMMIT;
