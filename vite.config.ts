import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    netlify(),
    tanstackStart(),
    viteReact(),
  ],
  // Pre-bundle the deps that the TanStack Start client entry pulls in at runtime.
  // Without this, Vite discovers them mid-session and triggers a re-optimize; on
  // Windows that re-optimize's atomic rename of node_modules/.vite/deps can fail
  // with EPERM (Defender/AV or a file lock), leaving the client stuck on
  // "504 Outdated Optimize Dep" so the app never hydrates. Declaring them here
  // folds them into the single startup optimize pass and avoids the churn.
  optimizeDeps: {
    include: [
      '@tanstack/router-core',
      '@tanstack/router-core/ssr/client',
      '@tanstack/react-router',
      '@tanstack/react-store',
      '@tanstack/store',
      'seroval',
    ],
  },
})

export default config
