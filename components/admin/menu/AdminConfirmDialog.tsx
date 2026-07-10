"use client"

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AdminConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirming?: boolean
  destructive?: boolean
  children?: ReactNode
}

/**
 * Confirmation admin — portal Radix, centré viewport (z-index élevé).
 * Évite les conflits transform Framer + translate Tailwind.
 */
export function AdminConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  confirming = false,
  destructive = false,
  children,
}: AdminConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !confirming) onClose()
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed top-[50%] left-[50%] z-[9999] flex w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none dark:bg-slate-900",
            "max-h-[min(90dvh,640px)] -translate-x-1/2 -translate-y-1/2",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200",
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
            <AlertDialogPrimitive.Title className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </AlertDialogPrimitive.Title>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            {children ? (
              <AlertDialogPrimitive.Description className="sr-only">
                Bestätigung erforderlich
              </AlertDialogPrimitive.Description>
            ) : null}
            {children}
            {description ? (
              <AlertDialogPrimitive.Description asChild>
                <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
              </AlertDialogPrimitive.Description>
            ) : null}
          </div>

          <div className="flex gap-2 border-t px-5 py-4">
            <AlertDialogPrimitive.Cancel asChild>
              <Button type="button" variant="outline" className="flex-1" disabled={confirming}>
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button
              type="button"
              className={cn("flex-1", destructive && "bg-red-600 hover:bg-red-700")}
              disabled={confirming}
              onClick={onConfirm}
            >
              {confirming ? "…" : confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
