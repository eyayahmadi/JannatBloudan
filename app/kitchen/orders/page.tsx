"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { StationBoard } from "@/components/stations/StationBoard"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"
import { useI18n } from "@/lib/i18n/context"

export default function KitchenOrdersPage() {
  const { t } = useI18n()
  return (
    <RequireAuth roles={["ADMIN", "KITCHEN"]}>
      <StaffWorkspaceShell
        title={t("workspace.stations.kitchen.title")}
        subtitle={t("workspace.stations.kitchen.subtitle")}
      >
        <StationBoard station="KITCHEN" layout="workspace" />
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}
