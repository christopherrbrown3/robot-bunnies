import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/robot-bunnies/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/bunny.svg'],
      manifest: {
        name: "Robot Bunnies: Lyla's Flower Quest",
        short_name: 'Robot Bunnies',
        description: 'A gentle, educational bunny platform adventure',
        theme_color: '#8051d6',
        background_color: '#f7edff',
        display: 'standalone',
        orientation: 'landscape',
        scope: './',
        start_url: './',
        icons: [
          { src: 'icons/bunny.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,json}'],
        cleanupOutdatedCaches: true
      }
    })
  ],
  build: { target: 'es2020', sourcemap: false },
  server: { port: 5173 }
}));
