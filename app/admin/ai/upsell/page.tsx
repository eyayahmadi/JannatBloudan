"use client"

import { ShoppingBag } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"

export default function UpsellPage() {
  return (
    <AIInsightPage
      title="Agent Upselling Intelligent"
      subtitle="Desserts, boissons, extras — bandit contextuel (rush vs calme)"
      endpoint="/api/ai/upsell"
      icon={ShoppingBag}
    />
  )
}
