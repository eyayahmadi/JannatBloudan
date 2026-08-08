import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getActiveCategories } from "@/lib/menu/menu-catalog-service"
import { defaultQrCategorySlug } from "@/lib/menu/build-qr-nav-from-db"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { QR_DEFAULT_CATEGORY_SLUG } from "@/lib/menu/qr-printed-menu"

export default async function StaffTableMenuIndexPage({
  params,
}: {
  params: Promise<{ tableId: string }>
}) {
  const { tableId } = await params
  let slug = QR_DEFAULT_CATEGORY_SLUG

  if (hasServerSupabaseEnv()) {
    try {
      const supabase = await createClient()
      const { rows } = await getActiveCategories(supabase)
      slug = defaultQrCategorySlug(rows)
    } catch {
      /* fallback slug */
    }
  }

  redirect(`/server/${tableId}/menu/${slug}`)
}
