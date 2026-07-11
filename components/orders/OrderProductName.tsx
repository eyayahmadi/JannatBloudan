"use client"

import {
  orderProductNameClassNames,
  resolveOrderProductNames,
  type BilingualOrderProduct,
} from "@/lib/orders/order-product-name"
import { cn } from "@/lib/utils"

export type OrderProductNameProps = BilingualOrderProduct & {
  className?: string
  size?: "sm" | "md"
  truncate?: boolean
  /** Affiche uniquement le libellé principal (ex. refuse dialog titre). */
  primaryOnly?: boolean
}

/** Nom produit commandé : allemand (gras) + arabe en dessous. */
export function OrderProductName({
  className,
  size = "sm",
  truncate = false,
  primaryOnly = false,
  ...item
}: OrderProductNameProps) {
  const { de, ar } = resolveOrderProductNames(item)
  const classes = orderProductNameClassNames(size, truncate)

  if (!de) {
    return <span className={cn("text-muted-foreground", className)}>—</span>
  }

  return (
    <div className={cn(classes.root, className)}>
      <p className={classes.de} dir="ltr">
        {de}
      </p>
      {!primaryOnly && ar ? (
        <p className={classes.ar} dir="rtl">
          {ar}
        </p>
      ) : null}
    </div>
  )
}
