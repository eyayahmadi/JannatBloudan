-- =============================================================================
-- Migration 16 — Cache traduction API (Google Translate côté serveur)
-- -----------------------------------------------------------------------------
-- Stocke les paires source → cible (hash SHA256) pour éviter de retraduire.
-- Accessible uniquement via SUPABASE_SERVICE_ROLE_KEY (routes API Next).
-- Idempotente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.translation_cache (
  lookup_hash TEXT PRIMARY KEY,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS translation_cache_lang_idx
  ON public.translation_cache (source_lang, target_lang);

COMMENT ON TABLE public.translation_cache IS
  'Cache des traductions API (Google) — même texte FR + même langue cible = même hash.';

ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

-- Pas de policies : anon/authenticated n’y accèdent pas ; la service_role bypass.
