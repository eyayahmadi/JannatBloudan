"use client"

import { useState } from "react"
import { ChevronDown, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/lib/context/AuthContext"
import { cn } from "@/lib/utils"

type TechnicalPayloadCollapsibleProps = {
  data: unknown
  loading: boolean
}

export function TechnicalPayloadCollapsible({ data, loading }: TechnicalPayloadCollapsibleProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  if (user?.role !== "ADMIN") return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-8">
      <div className="flex justify-center border-t border-stone-200/80 pt-6 dark:border-slate-800">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-dashed border-stone-300 text-slate-600 hover:bg-stone-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Code2 className="h-4 w-4" />
            Voir le payload technique
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <Card className="mt-4 border-slate-700 bg-slate-950 dark:border-slate-600">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Code2 className="h-4 w-4" />
              Réponse API (admin)
            </CardTitle>
            <CardDescription className="text-slate-500">JSON brut — débogage uniquement.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[min(480px,55vh)] overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-emerald-300">
              {loading ? "// Chargement…" : JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
