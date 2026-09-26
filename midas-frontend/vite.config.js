import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // En desarrollo, /api se redirige al backend para que la cookie HttpOnly sea del mismo origen.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
