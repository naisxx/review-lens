import { useState, type ReactNode } from 'react'
import {
  Bell,
  Boxes,
  FileBarChart,
  LayoutDashboard,
  Layers,
  MapPin,
  PackageX,
  PanelsTopLeft,
  Star,
  Store,
  Tag,
  Target,
  Sparkles,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react'
import { useFilters } from '@/components/providers/FilterProvider'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  icon: LucideIcon
  badge?: number
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Shelf Share', icon: PanelsTopLeft },
  { label: 'White Space', icon: Target },
  { label: 'Assortment', icon: Boxes },
  { label: 'Pricing', icon: Tag },
  { label: 'Reviews', icon: Star },
  { label: 'Stockouts', icon: PackageX },
  { label: 'Alerts', icon: Bell, badge: 3 },
  { label: 'Reports', icon: FileBarChart },
]

function ScopeField({
  icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  const Icon = icon
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      {children}
    </div>
  )
}

export function Sidebar() {
  const [active, setActive] = useState('Overview')
  const { filters, toggleMulti, reset, dict } = useFilters()

  const renderItem = (item: NavItem) => {
    const isActive = active === item.label
    return (
      <button
        key={item.label}
        type="button"
        onClick={() => setActive(item.label)}
        className={cn(
          'group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-surface-3 text-ink'
            : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-brand" />
        )}
        <item.icon
          className={cn(
            'h-4 w-4 shrink-0',
            isActive ? 'text-brand' : 'text-ink-faint group-hover:text-ink-muted',
          )}
        />
        <span className="truncate">{item.label}</span>
        {item.badge !== undefined && (
          <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-danger/20 px-1 text-[10px] font-semibold text-danger tabular">
            {item.badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <aside className="flex h-full w-[228px] shrink-0 flex-col border-r border-line bg-surface">
      {/* Brand mark */}
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-[13px]">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dim/25 ring-1 ring-brand/30">
          <Sparkles className="h-4 w-4 text-brand" />
          <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5" />
        </div>
        <div className="leading-none">
          <div className="text-[14px] font-semibold tracking-tight text-ink">Review Lens</div>
          <div className="mt-0.5 text-[10px] tracking-wide text-ink-faint">by DataLadder.ai</div>
        </div>
      </div>

      <nav className="space-y-0.5 overflow-y-auto px-2.5 py-3">
        {PRIMARY_NAV.map(renderItem)}
      </nav>

      {/* Scope Filters */}
      <div className="mt-auto space-y-3 border-t border-line px-3 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-muted">
            <Layers className="h-3.5 w-3.5 text-brand" />
            Scope Filters
          </div>
        </div>

        <ScopeField icon={Store} label="Retailer">
          <Select value={dict.retailer} onValueChange={() => undefined}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={dict.retailer}>{dict.retailer}</SelectItem>
            </SelectContent>
          </Select>
        </ScopeField>

        <ScopeField icon={Tag} label="Category">
          <Select value={dict.category} onValueChange={() => undefined}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={dict.category}>{dict.category}</SelectItem>
            </SelectContent>
          </Select>
        </ScopeField>

        <ScopeField icon={Layers} label="Subcategory">
          <MultiSelect
            label="Subcategory"
            options={dict.subcategories}
            selected={filters.subcategories}
            onToggle={(v) => toggleMulti('subcategories', v)}
            allLabel="All subcategories"
          />
        </ScopeField>

        <ScopeField icon={MapPin} label="Store / Region">
          <MultiSelect
            label="Store / Region"
            options={dict.regions}
            selected={filters.regions}
            onToggle={(v) => toggleMulti('regions', v)}
            allLabel="All regions"
          />
        </ScopeField>

        <button
          type="button"
          onClick={reset}
          className="flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-brand"
        >
          <RotateCcw className="h-3 w-3" />
          Clear all filters
        </button>
      </div>
    </aside>
  )
}
