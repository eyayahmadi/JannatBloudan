import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Variants alignés sur les classes globales (voir `app/globals.css`):
 * — .btn-primary, .btn-secondary, .btn-outline, .btn-danger, .btn-cta
 * — .btn-ghost, .btn-lux-*, + modificateur .btn-icon
 */
const buttonVariants = cva(
  "focus-visible:outline-none data-[state=open]:ring-[color:var(--lux-gold)]/30",
  {
    variants: {
      variant: {
        default: "btn-primary",
        destructive: "btn-danger",
        outline: "btn-outline",
        secondary: "btn-secondary",
        ghost: "btn-ghost",
        link: "!inline-flex !h-auto !min-h-0 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm !p-0 !font-medium text-[color:var(--lux-bordeaux)] underline-offset-4 transition hover:underline focus-visible:ring-0 focus-visible:ring-offset-0",
        gold: "btn-cta",
        luxPanel: "btn-lux-panel",
        luxOutlineBordeaux: "btn-lux-ob",
        heroGlass: "btn-hero-glass",
      },
      size: {
        default: "px-4 py-2 has-[>svg]:px-3.5",
        sm: "gap-1.5 rounded-lg px-3 text-xs has-[>svg]:px-2.5",
        lg: "rounded-xl px-6 text-sm has-[>svg]:px-4",
        xl: "min-h-12 rounded-xl px-8 text-base has-[>svg]:px-6",
        pill: "rounded-full px-6 has-[>svg]:px-5",
        pillSm: "gap-1.5 rounded-full px-4 text-sm has-[>svg]:px-3.5",
        hero: "min-h-14 gap-2.5 rounded-full px-8 py-4 text-base",
        panel: "rounded-full border-2 px-6 py-3 text-sm",
        panelSm: "min-h-11 gap-2 rounded-full px-5 py-3 text-sm",
        headerGold: "h-auto min-h-9 gap-2 rounded-full px-5 py-2.5 text-sm font-semibold",
        chip: "h-auto min-h-9 gap-1 rounded-full px-4 py-2 text-sm",
        icon: "btn-icon",
        'icon-sm': "btn-icon min-h-9 min-w-9 p-0 sm:min-h-8 sm:min-w-8",
        'icon-lg': "btn-icon min-h-12 min-w-12 p-0 sm:min-h-11 sm:min-w-11",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
