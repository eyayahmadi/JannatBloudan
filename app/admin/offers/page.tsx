"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PromotionsAdminModule } from "@/components/admin/promotions/PromotionsAdminModule"

export default function AdminOffersPage() {
  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <PromotionsAdminModule hub="offers" />
    </RequireAuth>
  )
}
