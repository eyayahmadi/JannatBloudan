-- 38-category-display-order.sql
-- Canonical, DB-driven category order for ALL menu surfaces
-- (QR menu, customer /menu, server & POS pickers, Admin Menu CMS).
--
-- 29 active categories; tea is inactive (products live under Hot Drinks).
-- Imperator is last. Snacks before Ice Cream.

UPDATE categories c
SET
  display_order = o.display_order,
  section       = o.section,
  name          = o.name,
  name_ar       = o.name_ar,
  is_active     = o.is_active
FROM (
  VALUES
    -- Food
    ('entrees',                'Entrées',                'المقبلات',                'food',    10,  true),
    ('salades',                'Salades',                'السلطات',                 'food',    20,  true),
    ('manakish',               'Manakish',               'المناقيش',                'food',    30,  true),
    ('plats',                  'Plats',                  'الوجبات',                 'food',    40,  true),
    ('shawarma',               'Shawarma',               'الشاورما',                'food',    50,  true),
    ('grillades',              'Grillades',              'المشاوي',                 'food',    60,  true),
    ('pizza',                  'Pizza',                  'البيتزا',                 'food',    70,  true),
    ('burgers',                'Burgers',                'البرغر',                  'food',    80,  true),
    ('sandwiches',             'Sandwiches',             'الساندويش',               'food',    90,  true),
    -- Drinks
    ('water',                  'Water',                  'المياه',                  'drinks', 100,  true),
    ('juices',                 'Juices',                 'العصائر',                 'drinks', 110,  true),
    ('soft-drinks',            'Soft Drinks',            'المشروبات الغازية',       'drinks', 120,  true),
    ('ice-tea',                'Ice Tea',                'شاي بارد',                'drinks', 130,  true),
    ('cocktails',              'Cocktails',              'كوكتيلات',                'drinks', 140,  true),
    ('smoothies',              'Smoothies',              'السموذي',                 'drinks', 150,  true),
    ('milkshakes',             'Milkshakes',             'ميلك شيك',                'drinks', 160,  true),
    ('banana-milk-cocktails',  'Banana Milk Cocktails',  'كوكتيلات موز وحليب',      'drinks', 170,  true),
    ('coffee',                 'Hot Drinks',             'مشروبات ساخنة',           'drinks', 180,  true),
    ('iced-coffee',            'Iced Coffee',            'قهوة باردة',              'drinks', 190,  true),
    -- Desserts
    ('waffeln',                'Waffles',                'وافل',                    'desserts', 200, true),
    ('crepes',                 'Crepes',                 'كريب',                    'desserts', 210, true),
    ('pancakes',               'Pancakes',               'بان كيك',                 'desserts', 220, true),
    ('fruit-salads',           'Fruit Salads',           'سلطات الفواكه',           'desserts', 230, true),
    ('snacks',                 'Snacks',                 'سناكات',                  'desserts', 240, true),
    ('ice-cream',              'Ice Cream',              'آيس كريم',                'desserts', 250, true),
    ('cheesecakes',            'Cheesecakes',            'تشيز كيك',                'desserts', 260, true),
    ('cakes',                  'Cakes',                  'تورتة',                   'desserts', 270, true),
    -- Special (Imperator last)
    ('shisha',                 'Shisha',                 'أراكيل',                  'special',  280, true),
    ('imperator',              'Imperator',              'إمبراطور',                'special',  290, true),
    -- Legacy (inactive; tea products under Hot Drinks)
    ('tea',                    'Tea',                    'الشاي',                   'drinks', 9999, false)
) AS o(slug, name, name_ar, section, display_order, is_active)
WHERE c.slug = o.slug;
