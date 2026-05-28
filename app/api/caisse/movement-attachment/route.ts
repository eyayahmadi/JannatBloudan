import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const ALLOW = ["ADMIN", "CASHIER"] as const

const MIME_OK = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
])

/** Upload fichier preuve pour sortie de caisse → URL publique (bucket configuré dans Supabase). */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: "formulaire multipart requis" }, { status: 400 })
  }
  const file = form.get("file")
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "fichier requis" }, { status: 400 })
  }

  const maxBytes = 5 * 1024 * 1024
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "fichier trop volumineux (max 5 Mo)" }, { status: 400 })
  }

  const mime = String(file.type || "application/octet-stream")
  if (!MIME_OK.has(mime)) {
    return NextResponse.json(
      { error: "Types acceptés : PNG, JPG, WEBP, PDF" },
      { status: 400 },
    )
  }

  try {
    const supabase = createServiceRoleClient()
    const buf = await file.arrayBuffer()
    const safeName = String(file.name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120)
    const objectPath = `sorties/${guard.user.id}/${Date.now()}-${safeName}`

    const { data: up, error: upErr } = await supabase.storage
      .from("cash-register-attachments")
      .upload(objectPath, new Uint8Array(buf), { contentType: mime, upsert: false })

    if (upErr) {
      console.error("[movement-attachment]", upErr)
      return NextResponse.json(
        {
          error:
            "Upload échoué. Créez le bucket public « cash-register-attachments » (Supabase Storage) et les policies adaptées.",
          detail: upErr.message,
        },
        { status: 500 },
      )
    }

    const { data: pub } = supabase.storage.from("cash-register-attachments").getPublicUrl(up?.path ?? objectPath)

    return NextResponse.json({
      ok: true,
      url: pub.publicUrl,
      path: up?.path ?? objectPath,
      uploaded_by: guard.user.id,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
