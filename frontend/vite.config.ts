import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ponytail: dev proxy so the relative /api base reaches the FastAPI backend on :8040
  server: {
    proxy: {
      '/api': 'http://localhost:8040',
    },
  },
})
