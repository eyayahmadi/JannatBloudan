-- =============================================================================
-- 68 — Checkout QR : insertion atomique commande + lignes + RLS invité table
-- Idempotent — peut être relancé sans erreur.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. RPC atomique : commande + order_items (rollback automatique si échec)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION insert_table_order_with_items(
  p_order JSONB,
  p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_row orders%ROWTYPE;
  v_item JSONB;
  v_inserted_items JSONB;
BEGIN
  IF p_order IS NULL OR p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'p_order et p_items (array) requis';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Au moins un article requis';
  END IF;

  INSERT INTO orders (
    order_number,
    customer_name,
    order_type,
    source,
    table_id,
    table_number,
    session_id,
    subtotal,
    total,
    status,
    notes
  )
  VALUES (
    p_order->>'order_number',
    p_order->>'customer_name',
    COALESCE(NULLIF(p_order->>'order_type', ''), NULLIF(p_order->>'source', ''), 'qr_self_service'),
    COALESCE(NULLIF(p_order->>'source', ''), 'qr_self_service'),
    NULLIF(p_order->>'table_id', '')::INTEGER,
    NULLIF(p_order->>'table_number', '')::INTEGER,
    NULLIF(p_order->>'session_id', '')::UUID,
    COALESCE(NULLIF(p_order->>'subtotal', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_order->>'total', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_order->>'status', ''), 'pending'),
    NULLIF(p_order->>'notes', '')
  )
  RETURNING * INTO v_order_row;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) AS t(value)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_name_ar,
      quantity,
      unit_price,
      subtotal,
      special_instructions,
      options_snapshot
    )
    VALUES (
      v_order_row.id,
      NULLIF(v_item->>'product_id', '')::UUID,
      COALESCE(v_item->>'product_name', 'Article'),
      NULLIF(v_item->>'product_name_ar', ''),
      GREATEST(COALESCE(NULLIF(v_item->>'quantity', '')::INTEGER, 0), 1),
      COALESCE(NULLIF(v_item->>'unit_price', '')::NUMERIC, 0),
      COALESCE(NULLIF(v_item->>'subtotal', '')::NUMERIC, 0),
      NULLIF(v_item->>'special_instructions', ''),
      CASE
        WHEN v_item ? 'options_snapshot' AND v_item->'options_snapshot' IS NOT NULL
          AND v_item->'options_snapshot' <> 'null'::jsonb
        THEN v_item->'options_snapshot'
        ELSE NULL
      END
    );
  END LOOP;

  SELECT COALESCE(jsonb_agg(to_jsonb(oi)), '[]'::jsonb)
  INTO v_inserted_items
  FROM order_items oi
  WHERE oi.order_id = v_order_row.id;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order_row),
    'items', v_inserted_items
  );
END;
$$;

COMMENT ON FUNCTION insert_table_order_with_items(JSONB, JSONB) IS
  'Insère une commande table et ses lignes dans une transaction unique (checkout QR).';

GRANT EXECUTE ON FUNCTION insert_table_order_with_items(JSONB, JSONB) TO service_role;

-- -----------------------------------------------------------------------------
-- 2. RLS invité QR (complète les policies staff-only de 63 — pas de disable global)
-- -----------------------------------------------------------------------------
DO $pol$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_orders_qr_guest_insert ON orders;
    CREATE POLICY jb_orders_qr_guest_insert
      ON orders FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        source = 'qr_self_service'
        AND table_id IS NOT NULL
        AND session_id IS NOT NULL
      );

    DROP POLICY IF EXISTS jb_orders_qr_guest_read ON orders;
    CREATE POLICY jb_orders_qr_guest_read
      ON orders FOR SELECT
      TO anon, authenticated
      USING (source = 'qr_self_service');
  END IF;

  IF to_regclass('public.order_items') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_order_items_qr_guest_insert ON order_items;
    CREATE POLICY jb_order_items_qr_guest_insert
      ON order_items FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM orders o
          WHERE o.id = order_id AND o.source = 'qr_self_service'
        )
      );

    DROP POLICY IF EXISTS jb_order_items_qr_guest_read ON order_items;
    CREATE POLICY jb_order_items_qr_guest_read
      ON order_items FOR SELECT
      TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1 FROM orders o
          WHERE o.id = order_id AND o.source = 'qr_self_service'
        )
      );
  END IF;

  IF to_regclass('public.table_sessions') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_table_sessions_qr_guest_read ON table_sessions;
    CREATE POLICY jb_table_sessions_qr_guest_read
      ON table_sessions FOR SELECT
      TO anon, authenticated
      USING (closed_at IS NULL);
  END IF;

  IF to_regclass('public.table_alerts') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_table_alerts_qr_guest_insert ON table_alerts;
    CREATE POLICY jb_table_alerts_qr_guest_insert
      ON table_alerts FOR INSERT
      TO anon, authenticated
      WITH CHECK (table_id IS NOT NULL);
  END IF;
END $pol$;

COMMIT;
