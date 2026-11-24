import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // host: true = accessible depuis le téléphone sur le même Wi-Fi (http://<adresse du PC>:5196)
  // /sb relaie la base Supabase locale : le téléphone n'a besoin que du port 5196 (pas de pare-feu à ouvrir).
  server: {
    port: 5196, strictPort: true, host: true,
    proxy: { '/sb': { target: 'http://127.0.0.1:55621', changeOrigin: true, ws: true, rewrite: (p) => p.replace(/^\/sb/, '') } },
  },
  preview: { port: 5197, strictPort: true, host: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'chargement-devi.svg'],
      manifest: {
        name: 'Yissolimon',
        short_name: 'Yissolimon',
        description: 'Amélioration continue des garderies communautaires',
        lang: 'fr',
        theme_color: '#6C4CF1',
        background_color: '#F4F2FE',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/sb\//],
      },
    }),
  ],
})
