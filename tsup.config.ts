import { defineConfig } from 'tsup'

const config = defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      sse: 'src/sse/index.ts',
      plugins: 'src/plugins-entry.ts',
      react: 'src/react/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: false,
    minify: true,
    clean: true,
    target: 'es2022',
    treeshake: true,
    splitting: false,
    external: ['react', 'react/jsx-runtime', 'yaml', 'tanstack-fetch', 'tanstack-fetch/sse'],
  },
  {
    entry: { cli: 'src/cli/index.ts' },
    format: ['esm'],
    dts: false,
    sourcemap: false,
    minify: true,
    target: 'es2022',
    external: ['yaml'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
])

export default config
