import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    allowedHosts: ['48e2-2a01-e34-ec03-cf30-f164-6bb2-7bfb-bd5f.ngrok-free.app', 'localhost'],
    host: '0.0.0.0',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    hmr: {
      clientPort: 443,
      host: 'localhost'
    }
  }
})
