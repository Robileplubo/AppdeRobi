import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    /* VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['graphic/surfscore_logo.png'],
      manifest: {
        name: 'SurfScore',
        short_name: 'SurfScore',
        description: 'Application de score de surf en temps réel',
        theme_color: '#0ea5e9',
        background_color: '#f0f9ff',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['weather', 'sports', 'lifestyle'],
        icons: [
          {
            src: 'graphic/surfscore_logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'graphic/surfscore_logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'graphic/surfscore_logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }) */
  ],
  server: {
    port: 5173,
    open: true
  },
  build: {
    target: 'esnext', // Optimisation pour les navigateurs modernes
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-leaflet', 'leaflet'],
          ui: ['framer-motion', '@heroicons/react']
        }
      }
    }
  }
}) 