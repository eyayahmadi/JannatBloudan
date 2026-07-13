-- Snapshot bilingue structuré des variantes / extras / notes sur chaque ligne commande.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS options_snapshot JSONB;

COMMENT ON COLUMN order_items.options_snapshot IS
  'Variantes, modifiers (extras) et note client — name_de/name_ar + group_name_de/group_name_ar';

CREATE INDEX IF NOT EXISTS idx_order_items_options_snapshot
  ON order_items USING gin (options_snapshot);
