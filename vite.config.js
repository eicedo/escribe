import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // force ALL IPs
    port: 5173,
    strictPort: true,
    open: false,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})

