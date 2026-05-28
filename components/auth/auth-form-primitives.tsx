"use client"

import { useState, type ComponentType, type ReactNode } from "react"
import type { LucideProps } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const AUTH_CARD_CLS =
  "animate-fade-up border-white/40 bg-white/85 p-8 shadow-[0_24px_70px_-28px_rgba(67,20,7,0.35)] backdrop-blur-xl sm:p-10"

export const GOLD_SUBMIT_CLASSES = cn(
  "group relative h-auto min-h-[3.25rem] w-full overflow-hidden rounded-full border border-amber-950/10",
  "bg-gradient-to-b from-amber-200/95 via-[color:var(--lux-gold)] to-amber-700/95",
  "py-4 text-[15px] font-semibold tracking-[0.04em] text-amber-950",
  "shadow-[0_16px_44px_-14px_rgba(100,55,10,0.55),inset_0_1px_0_rgba(255,255,255,0.35)]",
  "transition-[transform,box-shadow,filter] duration-200",
  "hover:brightness-[1.02] hover:shadow-[0_20px_52px_-14px_rgba(100,55,10,0.58)]",
  "active:scale-[0.992] active:brightness-[0.98]",
  "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
  "before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-t before:from-transparent before:to-white/25 before:opacity-60",
)

type IconType = ComponentType<LucideProps>

export function AuthFloatingField(props: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  autoComplete?: string
  minLength?: number
  Icon?: IconType
  endAdornment?: ReactNode
  disabled?: boolean
}) {
  const {
    id,
    label,
    type = "text",
    value,
    onChange,
    required,
    autoComplete,
    minLength,
    Icon,
    endAdornment,
    disabled,
  } = props
  const [focused, setFocused] = useState(false)
  const raised = focused || value.length > 0
  const padStart = Icon ? "pl-[2.875rem]" : "pl-4"
  const padEnd = endAdornment ? "pr-12" : "pr-4"

  return (
    <div className="relative">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-white/[0.93] shadow-[0_1px_0_rgba(255,255,255,0.65)_inset] transition-[border-color,box-shadow] duration-200",
          focused
            ? "border-amber-800/40 ring-2 ring-amber-900/[0.09]"
            : "border-amber-900/[0.11] hover:border-amber-900/20",
        )}
      >
        {Icon ? (
          <span className="pointer-events-none absolute left-0 top-0 flex h-full w-[2.875rem] items-center justify-center text-amber-900/30">
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
          </span>
        ) : null}
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute z-[1] max-w-[calc(100%-1.5rem)] origin-left truncate text-amber-950/90 transition-all duration-200 ease-out",
            Icon ? "left-[2.875rem]" : "left-4",
            raised
              ? "top-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800/60"
              : "top-1/2 -translate-y-1/2 text-[15px] font-normal text-amber-900/38",
          )}
        >
          {label}
        </label>
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          disabled={disabled}
          aria-label={label}
          className={cn(
            "h-[3.5rem] w-full rounded-2xl border-0 bg-transparent text-[15px] text-amber-950 shadow-none ring-0",
            "selection:bg-amber-200/50",
            "focus-visible:border-0 focus-visible:ring-0",
            padStart,
            padEnd,
            "pb-2.5 pt-[1.45rem]",
            "caret-amber-900",
          )}
        />
        {endAdornment ? (
          <div className="pointer-events-auto absolute right-1.5 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center">
            {endAdornment}
          </div>
        ) : null}
      </div>
    </div>
  )
}
