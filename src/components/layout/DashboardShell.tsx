import { useEffect, useRef, type ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** App frame: fixed sidebar + scrollable main column (header, content). */
export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const mainRef = useRef<HTMLElement>(null)

  // The scroll container is <main>, not window, so router navigation doesn't
  // reset it. Scroll to top whenever the route changes so drill-downs / links
  // always land at the top of the destination page rather than mid-scroll.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-canvas canvas-grid text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main ref={mainRef} className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mx-auto max-w-[1760px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
