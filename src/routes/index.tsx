import { createFileRoute } from '@tanstack/react-router'
import { getCube } from '@/server/cube.functions'
import { FilterProvider } from '@/components/providers/FilterProvider'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Overview } from '@/components/dashboard/Overview'

export const Route = createFileRoute('/')({
  loader: async () => {
    const cube = await getCube()
    return { cube }
  },
  staleTime: Infinity,
  component: Home,
})

function Home() {
  const { cube } = Route.useLoaderData()
  return (
    <FilterProvider payload={cube}>
      <DashboardShell>
        <Overview />
      </DashboardShell>
    </FilterProvider>
  )
}
