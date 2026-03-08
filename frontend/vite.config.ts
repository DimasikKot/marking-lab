import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Важно для Docker
    port: 5173,
    watch: { usePolling: true } // Для корректного отслеживания изменений в контейнере
  }
})
