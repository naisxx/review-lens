import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { getCube } from '@/server/cube.functions'
import { FilterProvider } from '@/components/providers/FilterProvider'
import { DashboardShell } from '@/components/layout/DashboardShell'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Review Lens — Executive Review Overview' },
      {
        name: 'description',
        content:
          'Executive review benchmark and review-source authenticity: brand-vs-competitor rating health, verified vs. unverified behaviour, customer drivers, source mix and confidence signals.',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;450;500;600;700&display=swap',
      },
    ],
  }),
  // Cube is loaded once at the root so both pages share it and the filter scope.
  loader: async () => ({ cube: await getCube() }),
  staleTime: Infinity,
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootLayout() {
  const { cube } = Route.useLoaderData()
  return (
    <FilterProvider payload={cube}>
      <DashboardShell>
        <Outlet />
      </DashboardShell>
    </FilterProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
