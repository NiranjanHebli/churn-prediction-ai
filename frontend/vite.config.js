import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy Azure ML and Local FastAPI requests to avoid CORS issues in development
    proxy: {
      '/api/score': {
        target: 'https://studio-centralindia-jtcho.centralindia.inference.ml.azure.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/score/, '/score'),
        secure: false,
      },
      '/api/score-local': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/score-local/, '/score'),
        secure: false,
      },
    },
  },
})
