"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { StationBoard } from "@/components/stations/StationBoard"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"

export default function KitchenOrdersPage() {
  return (
    <RequireAuth roles={["ADMIN", "KITCHEN"]}>
      <StaffWorkspaceShell title="Cuisine" subtitle="KDS — station KITCHEN uniquement">
        <StationBoard station="KITCHEN" layout="workspace" />
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}
