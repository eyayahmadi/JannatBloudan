-- Insertion des rôles utilisateurs (idempotent)
INSERT INTO user_roles (name, permissions) VALUES
('client', '{"can_order": true, "can_reserve": true}'::jsonb),
('serveur', '{"can_view_orders": true, "can_update_order_status": true, "can_manage_tables": true}'::jsonb),
('caissier', '{"can_view_orders": true, "can_process_payments": true, "can_view_reports": true}'::jsonb),
('admin', '{"full_access": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- La carte complète Jannat Bloudan est insérée par scripts/33-jannat-bloudan-menu.sql
-- (source : data/jannat-bloudan-menu.json)
