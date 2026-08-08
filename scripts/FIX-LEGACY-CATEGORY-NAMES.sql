-- =============================================================================
-- FIX — Legacy category name conflicts (run BEFORE menu migrations if needed)
--
-- Error: duplicate key value violates unique constraint "categories_name_key"
-- Cause: migration 13 created vorspeisen/waffel/pizza-de with names that
--        canonical slugs entrees/waffeln/pizza need later.
-- Safe to re-run.
-- =============================================================================

BEGIN;

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

COMMIT;
