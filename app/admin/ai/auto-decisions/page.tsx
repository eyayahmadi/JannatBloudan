"use client"

import { Gavel } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"
import { AutoDecisionsDashboard } from "@/components/admin/ai/InsightAgentDashboards"

export default function AutoDecisionsPage() {
  return (
    <AIInsightPage
      title="Agent Décision automatique"
      subtitle="Promo, prix, stock — gouvernance, risques et validation humaine."
      endpoint="/api/ai/auto-decisions"
      icon={Gavel}
      dashboard={(ctx) => <AutoDecisionsDashboard {...ctx} />}
    />
  )
}
