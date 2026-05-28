"use client"

import { Zap } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"
import { RealtimeOpsDashboard } from "@/components/admin/ai/InsightAgentDashboards"

export default function RealtimeOpsPage() {
  return (
    <AIInsightPage
      title="Optimisation temps réel"
      subtitle="Charge cuisine, cadence, livraison — recommandations temps réel."
      endpoint="/api/ai/realtime-ops"
      icon={Zap}
      dashboard={(ctx) => <RealtimeOpsDashboard {...ctx} />}
    />
  )
}
