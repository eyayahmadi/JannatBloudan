-- Insertion des rôles utilisateurs (idempotent)
INSERT INTO user_roles (name, permissions) VALUES
('client', '{"can_order": true, "can_reserve": true}'::jsonb),
('serveur', '{"can_view_orders": true, "can_update_order_status": true, "can_manage_tables": true}'::jsonb),
('caissier', '{"can_view_orders": true, "can_process_payments": true, "can_view_reports": true}'::jsonb),
('admin', '{"full_access": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insertion des catégories
INSERT INTO categories (name, slug, description) VALUES
('Shawarma', 'shawarma', 'Viande marinée grillée à la broche'),
('Manakish', 'manakish', 'Pain plat libanais garni'),
('Mezzés', 'mezzes', 'Entrées froides et chaudes du Levant'),
('Plats chauds', 'plats-chauds', 'Plats principaux traditionnels'),
('Pizzas', 'pizzas', 'Pizzas italiennes variées'),
('Burgers', 'burgers', 'Burgers gourmets'),
('Desserts', 'desserts', 'Pâtisseries orientales'),
('Boissons', 'boissons', 'Boissons chaudes et froides')
ON CONFLICT (slug) DO NOTHING;

-- Récupération des IDs des catégories
DO $$
DECLARE
  cat_shawarma UUID;
  cat_manakish UUID;
  cat_mezzes UUID;
  cat_plats UUID;
  cat_pizzas UUID;
  cat_burgers UUID;
  cat_desserts UUID;
  cat_boissons UUID;
BEGIN
  SELECT id INTO cat_shawarma FROM categories WHERE slug = 'shawarma';
  SELECT id INTO cat_manakish FROM categories WHERE slug = 'manakish';
  SELECT id INTO cat_mezzes FROM categories WHERE slug = 'mezzes';
  SELECT id INTO cat_plats FROM categories WHERE slug = 'plats-chauds';
  SELECT id INTO cat_pizzas FROM categories WHERE slug = 'pizzas';
  SELECT id INTO cat_burgers FROM categories WHERE slug = 'burgers';
  SELECT id INTO cat_desserts FROM categories WHERE slug = 'desserts';
  SELECT id INTO cat_boissons FROM categories WHERE slug = 'boissons';

  -- Insertion des produits Shawarma
  INSERT INTO products (name, slug, description, price, category_id, image_url, preparation_time, calories, is_popular, stock_quantity, spice_level) VALUES
  ('Shawarma Poulet', 'shawarma-poulet', 'Poulet mariné, sauce ail, cornichons', 8.99, cat_shawarma, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400', 15, 450, true, 50, 'moyen'),
  ('Shawarma Agneau', 'shawarma-agneau', 'Agneau épicé, sauce tahini, oignons', 10.99, cat_shawarma, 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400', 15, 520, true, 40, 'épicé'),
  ('Shawarma Mixte', 'shawarma-mixte', 'Mélange poulet et agneau', 9.99, cat_shawarma, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400', 15, 485, false, 35, 'moyen')
  ON CONFLICT (slug) DO NOTHING;

  -- Manakish
  INSERT INTO products (name, slug, description, price, category_id, image_url, preparation_time, calories, is_vegetarian, is_popular, stock_quantity, spice_level) VALUES
  ('Manakish Zaatar', 'manakish-zaatar', 'Pain au zaatar et huile d''olive', 5.99, cat_manakish, 'https://images.unsplash.com/photo-1619740455993-9e67e1d42eeb?w=400', 10, 280, true, true, 60, 'doux'),
  ('Manakish Fromage', 'manakish-fromage', 'Fromage akkawi fondu', 6.99, cat_manakish, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', 10, 320, true, true, 55, 'doux'),
  ('Manakish Viande', 'manakish-viande', 'Viande hachée épicée', 7.99, cat_manakish, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 12, 380, false, false, 45, 'moyen')
  ON CONFLICT (slug) DO NOTHING;

  -- Mezzés
  INSERT INTO products (name, slug, description, price, category_id, image_url, preparation_time, calories, is_vegetarian, is_vegan, is_popular, stock_quantity, spice_level, allergens) VALUES
  ('Houmous', 'houmous', 'Purée de pois chiches, tahini, citron', 4.99, cat_mezzes, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', 5, 180, true, true, true, 80, 'doux', ARRAY['sésame']),
  ('Moutabal', 'moutabal', 'Caviar d''aubergine fumée', 5.49, cat_mezzes, 'https://images.unsplash.com/photo-1621513883944-ae1ed2ceb3d7?w=400', 5, 150, true, true, true, 70, 'doux', ARRAY['sésame']),
  ('Taboulé', 'taboule', 'Persil, tomates, boulgour, citron', 4.49, cat_mezzes, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400', 5, 120, true, true, true, 75, 'doux', ARRAY['gluten']),
  ('Falafel', 'falafel', 'Beignets de pois chiches et fèves (6 pièces)', 6.99, cat_mezzes, 'https://images.unsplash.com/photo-1594241898293-46e210f34f8d?w=400', 10, 280, true, true, true, 65, 'moyen', NULL)
  ON CONFLICT (slug) DO NOTHING;

  -- Plats chauds
  INSERT INTO products (name, slug, description, price, category_id, image_url, preparation_time, calories, is_popular, stock_quantity, spice_level) VALUES
  ('Kafta Meshwi', 'kafta-meshwi', 'Brochettes de viande hachée grillées', 12.99, cat_plats, 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400', 20, 480, true, 40, 'moyen'),
  ('Feuilles de Vigne', 'feuilles-vigne', 'Feuilles farcies au riz, tomates, épices', 6.00, cat_plats, 'https://images.unsplash.com/photo-1589301760014-ee1b6e0d3e82?w=400', 15, 220, false, 50, 'doux'),
  ('Kebbé Nayé', 'kebbe-naye', 'Tartare de viande crue, boulgour, épices', 13.00, cat_plats, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', 10, 380, false, 25, 'épicé')
  ON CONFLICT (slug) DO NOTHING;

  -- Pizzas
  INSERT INTO products (name, slug, description, price, category_id, image_url, preparation_time, calories, is_popular, is_vegetarian, stock_quantity) VALUES
  ('Pizza Margherita', 'pizza-margherita', 'Tomate, mozzarella, basilic', 11.99, cat_pizzas, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 18, 850, true, true, 45),
  ('Pizza Végétarienne', 'pizza-vegetarienne', 'Légumes grillés, mozzarella', 12.99, cat_pizzas, 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400', 18, 780, false, true, 40),
  ('Pizza 4 Fromages', 'pizza-4-fromages', 'Mozzarella, gorgonzola, parmesan, chèvre', 13.99, cat_pizzas, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', 18, 920, true, true, 35),
  ('Pizza Pepperoni', 'pizza-pepperoni', 'Tomate, mozzarella, pepperoni', 12.49, cat_pizzas, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', 18, 890, true, false, 42),
  ('Pizza Royale', 'pizza-royale', 'Tomate, mozzarella, jambon, champignons', 13.49, cat_pizzas, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 18, 910, false, false, 38)
  ON CONFLICT (slug) DO NOTHING;

  -- Burgers
  INSERT INTO products (name, slug, description, price, category_id, image_url, preparation_time, calories, is_popular, stock_quantity) VALUES
  ('Burger Classique', 'burger-classique', 'Steak haché, salade, tomate, oignon', 9.99, cat_burgers, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 15, 680, true, 50),
  ('Burger Fromage', 'burger-fromage', 'Steak haché, cheddar, cornichons', 10.99, cat_burgers, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', 15, 750, true, 48),
  ('Burger Poulet', 'burger-poulet', 'Poulet croustillant, sauce curry', 9.49, cat_burgers, 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400', 15, 620, false, 45),
  ('Burger Végétarien', 'burger-vegetarien', 'Galette de légumes, guacamole', 10.49, cat_burgers, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400', 15, 580, false, 40)
  ON CONFLICT (slug) DO NOTHING;

  -- Desserts
  INSERT INTO products (name, slug, description, price, category_id, image_url, preparation_time, calories, is_vegetarian, is_popular, stock_quantity, allergens) VALUES
  ('Baklava', 'baklava', 'Pâtisserie feuilletée aux pistaches et miel (4 pièces)', 6.99, cat_desserts, 'https://images.unsplash.com/photo-1519676867240-f9dc0ce85d81?w=400', 3, 350, true, true, 60, ARRAY['noix', 'gluten']),
  ('Kunafa', 'kunafa', 'Pâtisserie au fromage, sirop de fleur d''oranger', 7.50, cat_desserts, 'https://images.unsplash.com/photo-1612201142855-bdc217dda0f8?w=400', 5, 420, true, true, 50, ARRAY['gluten', 'lactose']),
  ('Maamoul', 'maamoul', 'Biscuits fourrés aux dattes et pistaches (6 pièces)', 5.50, cat_desserts, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 3, 280, true, false, 70, ARRAY['noix', 'gluten']),
  ('Riz au Lait', 'riz-au-lait', 'Crème de riz, eau de rose, pistaches', 4.50, cat_desserts, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400', 2, 180, true, false, 55, ARRAY['lactose', 'noix'])
  ON CONFLICT (slug) DO NOTHING;

  -- Boissons
  INSERT INTO products (name, slug, description, price, category_id, image_url, preparation_time, calories, is_vegetarian, is_vegan, stock_quantity) VALUES
  ('Thé à la Menthe', 'the-menthe', 'Thé vert infusé aux feuilles de menthe fraîche', 2.99, cat_boissons, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', 3, 20, true, true, 100),
  ('Café Turc', 'cafe-turc', 'Café traditionnel finement moulu, servi avec cardamome', 3.49, cat_boissons, 'https://images.unsplash.com/photo-1514481538271-cf9f99627ab4?w=400', 5, 5, true, true, 100),
  ('Limonade Syrienne', 'limonade-syrienne', 'Citron frais, eau de fleur d''oranger, menthe', 3.99, cat_boissons, 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f8c?w=400', 3, 80, true, true, 80),
  ('Ayran', 'ayran', 'Boisson rafraîchissante au yaourt salé', 2.99, cat_boissons, 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400', 2, 60, true, false, 90),
  ('Qamar al-Din', 'qamar-al-din', 'Jus d''abricot traditionnel syrien', 3.99, cat_boissons, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', 2, 120, true, true, 75)
  ON CONFLICT (slug) DO NOTHING;

END $$;
