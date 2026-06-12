import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'YieldWise — Nyagatare Yield Prediction',
        short_name: 'YieldWise',
        description: 'Predict bean and rice yields for Nyagatare District farms.',
        theme_color: '#16a34a',
        background_color: '#052e16',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/model-info$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'yieldwise-api' },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/predict':   'http://localhost:5000',
      '/health':    'http://localhost:5000',
      '/model-info': 'http://localhost:5000',
    },
  },
})
