import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: '/charcutime/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
