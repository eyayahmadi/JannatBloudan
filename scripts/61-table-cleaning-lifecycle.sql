-- Table cleaning lifecycle: paid/closed → CLEANING → FREE (after staff confirmation)

ALTER TABLE restaurant_tables
  ADD COLUMN IF NOT EXISTS cleaning_since TIMESTAMPTZ;

COMMENT ON COLUMN restaurant_tables.cleaning_since IS
  'Timestamp when table entered CLEANING / needs-cleaning state (post-payment).';

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_cleaning
  ON restaurant_tables(status, cleaning_since)
  WHERE status = 'CLEANING';
