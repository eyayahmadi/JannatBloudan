"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { StationBoard } from "@/components/stations/StationBoard"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"
import { useI18n } from "@/lib/i18n/context"

export default function BarOrdersPage() {
  const { t } = useI18n()
  return (
    <RequireAuth roles={["ADMIN", "BAR"]}>
      <StaffWorkspaceShell
        title={t("workspace.stations.bar.title")}
        subtitle={t("workspace.stations.bar.subtitle")}
      >
        <StationBoard station="BAR" layout="workspace" />
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}
