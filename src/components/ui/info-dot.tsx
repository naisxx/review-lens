import { Info, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Tooltip } from './tooltip'

export interface DrillAction {
  label: string
  onClick: () => void
}

/**
 * Info affordance for card headers / KPIs.
 * - Description-only: hover tooltip (default).
 * - With a `drill` action: becomes a click-to-open popover that both *describes*
 *   the area and offers a clickable drill (e.g. "view the reviews behind this").
 */
export function InfoDot({
  content,
  drill,
}: {
  content: ReactNode
  drill?: DrillAction
}) {
  if (!drill) {
    return (
      <Tooltip content={content}>
        <button
          type="button"
          aria-label="More information"
          className="text-ink-faint transition-colors hover:text-ink-muted"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
    )
  }

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        aria-label="Describe and drill into this area"
        title="Describe & drill in"
        className="inline-flex items-center gap-1 rounded-md bg-brand/15 px-1.5 py-[3px] text-[9px] font-semibold uppercase tracking-wide text-brand outline-none ring-1 ring-brand/45 shadow-[0_0_10px_-2px_rgba(45,208,189,0.5)] transition-all hover:bg-brand/25 hover:ring-brand/70 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/70"
      >
        <Info className="h-3 w-3" />
        Drill
        <ArrowUpRight className="h-3 w-3" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 w-[248px] rounded-lg border border-line-strong bg-surface-3 p-3 shadow-2xl shadow-black/50"
        >
          <div className="text-[11.5px] leading-snug text-ink-muted">{content}</div>
          <button
            type="button"
            onClick={() => drill.onClick()}
            className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-medium text-ink outline-none transition-colors hover:border-brand/50 hover:text-brand"
          >
            <span className="truncate">{drill.label}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          </button>
          <PopoverPrimitive.Arrow className="fill-surface-3" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
