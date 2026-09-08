import { defineConfig } from 'tsup'

const config = defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    treeshake: true,
  },
  {
    entry: { cli: 'src/cli/index.ts' },
    format: ['esm'],
    dts: false,
    sourcemap: true,
    target: 'es2022',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
])

export default config
