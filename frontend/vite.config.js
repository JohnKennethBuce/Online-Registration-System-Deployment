import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Configure base path for deployment (helpful for deployment on subpaths)
  base: '/', // Change this if your app is hosted in a subfolder, e.g., '/my-app/'

  // Server configuration (you can add proxy for development)
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000', // API Proxy during development to avoid CORS
    },
  },

  // Build configuration (you can customize this for production builds)
  build: {
    outDir: 'dist', // Output directory for build files
    assetsDir: 'assets', // Directory to store static assets
    minify: 'esbuild', // Minify output for production
    sourcemap: true, // Enable source maps for debugging
  },

  // Define environment variables (useful for different environments like dev, prod)
  define: {
    'process.env': {
      NODE_ENV: process.env.NODE_ENV || 'development', // Set NODE_ENV dynamically
    },
  },
})
