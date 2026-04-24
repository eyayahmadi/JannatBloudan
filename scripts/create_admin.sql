-- Créer un utilisateur admin dans Supabase Auth via SQL brut
-- À exécuter dans le SQL Editor Supabase avec les paramètres adaptés

insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('motdepassefort', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name":"Admin","last_name":"User","role":"ADMIN"}'
);

-- Adapter l'email/mot de passe, et remplacer instance_id si besoin (par défaut, 000... pour la plupart des projets).
