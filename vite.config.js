import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'localhost',
      '*.ngrok-free.app',
      '8642-185-226-32-80.ngrok-free.app',
      '*.ngrok.io',
      '*.ngrok.app'
    ],
    host: '0.0.0.0',
    cors: true
  }
})
