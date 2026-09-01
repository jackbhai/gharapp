import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const previewHostPlugin = () => ({
  name: 'gharapp-preview-host',
  configResolved(config: { server: { allowedHosts: true | string[] }; preview: { allowedHosts: true | string[] } }) {
    config.server.allowedHosts = true;
    config.preview.allowedHosts = true;
  },
});

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'] },
  preview: { host: '0.0.0.0', allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'] },
  plugins: [
    previewHostPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'],
      manifest: {
        name: 'GharApp',
        short_name: 'GharApp',
        description: 'Local-first household management',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: process.env.VITE_BASE_PATH || '/',
        scope: process.env.VITE_BASE_PATH || '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: `${process.env.VITE_BASE_PATH || '/'}index.html`,
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/gh\/jackbhai\/gharapp-image-factory\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gharapp-food-images',
            expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 180 },
            cacheableResponse: { statuses: [0, 200] },
          },
        }],
      },
    }),
  ],
});
