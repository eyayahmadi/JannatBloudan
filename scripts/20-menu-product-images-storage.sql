-- Bucket pour images admin : plats, promos, couvertures (API /api/admin/upload-image).
-- Exécuter dans Supabase SQL Editor après création du projet.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-product-images',
  'menu-product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lecture publique pour affichage menu (images servies depuis l’URL publique Supabase).
drop policy if exists "menu_images_public_read" on storage.objects;
create policy "menu_images_public_read"
  on storage.objects for select
  using (bucket_id = 'menu-product-images');

-- Les uploads passent par la service role sur le serveur (pas de policy INSERT anonyme nécessaire).
