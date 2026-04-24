"use client"

import { Route } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"

export default function CustomerJourneyPage() {
  return (
    <AIInsightPage
      title="Agent Customer Journey"
      subtitle="Entree → commande → paiement — fuites et opportunites"
      endpoint="/api/ai/customer-journey"
      icon={Route}
    />
  )
}
