"use client"

import type { ReactNode } from "react"
import { QrTableMenuProvider } from "@/components/menu/qr/QrTableMenuProvider"

export default function TableMenuLayout({ children }: { children: ReactNode }) {
  return <QrTableMenuProvider>{children}</QrTableMenuProvider>
}
