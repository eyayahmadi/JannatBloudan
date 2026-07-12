import { redirect } from "next/navigation"
import { QR_DEFAULT_CATEGORY_SLUG } from "@/lib/menu/qr-printed-menu"

export default async function StaffTableMenuIndexPage({
  params,
}: {
  params: Promise<{ tableId: string }>
}) {
  const { tableId } = await params
  redirect(`/server/${tableId}/menu/${QR_DEFAULT_CATEGORY_SLUG}`)
}
