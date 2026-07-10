import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide tabular whitespace-nowrap ring-1 ring-inset',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-3 text-ink-muted ring-line-strong',
        positive: 'bg-positive/12 text-positive ring-positive/25',
        warning: 'bg-warning/12 text-warning ring-warning/25',
        danger: 'bg-danger/12 text-danger ring-danger/25',
        brand: 'bg-brand/12 text-brand ring-brand/25',
        info: 'bg-native/12 text-native ring-native/25',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
