"use client"

import { Zap } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"

export default function RealtimeOpsPage() {
  return (
    <AIInsightPage
      title="Optimisation temps reel"
      subtitle="Latence, debit, routage cuisine — ajustements automatiques"
      endpoint="/api/ai/realtime-ops"
      icon={Zap}
    />
  )
}
