import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import type { AdminImageScope } from "@/lib/admin/image-upload-scope"
import { normalizeAdminImageScope, uploadAdminPublicImage } from "@/lib/server/admin-public-image-upload"

const MIME_OK = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"])
const MAX_BYTES = 5 * 1024 * 1024

/**
 * Upload image admin générique → bucket « menu-product-images » (paths: products/, promotions/, …).
 * multipart: file + scope (products | promotions | events | marketing), défaut products.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: "formulaire multipart requis" }, { status: 400 })
  }

  const scope: AdminImageScope = normalizeAdminImageScope(form.get("scope")) ?? "products"
  const file = form.get("file")
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "image requise" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "fichier trop volumineux (max 5 Mo)" }, { status: 400 })
  }
  const mime = String(file.type || "").toLowerCase()
  if (!MIME_OK.has(mime)) {
    return NextResponse.json({ error: "Formats acceptés : JPG, PNG, WebP." }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()
    const buf = await file.arrayBuffer()
    const uid = String(guard.user.id ?? "admin")

    const out = await uploadAdminPublicImage({
      supabase,
      buf,
      mime,
      uidFragment: uid,
      scope,
    })

    if (!out.ok) {
      return NextResponse.json({ error: out.message, detail: out.detail }, { status: 500 })
    }
    return NextResponse.json({ ok: true, url: out.url, path: out.path })
  } catch (e) {
    console.error("[admin/upload-image]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
