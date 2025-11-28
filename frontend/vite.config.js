import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Proxy for Ticket Service to bypass missing CORS
      '/api/v1': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})