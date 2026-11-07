import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

declare const process: { env: Record<string, string | undefined> };

// The deploy workflow passes the base path GitHub Pages reports: '/' for the
// custom domain, '/robot-bunnies/' for christopherrbrown3.github.io.
const pagesBase = process.env.BASE_PATH && /^\/([\w.-]+\/)*$/.test(process.env.BASE_PATH)
  ? process.env.BASE_PATH : undefined;

// Which version is installed: package version, the commit GitHub Actions built, and the build date.
const commit = /^[0-9a-f]{7,40}$/i.test(process.env.GITHUB_SHA ?? '') ? (process.env.GITHUB_SHA as string).slice(0, 7) : 'local';

export default defineConfig(({ command, isPreview }) => ({
  // Dev server at '/'; production build and `vite preview` use the Pages path.
  base: command === 'serve' && !isPreview ? '/' : (pagesBase ?? '/robot-bunnies/'),
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
    __APP_COMMIT__: JSON.stringify(commit),
    __APP_BUILT__: JSON.stringify(new Date().toISOString())
  },
  plugins: [
    VitePWA({
      // 'prompt': a new version downloads in the background and waits until someone taps
      // Update (src/updates.ts), instead of reloading the page in the middle of a level.
      registerType: 'prompt',
      includeAssets: ['icons/bunny.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: "Robot Bunnies: Lyla's Spelling Quest",
        short_name: 'Robot Bunnies',
        description: 'A gentle 23-level bunny platformer for practicing weekly spelling words',
        theme_color: '#8051d6',
        background_color: '#f7edff',
        display: 'standalone',
        orientation: 'landscape',
        scope: './',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
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
