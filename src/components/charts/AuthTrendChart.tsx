import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AuthTrendDatum } from '@/types'
import { CHART, ChartTooltip, BRAND_TEAL } from './chart-theme'

interface TooltipProps {
  active?: boolean
  payload?: { payload: AuthTrendDatum }[]
}

function TrendTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <ChartTooltip
      title={d.label}
      rows={[
        { label: 'Focus brand', value: `${Math.round(d.brandScore)}`, color: BRAND_TEAL },
        { label: 'Category avg', value: `${Math.round(d.categoryScore)}`, color: CHART.muted },
      ]}
    />
  )
}

/** Monthly authenticity score: focus brand vs. category average. */
export function AuthTrendChart({ data }: { data: AuthTrendDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: CHART.axis }}
          tickLine={false}
          axisLine={{ stroke: CHART.grid }}
          minTickGap={24}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: CHART.axis }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip content={<TrendTooltip />} />
        <Line
          type="monotone"
          dataKey="categoryScore"
          stroke={CHART.muted}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="brandScore"
          stroke={BRAND_TEAL}
          strokeWidth={2}
          dot={{ r: 2, fill: BRAND_TEAL, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
          isAnimationActive
          animationDuration={500}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
