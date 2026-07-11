-- 59 — Noms produits bilingues (DE + AR) sur lignes commande / facture
-- Snapshot au moment de la commande pour KDS, caisse, tickets, historique.

ALTER TABLE IF EXISTS order_items
  ADD COLUMN IF NOT EXISTS product_name_ar VARCHAR(200);

ALTER TABLE IF EXISTS invoice_items
  ADD COLUMN IF NOT EXISTS product_name_ar VARCHAR(200);

COMMENT ON COLUMN order_items.product_name_ar IS
  'Nom arabe du produit au moment de la commande (snapshot depuis products.name_ar).';
COMMENT ON COLUMN invoice_items.product_name_ar IS
  'Nom arabe du produit sur la ligne facture (copie depuis order_items).';

-- Rétro-remplissage depuis le catalogue produits
UPDATE order_items oi
SET product_name_ar = p.name_ar
FROM products p
WHERE oi.product_id = p.id
  AND (oi.product_name_ar IS NULL OR oi.product_name_ar = '')
  AND p.name_ar IS NOT NULL
  AND TRIM(p.name_ar) <> '';

UPDATE invoice_items ii
SET product_name_ar = oi.product_name_ar
FROM order_items oi
WHERE ii.order_item_id = oi.id
  AND (ii.product_name_ar IS NULL OR ii.product_name_ar = '')
  AND oi.product_name_ar IS NOT NULL
  AND TRIM(oi.product_name_ar) <> '';

UPDATE invoice_items ii
SET product_name_ar = p.name_ar
FROM products p
WHERE ii.product_id = p.id
  AND (ii.product_name_ar IS NULL OR ii.product_name_ar = '')
  AND p.name_ar IS NOT NULL
  AND TRIM(p.name_ar) <> '';
