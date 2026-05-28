"use client"

import { ShoppingBag } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"
import { UpsellDashboard } from "@/components/admin/ai/InsightAgentDashboards"

export default function UpsellPage() {
  return (
    <AIInsightPage
      title="Agent Upselling Intelligent"
      subtitle="Suggestions contextuelles — timing, conversion attendue et revenu."
      endpoint="/api/ai/upsell"
      icon={ShoppingBag}
      dashboard={(ctx) => <UpsellDashboard {...ctx} />}
    />
  )
}
