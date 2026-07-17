"use client"

import type { ReactNode } from "react"
import { QrTableMenuProvider } from "@/components/menu/qr/QrTableMenuProvider"

export default function TableMenuLayout({ children }: { children: ReactNode }) {
  return (
    <QrTableMenuProvider>
      <div data-qr-table-menu className="qr-table-menu-theme min-h-dvh">
        {children}
      </div>
    </QrTableMenuProvider>
  )
}
