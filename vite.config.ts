import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function razorpayIconProxy(middlewares: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  middlewares.use(async (req: any, res: any, next: () => void) => {
    if (!/^\/\d+\.png(\?.*)?$/.test(req.url ?? '')) return next()
    try {
      const upstream = await fetch(`https://cdn.razorpay.com/bank${req.url}`)
      if (!upstream.ok) { res.statusCode = upstream.status; res.end(); return }
      const buf = await upstream.arrayBuffer()
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' })
      res.end(new Uint8Array(buf))
    } catch { res.writeHead(502); res.end() }
  })
}

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
    base: '/blood-test/',
    define: defineFromEnv,
    envDir: __dirname,
    plugins: [tailwindcss(), react(), {
      name: 'root-redirect',
      configureServer(s: any) {
        s.middlewares.use((req: any, res: any, next: () => void) => {
          if (req.url === '/') { res.writeHead(302, { Location: '/blood-test/' }); res.end(); return }
          next()
        })
      },
    }, {
      name: 'razorpay-icon-proxy',
      configureServer(s: any) { razorpayIconProxy(s.middlewares) },
      configurePreviewServer(s: any) { razorpayIconProxy(s.middlewares) },
    }],
    preview: { port: 4173, strictPort: true },
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/auth': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/member': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/cart': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/order': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/report': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/test': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/package': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/address': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/slot': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/thyrocare': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/pincode': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
        '/upload': { target: 'https://7qmg64nu2z.ap-south-1.awsapprunner.com', changeOrigin: true, secure: true },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
    build: {
      chunkSizeWarningLimit: 1800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/mapbox-gl')) return 'vendor-mapbox'
            if (
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor')
            ) return 'vendor-charts'
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router')
            ) return 'vendor-react'
          },
        },
      },
    },
  }
})
