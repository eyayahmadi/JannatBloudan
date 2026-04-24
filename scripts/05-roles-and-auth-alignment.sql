-- =============================================================================
-- Migration 05 — Alignement des roles (auth + metier) + completions
-- Idempotente : peut etre relancee sans erreur.
-- A executer APRES 01, 02, 03, 04.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Elargir user_roles pour couvrir TOUS les roles metier utilises dans l'app
--    On garde les 4 existants (client / serveur / caissier / admin) et on
--    ajoute : manager, cuisinier, livreur.
-- -----------------------------------------------------------------------------

-- Ajoute une description lisible si manquante
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Categorie "auth" : correspond a la valeur JWT (CUSTOMER/STAFF/ADMIN)
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS auth_level VARCHAR(20) DEFAULT 'STAFF';
  -- 'CUSTOMER' | 'STAFF' | 'ADMIN'

-- Met a jour les auth_level pour les 4 existants
UPDATE user_roles SET auth_level = 'CUSTOMER', description = 'Client du restaurant'
  WHERE name = 'client';
UPDATE user_roles SET auth_level = 'STAFF',    description = 'Serveur en salle'
  WHERE name = 'serveur';
UPDATE user_roles SET auth_level = 'STAFF',    description = 'Caissier / POS'
  WHERE name = 'caissier';
UPDATE user_roles SET auth_level = 'ADMIN',    description = 'Administrateur - acces total'
  WHERE name = 'admin';

-- Ajoute les roles manquants
INSERT INTO user_roles (name, auth_level, description, permissions) VALUES
  ('manager',    'ADMIN', 'Manager / responsable restaurant',
    '{"can_manage_staff": true, "can_view_reports": true, "can_manage_menu": true, "can_view_finance": true}'::jsonb),
  ('cuisinier',  'STAFF', 'Cuisinier / KDS',
    '{"can_view_kitchen": true, "can_update_order_status": true, "can_report_stock_issue": true}'::jsonb),
  ('livreur',    'STAFF', 'Livreur',
    '{"can_view_orders": true, "can_update_delivery_status": true}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  auth_level  = EXCLUDED.auth_level,
  description = EXCLUDED.description,
  permissions = user_roles.permissions || EXCLUDED.permissions;

-- -----------------------------------------------------------------------------
-- 2. Ajouter sur `users` une colonne `role` direct (miroir du JWT)
--    L'app lit user.role (CUSTOMER/STAFF/ADMIN) depuis user_metadata.
--    On expose la meme info en DB pour les requetes SQL + RLS.
-- -----------------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'CUSTOMER';
  -- 'CUSTOMER' | 'STAFF' | 'ADMIN'

-- Synchronise role depuis user_roles.auth_level quand role_id est defini
UPDATE users u
SET role = ur.auth_level
FROM user_roles ur
WHERE u.role_id = ur.id
  AND (u.role IS NULL OR u.role = 'CUSTOMER')
  AND ur.auth_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- -----------------------------------------------------------------------------
-- 3. Trigger de synchro : si role_id change, on met role a jour automatiquement
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_user_role_from_role_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role_id IS NOT NULL THEN
    SELECT auth_level INTO NEW.role
    FROM user_roles
    WHERE id = NEW.role_id;
    IF NEW.role IS NULL THEN
      NEW.role := 'STAFF';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_sync_role_from_role_id ON users;
CREATE TRIGGER users_sync_role_from_role_id
  BEFORE INSERT OR UPDATE OF role_id ON users
  FOR EACH ROW EXECUTE FUNCTION sync_user_role_from_role_id();

-- -----------------------------------------------------------------------------
-- 4. Table `staff_profiles` pour l'ecran /admin/staff et /admin/hr
--    (performance, horaires, embauche...) sans toucher a `users`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  job_role      VARCHAR(30) NOT NULL,
    -- serveur | cuisinier | caissier | manager | livreur | admin
  status        VARCHAR(20) DEFAULT 'active',  -- active | inactive | on_leave
  hire_date     DATE,
  hourly_rate   DECIMAL(8,2),
  orders_done   INTEGER DEFAULT 0,
  avg_time      INTEGER,
  rating        DECIMAL(3,2) DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_job_role ON staff_profiles(job_role);
CREATE INDEX IF NOT EXISTS idx_staff_status   ON staff_profiles(status);

DROP TRIGGER IF EXISTS update_staff_profiles_updated_at ON staff_profiles;
CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. Vue pratique : qui est qui
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_users_with_role AS
SELECT u.id,
       u.email,
       u.full_name,
       u.phone,
       u.role                   AS auth_role,
       ur.name                  AS job_role,
       ur.description           AS job_description,
       u.is_active,
       u.created_at
FROM users u
LEFT JOIN user_roles ur ON ur.id = u.role_id;

-- -----------------------------------------------------------------------------
-- 6. Verification
--    Execute apres la migration : SELECT name, auth_level FROM user_roles;
--    Tu dois voir 7 lignes (4 existantes + manager + cuisinier + livreur).
-- -----------------------------------------------------------------------------
-- Fin migration 05.
