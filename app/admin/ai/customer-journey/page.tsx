"use client"

import { Route } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"
import { CustomerJourneyDashboard } from "@/components/admin/ai/InsightAgentDashboards"

export default function CustomerJourneyPage() {
  return (
    <AIInsightPage
      title="Agent Customer Journey"
      subtitle="Entonnoir conversion, frictions et actions de récupération pilotées par l’IA."
      endpoint="/api/ai/customer-journey"
      icon={Route}
      dashboard={(ctx) => <CustomerJourneyDashboard {...ctx} />}
    />
  )
}
