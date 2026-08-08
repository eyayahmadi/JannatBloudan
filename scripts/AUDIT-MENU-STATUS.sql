-- =============================================================================
-- AUDIT — Chnou fama fel base ? (SQL Editor — read-only)
-- Run after FIX + APPLY migrations to see what exists vs hidden.
-- =============================================================================

-- 1) Totaux
SELECT 'categories' AS kind, COUNT(*) AS total FROM categories
UNION ALL
SELECT 'categories active', COUNT(*) FROM categories WHERE is_active = true AND deleted_at IS NULL
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'products available', COUNT(*) FROM products WHERE is_archived = false AND deleted_at IS NULL;

-- 2) Catégories INACTIVES (ma7toutin min el menu public — mouch deleted)
SELECT slug, name, is_active, display_order, section
FROM categories
WHERE is_active = false OR deleted_at IS NOT NULL
ORDER BY display_order, name;

-- 3) Toutes catégories ACTIVES (li ybanou QR/website)
SELECT slug, name, display_order, section, nav_group
FROM categories
WHERE is_active = true AND deleted_at IS NULL
ORDER BY display_order, name;

-- 4) Produits par catégorie active
SELECT c.slug AS category_slug, c.name AS category_name, COUNT(p.id) AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_archived = false AND p.deleted_at IS NULL
WHERE c.is_active = true AND c.deleted_at IS NULL
GROUP BY c.slug, c.name, c.display_order
ORDER BY c.display_order, c.name;

-- 5) Catégories ACTIVES sans produits (ybanou fadya)
SELECT c.slug, c.name, c.display_order
FROM categories c
WHERE c.is_active = true AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM products p
    WHERE p.category_id = c.id AND p.is_archived = false AND p.deleted_at IS NULL
  )
ORDER BY c.display_order;

-- 6) Pages menu sync (69–79) appliquées ?
SELECT filename, applied_at
FROM schema_migrations
WHERE filename LIKE '%menu-page%' OR filename LIKE '%menu-unified%' OR filename LIKE '%FIX-LEGACY%'
ORDER BY filename;
