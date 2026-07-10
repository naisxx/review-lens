import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tooltip } from './tooltip'

/** Small info affordance for card headers, mirroring the reference dashboard. */
export function InfoDot({ content }: { content: ReactNode }) {
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
