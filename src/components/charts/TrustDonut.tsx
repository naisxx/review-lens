import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { TrustSegment } from '@/types'
import { formatInt, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ChartTooltip, TRUST_COLORS } from './chart-theme'

interface TooltipProps {
  active?: boolean
  payload?: { payload: TrustSegment }[]
}

function TrustTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <ChartTooltip
      title={d.label}
      rows={[
        { label: 'Reviews', value: formatInt(d.count) },
        { label: 'Share', value: formatPercent(d.share, 1) },
      ]}
    />
  )
}

/** Reviewer Trust Mix donut with the total review count in the hub. */
export function TrustDonut({ data, total }: { data: TrustSegment[]; total: number }) {
  const [hovering, setHovering] = useState(false)
  const active = data.filter((d) => d.count > 0)

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={active}
            dataKey="count"
            nameKey="label"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={1.5}
            stroke="#10141c"
            strokeWidth={2}
            isAnimationActive
            animationDuration={500}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            {active.map((d) => (
              <Cell key={d.key} fill={TRUST_COLORS[d.index]} />
            ))}
          </Pie>
          <Tooltip content={<TrustTooltip />} wrapperStyle={{ zIndex: 30 }} />
        </PieChart>
      </ResponsiveContainer>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 transition-opacity duration-150',
          hovering ? 'opacity-0' : 'opacity-100',
        )}
      >
        <div className="tabular text-[17px] font-semibold leading-none tracking-tight text-ink">
          {formatInt(total)}
        </div>
        <div className="mt-1 text-[8px] uppercase tracking-wide text-ink-faint">
          total reviews
        </div>
      </div>
    </div>
  )
}
