import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { DriverDatum } from '@/types'
import { formatInt, formatPercent, formatSignedPoints } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ChartTooltip, DRIVER_COLORS } from './chart-theme'

interface TooltipProps {
  active?: boolean
  payload?: { payload: DriverDatum }[]
}

function DriverTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <ChartTooltip
      title={d.label}
      rows={[
        { label: 'Brand share', value: formatPercent(d.brandShare, 1) },
        { label: 'Category avg', value: formatPercent(d.categoryShare, 1) },
        { label: 'Delta', value: `${formatSignedPoints(d.delta * 100)}pp` },
      ]}
    />
  )
}

/** Customer-driver composition for the focus brand, with the mention base in the hub. */
export function DriverDonut({ data, total }: { data: DriverDatum[]; total: number }) {
  // Fade the centre label out while a slice is hovered so the tooltip (which
  // overlaps the hub) never reads as tangled with the total.
  const [hoveringSlice, setHoveringSlice] = useState(false)

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="brandShare"
            nameKey="label"
            innerRadius="64%"
            outerRadius="90%"
            paddingAngle={1.5}
            stroke="#10141c"
            strokeWidth={2}
            isAnimationActive
            animationDuration={500}
            onMouseEnter={() => setHoveringSlice(true)}
            onMouseLeave={() => setHoveringSlice(false)}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={DRIVER_COLORS[d.index]} />
            ))}
          </Pie>
          <Tooltip content={<DriverTooltip />} wrapperStyle={{ zIndex: 30 }} />
        </PieChart>
      </ResponsiveContainer>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 transition-opacity duration-150',
          hoveringSlice ? 'opacity-0' : 'opacity-100',
        )}
      >
        <div className="tabular text-[16px] font-semibold leading-none tracking-tight text-ink">
          {formatInt(total)}
        </div>
        <div className="mt-1 max-w-[72px] text-center text-[8px] uppercase leading-tight tracking-wide text-ink-faint">
          detected drivers
        </div>
      </div>
    </div>
  )
}
