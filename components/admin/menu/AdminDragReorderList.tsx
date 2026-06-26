"use client"

import { useState } from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

type ReorderItem = { id: string }

type AdminDragReorderListProps<T extends ReorderItem> = {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  disabled?: boolean
}

export function AdminDragReorderList<T extends ReorderItem>({
  items,
  onReorder,
  renderItem,
  className,
  disabled,
}: AdminDragReorderListProps<T>) {
  const [dragId, setDragId] = useState<string | null>(null)

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId || disabled) return
    const from = items.findIndex((i) => i.id === dragId)
    const to = items.findIndex((i) => i.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder(next)
    setDragId(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable={!disabled}
          onDragStart={() => setDragId(item.id)}
          onDragEnd={() => setDragId(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(item.id)}
          className={cn(
            "flex items-start gap-2 rounded-xl border bg-white p-2 transition dark:bg-slate-900",
            dragId === item.id && "opacity-50 ring-2 ring-amber-400",
            !disabled && "cursor-grab active:cursor-grabbing",
          )}
        >
          <GripVertical className="mt-2 h-4 w-4 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
        </div>
      ))}
    </div>
  )
}
