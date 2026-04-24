"use client"

import { useState } from "react"
import { Database } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function MemoryAgentPage() {
  const [clientKey, setClientKey] = useState("demo-client")
  const endpoint = `/api/ai/memory?clientKey=${encodeURIComponent(clientKey)}`

  return (
    <AIInsightPage
      title="Agent Memoire & RAG"
      subtitle="Preferences, commandes, reactions — retrieval lexical (extension Pinecone / Weaviate)"
      endpoint={endpoint}
      icon={Database}
    >
      <Card className="mb-6 border-white/60 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80">
        <CardContent className="pt-6">
          <Label htmlFor="ck" className="text-slate-700 dark:text-slate-300">
            Cle client (session chat / user)
          </Label>
          <Input
            id="ck"
            value={clientKey}
            onChange={(e) => setClientKey(e.target.value)}
            className="mt-2 max-w-md"
            placeholder="sessionId"
          />
        </CardContent>
      </Card>
    </AIInsightPage>
  )
}
