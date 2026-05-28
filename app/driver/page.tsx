"use client"

import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { PremiumBackdrop } from "@/components/site/PremiumBackdrop"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { DriverDashboardView } from "@/components/delivery/DriverDashboardView"

export default function DriverDashboardPage() {
  return (
    <PageShell>
      <PremiumBackdrop />
      <SiteHeader backHref="/admin" />

      <DriverDashboardView variant="public" />

      <AIAgentBadge context="driver" />
      <SiteFooter />
    </PageShell>
  )
}
