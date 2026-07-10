import { createFileRoute } from '@tanstack/react-router'
import { ReviewSource } from '@/components/dashboard/ReviewSource'

export const Route = createFileRoute('/review-source')({
  head: () => ({
    meta: [{ title: 'Review Lens — Authenticity & Review Source Analysis' }],
  }),
  component: ReviewSource,
})
