import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Accessible multi-select built on Radix Popover. Used for filters that accept
 * several values at once (subcategory, region). Empty selection means "All".
 */
export function MultiSelect({
  label,
  options,
  selected,
  onToggle,
  allLabel = 'All',
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  allLabel?: string
}) {
  const summary =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-surface-2 px-2.5 py-1.5 text-[12.5px] text-ink outline-none transition-colors',
          'hover:border-brand/40 focus:border-brand/50 focus:ring-2 focus:ring-brand/20 data-[state=open]:border-brand/50',
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[200px] overflow-hidden rounded-lg border border-line-strong bg-surface-3 p-1 shadow-2xl shadow-black/50"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            {label}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {options.map((opt) => {
              const active = selected.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onToggle(opt)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] outline-none transition-colors',
                    active ? 'text-brand' : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-3.5 w-3.5 items-center justify-center rounded border',
                      active ? 'border-brand bg-brand/20' : 'border-line-strong',
                    )}
                  >
                    {active && <Check className="h-2.5 w-2.5 text-brand" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              )
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
