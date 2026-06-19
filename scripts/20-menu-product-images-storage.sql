-- Bucket pour images admin : plats, promos, couvertures (API /api/admin/upload-image).
-- Compatible avec toutes les versions du schéma storage.buckets Supabase :
-- certaines instances n'ont pas la colonne "public" (accès public via RLS sur objects).
-- Idempotent : ne fait rien si le schéma storage est absent.

DO $$
DECLARE
  has_buckets boolean;
  has_objects boolean;
  has_public_col boolean;
  has_file_size_limit_col boolean;
  has_allowed_mime_types_col boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
  ) INTO has_buckets;

  IF NOT has_buckets THEN
    RAISE NOTICE 'storage.buckets absent — bucket menu-product-images ignoré (Storage non provisionné).';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
      AND column_name = 'public'
  ) INTO has_public_col;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
      AND column_name = 'file_size_limit'
  ) INTO has_file_size_limit_col;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
      AND column_name = 'allowed_mime_types'
  ) INTO has_allowed_mime_types_col;

  -- Créer le bucket avec le minimum de colonnes (id + name) — toujours présents.
  INSERT INTO storage.buckets (id, name)
  VALUES ('menu-product-images', 'menu-product-images')
  ON CONFLICT (id) DO NOTHING;

  -- Mettre à jour les colonnes optionnelles si elles existent.
  IF has_public_col THEN
    EXECUTE $sql$
      UPDATE storage.buckets
      SET "public" = true
      WHERE id = 'menu-product-images'
    $sql$;
  END IF;

  IF has_file_size_limit_col THEN
    UPDATE storage.buckets
    SET file_size_limit = 5242880
    WHERE id = 'menu-product-images';
  END IF;

  IF has_allowed_mime_types_col THEN
    UPDATE storage.buckets
    SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
    WHERE id = 'menu-product-images';
  END IF;

  -- Policy lecture publique (si storage.objects existe).
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'objects'
  ) INTO has_objects;

  IF has_objects THEN
    EXECUTE 'DROP POLICY IF EXISTS "menu_images_public_read" ON storage.objects';
    EXECUTE $policy$
      CREATE POLICY "menu_images_public_read"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'menu-product-images')
    $policy$;
  ELSE
    RAISE NOTICE 'storage.objects absent — policy menu_images_public_read ignorée.';
  END IF;
END $$;

-- Les uploads passent par la service role sur le serveur (pas de policy INSERT anonyme nécessaire).
