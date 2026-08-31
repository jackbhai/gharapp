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
      manifest: {
        name: 'GharApp',
        short_name: 'GharApp',
        description: 'Local-first household management',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: process.env.VITE_BASE_PATH || '/',
        scope: process.env.VITE_BASE_PATH || '/',
        icons: [],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
