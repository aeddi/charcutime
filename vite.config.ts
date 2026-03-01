import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // we provide our own public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'cdn-cache' },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  base: '/charcutime/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
