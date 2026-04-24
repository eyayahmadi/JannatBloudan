-- Fonction pour décrémenter le stock de manière atomique
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - quantity
  WHERE id = product_id AND stock_quantity >= quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuffisant pour le produit %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques du dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(start_date DATE DEFAULT CURRENT_DATE, end_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', (SELECT COUNT(*) FROM orders WHERE DATE(created_at) BETWEEN start_date AND end_date),
    'total_revenue', (SELECT COALESCE(SUM(total), 0) FROM orders WHERE DATE(created_at) BETWEEN start_date AND end_date AND payment_status = 'payé'),
    'average_order', (SELECT COALESCE(AVG(total), 0) FROM orders WHERE DATE(created_at) BETWEEN start_date AND end_date),
    'pending_orders', (SELECT COUNT(*) FROM orders WHERE status IN ('en attente', 'en préparation') AND DATE(created_at) BETWEEN start_date AND end_date),
    'completed_orders', (SELECT COUNT(*) FROM orders WHERE status = 'livrée' AND DATE(created_at) BETWEEN start_date AND end_date),
    'low_stock_products', (SELECT COUNT(*) FROM products WHERE stock_quantity < 10 AND is_available = true)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
