import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { decodeCells } from '@/lib/analytics'
import type { Cell, CubePayload, Filters } from '@/types'

interface FilterContextValue {
  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  toggleMulti: (key: 'subcategories' | 'regions', value: string) => void
  reset: () => void
  dict: CubePayload['dict']
  meta: CubePayload['meta']
  cells: Cell[]
}

const FilterContext = createContext<FilterContextValue | null>(null)

type Action =
  | { type: 'set'; key: keyof Filters; value: Filters[keyof Filters] }
  | { type: 'toggle'; key: 'subcategories' | 'regions'; value: string }
  | { type: 'reset'; value: Filters }

function reducer(state: Filters, action: Action): Filters {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value }
    case 'toggle': {
      const current = state[action.key]
      const next = current.includes(action.value)
        ? current.filter((v) => v !== action.value)
        : [...current, action.value]
      return { ...state, [action.key]: next }
    }
    case 'reset':
      return action.value
  }
}

export function FilterProvider({
  payload,
  initialBrand,
  children,
}: {
  payload: CubePayload
  /** Optional deep-link brand (e.g. from `?brand=`); matched case-insensitively. */
  initialBrand?: string
  children: ReactNode
}) {
  const cells = useMemo(() => decodeCells(payload), [payload])

  // Default focus brand = deep-linked `?brand=` if it resolves to a real corpus
  // brand, else the highest-volume brand.
  const defaultFilters = useMemo<Filters>(() => {
    const vol = new Map<number, number>()
    for (const c of cells) vol.set(c.b, (vol.get(c.b) ?? 0) + c.n)
    const topIdx = [...vol.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0
    const linked = initialBrand
      ? payload.dict.brands.find((b) => b.toLowerCase() === initialBrand.toLowerCase())
      : undefined
    return {
      brand: linked ?? payload.dict.brands[topIdx],
      subcategories: [],
      regions: [],
      time: 'all',
      benchmark: 'category-average',
    }
  }, [cells, payload.dict.brands, initialBrand])

  const [filters, dispatch] = useReducer(reducer, defaultFilters)

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      setFilter: (key, val) => dispatch({ type: 'set', key, value: val }),
      toggleMulti: (key, val) => dispatch({ type: 'toggle', key, value: val }),
      reset: () => dispatch({ type: 'reset', value: defaultFilters }),
      dict: payload.dict,
      meta: payload.meta,
      cells,
    }),
    [filters, defaultFilters, payload.dict, payload.meta, cells],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider')
  return ctx
}
