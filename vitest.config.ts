import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const config = defineConfig({
  resolve: {
    alias: {
      'tanstack-fetch': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      'tanstack-fetch/sse': fileURLToPath(new URL('./src/sse/index.ts', import.meta.url)),
      'tanstack-fetch/plugins': fileURLToPath(new URL('./src/plugins-entry.ts', import.meta.url)),
      'tanstack-fetch/react': fileURLToPath(new URL('./src/react/index.ts', import.meta.url)),
      'tanstack-fetch/vue': fileURLToPath(new URL('./src/vue/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})

export default config
