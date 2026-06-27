-- 38-category-display-order.sql
-- Canonical, DB-driven category order for ALL menu surfaces
-- (QR menu, customer /menu, server & POS pickers, Admin Menu CMS).
--
-- Ordering is read from categories.display_order everywhere; nothing is hardcoded
-- in the product lists. Admin can still reorder categories afterwards (the Admin CMS
-- writes a fresh global display_order on save) — this migration only (re)asserts the
-- canonical baseline.
--
-- Idempotent: pure UPDATE ... FROM (VALUES ...) keyed by slug. No INSERT, so it can
-- run any number of times without creating duplicate categories.

UPDATE categories c
SET
  display_order = o.display_order,
  section       = o.section,
  name          = o.name,
  name_ar       = o.name_ar
FROM (
  VALUES
    -- Food
    ('entrees',                'Entrées',                'المقبلات',                'food',    10),
    ('salades',                'Salades',                'السلطات',                 'food',    20),
    ('manakish',               'Manakish',               'المناقيش',                'food',    30),
    ('plats',                  'Plats',                  'الوجبات',                 'food',    40),
    ('shawarma',               'Shawarma',               'الشاورما',                'food',    50),
    ('grillades',              'Grillades',              'المشاوي',                 'food',    60),
    ('pizza',                  'Pizza',                  'البيتزا',                 'food',    70),
    ('burgers',                'Burgers',                'البرغر',                  'food',    80),
    ('sandwiches',             'Sandwiches',             'الساندويش',               'food',    90),
    -- Drinks
    ('water',                  'Water',                  'المياه',                  'drinks', 100),
    ('juices',                 'Juices',                 'العصائر',                 'drinks', 110),
    ('soft-drinks',            'Soft Drinks',            'المشروبات الغازية',       'drinks', 120),
    ('ice-tea',                'Ice Tea',                'الشاي المثلج',            'drinks', 130),
    ('tea',                    'Tea',                    'الشاي',                   'drinks', 140),
    ('iced-coffee',            'Iced Coffee',            'القهوة الباردة',          'drinks', 150),
    ('coffee',                 'Hot Drinks',             'المشروبات الساخنة',       'drinks', 160),
    ('cocktails',              'Cocktails',              'الكوكتيلات',              'drinks', 170),
    ('smoothies',              'Smoothies',              'السموذي',                 'drinks', 180),
    ('milkshakes',             'Milkshakes',             'الميلك شيك',              'drinks', 190),
    ('banana-milk-cocktails',  'Banana Milk Cocktails',  'كوكتيلات الموز بالحليب',  'drinks', 200),
    ('imperator',              'Imperator',              'إمبراطور',                'drinks', 210),
    -- Desserts
    ('waffeln',                'Waffeln',                'وافل',                    'desserts', 220),
    ('crepes',                 'Crêpes',                 'كريب',                    'desserts', 230),
    ('pancakes',               'Pancakes',               'بان كيك',                 'desserts', 240),
    ('fruit-salads',           'Fruit Salads',           'سلطات الفواكه',           'desserts', 250),
    ('ice-cream',              'Ice Cream',              'آيس كريم',                'desserts', 260),
    ('cheesecakes',            'Cheesecakes',            'تشيز كيك',                'desserts', 270),
    ('cakes',                  'Cakes',                  'كيك',                     'desserts', 280),
    ('snacks',                 'Snacks',                 'سناكات',                  'desserts', 290),
    -- Special
    ('shisha',                 'Shisha',                 'أراكيل',                  'special',  300)
) AS o(slug, name, name_ar, section, display_order)
WHERE c.slug = o.slug;
