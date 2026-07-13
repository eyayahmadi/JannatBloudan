"use client"

import { cn } from "@/lib/utils"
import {
  CUSTOMER_NOTE_LABEL,
  groupModifiersByGroup,
  hasOrderItemOptions,
  resolveOrderItemOptions,
  type OrderItemOptionsSnapshot,
} from "@/lib/orders/order-item-options"

export type OrderItemOptionsProps = {
  options_snapshot?: OrderItemOptionsSnapshot | null
  notes?: string | null
  /** Fallback when snapshot absent (legacy rows). */
  logContext?: string
  className?: string
  /** Screen UI — slightly smaller than thermal print. */
  size?: "sm" | "md"
}

function GroupHeader({
  groupDe,
  groupAr,
  size,
}: {
  groupDe: string
  groupAr: string | null
  size: "sm" | "md"
}) {
  const cls = size === "sm" ? "text-xs" : "text-sm"
  return (
    <p className={cn("font-bold text-black dark:text-white", cls)}>
      <span>{groupDe}</span>
      {groupAr && groupAr !== groupDe ? (
        <>
          <span className="mx-1 text-black/70 dark:text-white/70">/</span>
          <span dir="rtl" className="inline-block font-bold">
            {groupAr}
          </span>
        </>
      ) : null}
    </p>
  )
}

function ValuePair({
  nameDe,
  nameAr,
  size,
}: {
  nameDe: string
  nameAr: string | null
  size: "sm" | "md"
}) {
  const deCls = size === "sm" ? "text-xs font-semibold" : "text-sm font-bold"
  const arCls = size === "sm" ? "text-xs font-semibold" : "text-sm font-bold"
  return (
    <div className="space-y-0.5">
      <p className={cn(deCls, "text-black dark:text-white break-words")}>{nameDe}</p>
      {nameAr && nameAr !== nameDe ? (
        <p dir="rtl" className={cn(arCls, "text-black dark:text-white break-words text-right")}>
          {nameAr}
        </p>
      ) : null}
    </div>
  )
}

export function OrderItemOptions({
  options_snapshot,
  notes,
  logContext,
  className,
  size = "sm",
}: OrderItemOptionsProps) {
  const snapshot = resolveOrderItemOptions({
    options_snapshot,
    notes,
    logContext,
  })

  if (!hasOrderItemOptions(snapshot)) return null

  const modifierGroups = [...groupModifiersByGroup(snapshot.modifiers).values()]

  return (
    <div className={cn("mt-1 space-y-2 text-black dark:text-white", className)}>
      {snapshot.variant ? (
        <div>
          <GroupHeader
            groupDe={snapshot.variant.group_name_de}
            groupAr={snapshot.variant.group_name_ar}
            size={size}
          />
          <ValuePair
            nameDe={snapshot.variant.name_de}
            nameAr={snapshot.variant.name_ar}
            size={size}
          />
        </div>
      ) : null}

      {modifierGroups.map((mods, idx) => {
        const head = mods[0]
        return (
          <div key={`${head.group_name_de}-${idx}`}>
            <GroupHeader groupDe={head.group_name_de} groupAr={head.group_name_ar} size={size} />
            <div className="space-y-1.5">
              {mods.map((mod) => (
                <ValuePair key={`${mod.name_de}-${mod.id ?? idx}`} nameDe={mod.name_de} nameAr={mod.name_ar} size={size} />
              ))}
            </div>
          </div>
        )
      })}

      {snapshot.customer_note ? (
        <div>
          <GroupHeader
            groupDe={CUSTOMER_NOTE_LABEL.group_name_de}
            groupAr={CUSTOMER_NOTE_LABEL.group_name_ar}
            size={size}
          />
          <p className={cn(size === "sm" ? "text-xs font-semibold" : "text-sm font-bold", "break-words")}>
            {snapshot.customer_note}
          </p>
        </div>
      ) : null}
    </div>
  )
}
