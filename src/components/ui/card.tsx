import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Elevated surface panel — the base container for every dashboard module. */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-line bg-surface',
        'shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_1px_2px_0_rgba(0,0,0,0.4)]',
        'transition-colors duration-200',
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-line px-4 py-2.5',
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-muted',
        className,
      )}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />
}
