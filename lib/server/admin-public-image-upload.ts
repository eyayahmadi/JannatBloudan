import type { SupabaseClient } from "@supabase/supabase-js"
import { ADMIN_IMAGE_SCOPES, type AdminImageScope } from "@/lib/admin/image-upload-scope"

/** Bucket public documenté dans scripts/20-menu-product-images-storage.sql */
export const ADMIN_PUBLIC_IMAGE_BUCKET = "menu-product-images"

const MIME_TO_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/webp": ".webp",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
}

export function normalizeAdminImageScope(raw: unknown): AdminImageScope | null {
  const s = String(raw ?? "").toLowerCase().trim()
  return (ADMIN_IMAGE_SCOPES as readonly string[]).includes(s) ? (s as AdminImageScope) : null
}

/** Upload image dans le bucket public menu / marketing (sous-dossier par scope). */
export async function uploadAdminPublicImage(opts: {
  supabase: SupabaseClient
  buf: ArrayBuffer
  mime: string
  /** Fragment de chemin safe (ex. user id). */
  uidFragment: string
  scope: AdminImageScope
}): Promise<{ ok: true; url: string; path: string } | { ok: false; message: string; detail?: string }> {
  const mime = String(opts.mime || "").toLowerCase()
  const ext = MIME_TO_EXT[mime] ?? ".jpg"
  const contentType = mime === "image/jpg" ? "image/jpeg" : mime

  const uid = opts.uidFragment.replace(/[^a-zA-Z0-9._-]/g, "") || "user"
  const objectPath = `${opts.scope}/${uid}/${Date.now()}${ext}`

  const { data: up, error: upErr } = await opts.supabase.storage
    .from(ADMIN_PUBLIC_IMAGE_BUCKET)
    .upload(objectPath, new Uint8Array(opts.buf), {
      contentType,
      upsert: false,
    })

  if (upErr) {
    return {
      ok: false,
      message:
        "Upload échoué. Vérifiez le bucket public « menu-product-images » et les droits (voir scripts/20-menu-product-images-storage.sql).",
      detail: upErr.message,
    }
  }

  const path = up?.path ?? objectPath
  const { data: pub } = opts.supabase.storage.from(ADMIN_PUBLIC_IMAGE_BUCKET).getPublicUrl(path)
  return { ok: true, url: pub.publicUrl, path }
}
