import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageShellProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  grain?: boolean
}

export function PageShell({ children, className, contentClassName, grain = true }: PageShellProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen mesh-page-bg overflow-x-hidden",
        grain && "grain-overlay",
        className,
      )}
    >
      <div className={cn("relative z-[2] flex min-h-screen flex-col", contentClassName)}>{children}</div>
    </div>
  )
}
