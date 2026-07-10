import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-md text-[12.5px] font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-surface-3 text-ink border border-line-strong hover:bg-surface-2 hover:border-brand/40 active:scale-[0.98]',
        brand:
          'bg-brand-dim text-white border border-brand/40 hover:bg-brand-dim/80 active:scale-[0.98]',
        ghost: 'text-ink-muted hover:bg-surface-2 hover:text-ink',
      },
      size: {
        sm: 'h-7 px-2.5',
        md: 'h-8 px-3',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
