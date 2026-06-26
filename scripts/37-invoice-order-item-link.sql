-- ============================================================================
-- 37 — Lien fort invoice_items ⇄ order_items (synchronisation bidirectionnelle)
-- ----------------------------------------------------------------------------
-- Objectif : permettre au service applicatif `syncOrderInvoice` de réconcilier
-- chaque ligne de facture avec la ligne de commande correspondante, sans
-- dépendre du fragile motif texte `oid:<uuid>` stocké dans `notes`.
--
-- Idempotent : peut être rejoué sans danger.
-- ============================================================================

-- 1) Colonne de liaison directe ------------------------------------------------
ALTER TABLE IF EXISTS invoice_items
  ADD COLUMN IF NOT EXISTS order_item_id UUID
    REFERENCES order_items(id) ON DELETE SET NULL;

-- 2) Backfill depuis l'ancien motif `oid:<uuid>` présent dans notes -----------
--    On ne remplit que les lignes pointant vers un order_item réellement existant.
UPDATE invoice_items AS ii
SET order_item_id = sub.oid::uuid
FROM (
  SELECT id,
         (regexp_match(notes, 'oid:([0-9a-fA-F-]{36})'))[1] AS oid
  FROM invoice_items
  WHERE order_item_id IS NULL
    AND notes ~ 'oid:[0-9a-fA-F-]{36}'
) AS sub
WHERE ii.id = sub.id
  AND sub.oid IS NOT NULL
  AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.id = sub.oid::uuid);

-- 3) Index de recherche --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoice_items_order_item_id
  ON invoice_items(order_item_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id
  ON invoice_items(invoice_id);

-- 4) Colonnes de traçabilité de synchronisation -------------------------------
--    `synced_at` : dernière réconciliation appliquée à la ligne.
--    `sync_locked` : ligne figée (ex. facture déjà payée) — ne pas modifier.
ALTER TABLE IF EXISTS invoice_items
  ADD COLUMN IF NOT EXISTS synced_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- 5) Marqueur "correction requise" sur la facture -----------------------------
--    Positionné quand un order_item change alors que la facture est déjà payée :
--    la caisse doit alors passer par un flux d'avoir / remboursement.
ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS needs_correction      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS correction_reason     TEXT,
  ADD COLUMN IF NOT EXISTS correction_flagged_at TIMESTAMPTZ;

-- 6) Élargir le check de line_status pour couvrir 'refused' (refus station) ----
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'invoice_items' AND constraint_name = 'invoice_items_line_status_check'
  ) THEN
    ALTER TABLE invoice_items DROP CONSTRAINT invoice_items_line_status_check;
  END IF;

  ALTER TABLE invoice_items
    ADD CONSTRAINT invoice_items_line_status_check
    CHECK (line_status IN (
      'ordered', 'sent_station', 'preparing', 'ready', 'served',
      'paid', 'unpaid', 'cancelled', 'offered', 'waste', 'refused', 'replaced'
    ));
EXCEPTION WHEN others THEN
  -- En cas d'absence du check d'origine ou de divergence, on ignore.
  NULL;
END$$;
