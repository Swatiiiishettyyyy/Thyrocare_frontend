import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /** Merge root `.env` and `src/config/.env` so Mapbox token works in either place (`src/config` wins). */
  const fromRoot = loadEnv(mode, __dirname, '')
  const fromSrcConfig = loadEnv(mode, path.resolve(__dirname, 'src/config'), '')
  const mergedVite = { ...fromRoot, ...fromSrcConfig }
  const defineFromEnv = Object.fromEntries(
    Object.entries(mergedVite)
      .filter(([key]) => key.startsWith('VITE_'))
      .map(([key, val]) => [`import.meta.env.${key}`, JSON.stringify(val)] as const),
  )

  return {
    // Deployed under the main web app at https://host/labtest/ (see nucleotide-web-app).
    base: '/labtest/',
    define: defineFromEnv,
    envDir: __dirname,
    plugins: [tailwindcss(), react()],
    server: {
      port: 5173,
      strictPort: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
