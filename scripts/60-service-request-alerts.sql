-- Service request tracking on table_alerts (waiter / bill)
-- Adds order link + acknowledgement audit columns.

ALTER TABLE table_alerts
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

ALTER TABLE table_alerts
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

ALTER TABLE table_alerts
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_alerts_pending_type
  ON table_alerts(table_id, type)
  WHERE resolved_at IS NULL;

COMMENT ON COLUMN table_alerts.order_id IS 'Optional order linked to guest service request';
COMMENT ON COLUMN table_alerts.acknowledged_at IS 'When staff acknowledged the request';
COMMENT ON COLUMN table_alerts.acknowledged_by IS 'Staff user who acknowledged';
