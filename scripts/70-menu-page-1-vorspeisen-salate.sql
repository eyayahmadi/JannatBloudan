-- =============================================================================
-- 70 — Menu Page 1 : Vorspeisen + Salate (canonical sync, idempotent)
--
-- Updates ONLY categories entrees/salades and the 15 products listed on Page 1.
-- Does NOT delete or modify other products (e.g. gewuerzter-reis stays untouched).
-- Does NOT touch image_url, tags, variants, extras, station, or metadata flags.
-- =============================================================================

BEGIN;

-- ── Legacy name conflicts (migration 13 seeds) ─────────────────────────────
-- categories.name is UNIQUE. Deprecated slugs vorspeisen/waffel/pizza-de may
-- already hold names needed by canonical slugs entrees/waffeln/pizza.

UPDATE categories SET
  name = 'Vorspeisen [legacy]',
  is_active = false,
  description = COALESCE(description, '') || ' [deprecated — use entrees]'
WHERE slug = 'vorspeisen';

UPDATE categories SET
  name = 'Waffel [legacy]',
  is_active = false,
  description = COALESCE(description, '') || ' [deprecated — use waffeln]'
WHERE slug = 'waffel';

UPDATE categories SET
  name = 'Pizza [legacy]',
  is_active = false,
  description = COALESCE(description, '') || ' [deprecated — use pizza]'
WHERE slug = 'pizza-de';

-- ── Categories (Page 1 order) ───────────────────────────────────────────────

UPDATE categories SET
  name = 'Vorspeisen',
  name_ar = 'المقبلات',
  display_order = 10,
  is_active = true
WHERE slug = 'entrees';

UPDATE categories SET
  name = 'Salate',
  name_ar = 'السلطات',
  display_order = 20,
  is_active = true
WHERE slug = 'salades';

-- ── Vorspeisen (entrees) — products 01–11 ───────────────────────────────────

UPDATE products SET
  name = 'Hummus',
  name_ar = 'مسبحة',
  description = 'Kichererbsen paste mit Salz, Zitrone und Sesamsauce',
  price = 5.50,
  display_order = 10
WHERE slug = 'hummus';

UPDATE products SET
  name = 'Hummus mit Hackfleisch',
  name_ar = 'مسبحة مع لحمة',
  description = 'Kichererbsen paste mit Salz, Zitrone und Sesamsauce',
  price = 9.00,
  display_order = 20
WHERE slug = 'hummus-mit-hackfleisch';

UPDATE products SET
  name = 'Babağannouğ',
  name_ar = 'بابا غنوج',
  description = 'Gegrillte Auberginenpaste mit Salz, Zitrone und Sesamsauce',
  price = 5.50,
  display_order = 30
WHERE slug = 'baba-ghanoug';

UPDATE products SET
  name = 'Mutabbal',
  name_ar = 'متبل باذنجان',
  description = 'Gegrillte Auberginenpaste mit Knoblauch, Salz, Zitrone, Joghurt und Sesamsauce',
  price = 5.50,
  display_order = 40
WHERE slug = 'mutabbal';

UPDATE products SET
  name = 'Mohammara',
  name_ar = 'محمرة',
  description = 'Scharfe Paprikapaste mit Paniermehl, Walnusskerne, Zwiebeln, Knoblauch und Granatapfelsauce',
  price = 5.50,
  display_order = 50
WHERE slug = 'muhammara';

UPDATE products SET
  name = 'Veganer Weinblätter',
  name_ar = 'يالنجي ورق عنب',
  description = 'Gefüllte Weinblätter mit Reis in feiner saurer Sauce gekocht - (6 Stk.)',
  price = 7.00,
  display_order = 60
WHERE slug = 'veganer-weinblaetter';

UPDATE products SET
  name = 'Zigarrenbörek',
  name_ar = 'برك جبنة',
  description = 'Gefüllte Teigrolle mit Frischkäse, Petersilie und Eier - (4 Stk.)',
  price = 2.50,
  display_order = 70
WHERE slug = 'zigarrenburak';

UPDATE products SET
  name_ar = 'صحن بطاطا',
  price = 5.00,
  display_order = 90
WHERE slug = 'pommes-teller';

UPDATE products SET
  name = 'Chicken Nuggets',
  name_ar = 'ناغت دجاج',
  description = '6 Stück, mit Pommes',
  price = 6.50,
  display_order = 100
WHERE slug = 'chicken-nuggets-pommes';

UPDATE products SET
  name = 'Kebbeh frittiert (1 Stk.)',
  name_ar = 'كبة مقلية (1 حبة)',
  description = 'Bulgur, Hackfleisch, Walnusskerne, Granatapfelkerne und Gewürze',
  price = 4.00,
  display_order = 110
WHERE slug = 'kebbeh-frittiert';

UPDATE products SET
  name = 'Kebbeh gegrillt',
  name_ar = 'كبة مشوية',
  description = 'Bulgur, Hackfleisch, Walnusskerne, Granatapfelkerne und Gewürze',
  price = 5.00,
  display_order = 120
WHERE slug = 'gegrillte-kibbeh';

-- ── Salate (salades) — products 14–17 ───────────────────────────────────────

UPDATE products SET
  name = 'Gemichter Salat',
  name_ar = 'سلطة مشكلة',
  description = 'Eisbergsalat, Tomaten, Gurken, Zwiebeln, gewürzt mit Zitrone & Olivenöl',
  price = 7.00,
  display_order = 10
WHERE slug = 'salat';

UPDATE products SET
  name = 'Tabboleh',
  name_ar = 'تبولة',
  description = 'Feiner Bulgur, frische Petersilie, Minze, Tomaten, Frühlingszwiebeln, Gurken, gewürzt mit Zitrone, Salz & Olivenöl',
  price = 8.50,
  display_order = 20
WHERE slug = 'tabbouleh';

UPDATE products SET
  name = 'Fattosch',
  name_ar = 'فتوش',
  description = 'Römersalat mit Tomaten, Gurken, Frühlingszwiebeln, Radieschen, Petersilie, Minze, Sumack und Brötchenchips. Gewürzt mit Apfelessig, Zitrone, Salz & Olivenöl.',
  price = 7.50,
  display_order = 30
WHERE slug = 'fattoush';

UPDATE products SET
  name = 'Rucola Salat',
  name_ar = 'سلطة الجرجير',
  description = 'Rucola, Tomaten, Zwiebeln, Granatapfel, Zitronensaft & Olivenöl',
  price = 8.50,
  display_order = 40
WHERE slug = 'rucola-salat';

COMMIT;
