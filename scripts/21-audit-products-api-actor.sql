-- Les PATCH produits via l’API Next (SERVICE_ROLE_KEY) ne propagent pas auth.uid().
-- Ce script supprime le trigger automatique « products » et laisse les insertions faites depuis
-- /api/admin/products/* avec user_id + user_email réels.

DROP TRIGGER IF EXISTS audit_products_trg ON products;

-- Optionnel : conserver invoice/payment/users tels quel (auth.uid peut exister depuis le client).
