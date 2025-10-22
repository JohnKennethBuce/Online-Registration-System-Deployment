import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'stats.html', // visualize bundle size after build
      open: false,            // set to true to open automatically after build
      gzipSize: true,
      brotliSize: true,
      base: '/',
    }),
  ],

  // Base path for deployment
  base: '/', // Change this if your app is hosted in a subfolder, e.g., '/my-app/'

  // Dev server config (CORS-safe proxy)
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/storage': 'http://127.0.0.1:8000',
    },
  },

  // Production build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    sourcemap: true,

    // 🧩 Increase limit so you don't see warnings unnecessarily
    chunkSizeWarningLimit: 2000,

    // 🪄 Smart chunk splitting: separates vendor + heavy libs
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor'
            if (id.includes('axios')) return 'axios-vendor'
            if (id.includes('chart.js')) return 'chart-vendor'
            if (id.includes('recharts')) return 'recharts-vendor'
            if (id.includes('@mui') || id.includes('shadcn')) return 'ui-vendor'
            return 'vendor'
          }
        },
      },
    },
  },

  // Environment variable injection
  define: {
    'process.env': {
      NODE_ENV: process.env.NODE_ENV || 'development',
    },
  },
})
