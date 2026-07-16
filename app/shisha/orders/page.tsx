"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { StationBoard } from "@/components/stations/StationBoard"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"
import { useI18n } from "@/lib/i18n/context"

export default function ShishaOrdersPage() {
  const { t } = useI18n()
  return (
    <RequireAuth roles={["ADMIN", "SHISHA"]}>
      <StaffWorkspaceShell
        title={t("workspace.stations.shisha.title")}
        subtitle={t("workspace.stations.shisha.subtitle")}
      >
        <StationBoard station="SHISHA" layout="workspace" />
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}
