import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Shape-matching skeleton block with a soft shimmer. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-3/70',
        className,
      )}
      {...props}
    />
  )
}
