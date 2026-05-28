"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PromotionsAdminModule } from "@/components/admin/promotions/PromotionsAdminModule"

export default function AdminPromotionsPage() {
  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PromotionsAdminModule hub="promotions" />
    </RequireAuth>
  )
}
