-- =============================================================================
-- 12 — Factures fournisseurs, achats, liaison dépenses & stock
-- Exécuter après 06-commercial-ready + 08-advanced.
-- Bucket Storage Supabase: créer manuellement "supplier-invoices" (privé) et
-- policies de lecture/écriture pour staff, ou servir des URLs signées côté API.
-- =============================================================================

-- Fournisseurs (référentiel léger)
CREATE TABLE IF NOT EXISTS suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(40),
  address         TEXT,
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers (lower(name));

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Statuts: brouillon | extraction_en_cours | a_verifier | validee | rejetee
-- Modes: upload_image | upload_pdf | manuel
CREATE TABLE IF NOT EXISTS supplier_invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id           UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name_raw     VARCHAR(300),
  invoice_number        VARCHAR(120),
  invoice_date          DATE,
  file_url              TEXT,
  file_mime             VARCHAR(80),
  original_filename     VARCHAR(300),
  input_mode            VARCHAR(30) NOT NULL DEFAULT 'manuel',
  status                VARCHAR(30) NOT NULL DEFAULT 'brouillon',
  total_ht              NUMERIC(14,2),
  tva                   NUMERIC(14,2),
  total_ttc             NUMERIC(14,2),
  extraction_confidence NUMERIC(5,2),
  extracted_payload     JSONB,
  commentaire           TEXT,
  expense_id            UUID REFERENCES expenses(id) ON DELETE SET NULL,
  created_by            UUID,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON supplier_invoices (status);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_date ON supplier_invoices (invoice_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier ON supplier_invoices (supplier_id);

DROP TRIGGER IF EXISTS update_supplier_invoices_updated_at ON supplier_invoices;
CREATE TRIGGER update_supplier_invoices_updated_at
  BEFORE UPDATE ON supplier_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Lignes: line_status = pending | matched | new_ingredient | ignored
CREATE TABLE IF NOT EXISTS supplier_invoice_items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id              UUID NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  line_no                 INT NOT NULL DEFAULT 0,
  raw_name                VARCHAR(300) NOT NULL,
  matched_ingredient_id   UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  line_status             VARCHAR(30) NOT NULL DEFAULT 'pending',
  quantity                NUMERIC(14,3) NOT NULL DEFAULT 0,
  unit                    VARCHAR(30) NOT NULL DEFAULT 'kg',
  unit_price              NUMERIC(14,4),
  line_total              NUMERIC(14,2),
  vat_rate                NUMERIC(6,2),
  confidence              NUMERIC(5,2),
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_invoice ON supplier_invoice_items (invoice_id);

-- Lien retour facture sur dépense
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS supplier_invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_supplier_invoice
  ON expenses (supplier_invoice_id) WHERE supplier_invoice_id IS NOT NULL;

-- RLS
ALTER TABLE suppliers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suppliers_staff_only" ON suppliers;
CREATE POLICY "suppliers_staff_only" ON suppliers
  FOR ALL USING (is_staff_or_admin());

DROP POLICY IF EXISTS "supplier_invoices_staff_only" ON supplier_invoices;
CREATE POLICY "supplier_invoices_staff_only" ON supplier_invoices
  FOR ALL USING (is_staff_or_admin());

DROP POLICY IF EXISTS "supplier_invoice_items_staff_only" ON supplier_invoice_items;
CREATE POLICY "supplier_invoice_items_staff_only" ON supplier_invoice_items
  FOR ALL USING (is_staff_or_admin());

