import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** App frame: fixed sidebar + scrollable main column (header, content). */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas canvas-grid text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mx-auto max-w-[1760px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
