import { createServerFn } from '@tanstack/react-start'
import cube from '@/data/cube.json'
import type { CubePayload } from '@/types'

/**
 * Serves the pre-aggregated analytics cube. The heavy raw review corpus
 * (~85MB / 75.8k reviews) is collapsed at build time into a compact cube
 * (~0.5MB) at the (brand, subcategory, region, month) grain, so all filtering
 * and metric derivation happens instantly on the client without shipping raw data.
 */
export const getCube = createServerFn({ method: 'GET' }).handler(async () => {
  return cube as CubePayload
})
