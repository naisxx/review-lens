import { useEffect, useState, type ReactNode } from 'react'

/**
 * Defers rendering until after mount. Charts (Recharts) and count-up animations
 * depend on browser measurement, so they render client-side with a skeleton
 * fallback during SSR/first paint to avoid hydration mismatches.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return <>{mounted ? children : fallback}</>
}
