"use client"

import { memo, useCallback } from "react"
import { QrMenuProductCard } from "@/components/menu/qr/QrMenuProductCard"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"

type QrTableMenuProductCellProps = {
  item: QrMenuItem
  query: string
  inCartQty: number
  isFavorite: boolean
  showLineControls: boolean
  onToggleFavorite: (productId: string) => void
  onOpen: (item: QrMenuItem) => void
  onQuickAdd: (item: QrMenuItem) => void
  onIncrement: (lineId: string) => void
  onDecrement: (lineId: string) => void
  lineId: string | null
}

function QrTableMenuProductCellInner({
  item,
  query,
  inCartQty,
  isFavorite,
  showLineControls,
  onToggleFavorite,
  onOpen,
  onQuickAdd,
  onIncrement,
  onDecrement,
  lineId,
}: QrTableMenuProductCellProps) {
  const handleOpen = useCallback(() => onOpen(item), [onOpen, item])
  const handleQuickAdd = useCallback(() => onQuickAdd(item), [onQuickAdd, item])
  const handleFavorite = useCallback(() => onToggleFavorite(item.id), [onToggleFavorite, item.id])
  const handleInc = useCallback(() => {
    if (lineId) onIncrement(lineId)
  }, [lineId, onIncrement])
  const handleDec = useCallback(() => {
    if (lineId) onDecrement(lineId)
  }, [lineId, onDecrement])

  return (
    <QrMenuProductCard
      item={item}
      query={query}
      inCartQty={inCartQty}
      isFavorite={isFavorite}
      onToggleFavorite={handleFavorite}
      showLineControls={showLineControls}
      onOpen={handleOpen}
      onQuickAdd={handleQuickAdd}
      onIncrement={showLineControls ? handleInc : undefined}
      onDecrement={showLineControls ? handleDec : undefined}
    />
  )
}

export const QrTableMenuProductCell = memo(
  QrTableMenuProductCellInner,
  (a, b) =>
    a.item === b.item &&
    a.inCartQty === b.inCartQty &&
    a.isFavorite === b.isFavorite &&
    a.query === b.query &&
    a.showLineControls === b.showLineControls &&
    a.lineId === b.lineId,
)
