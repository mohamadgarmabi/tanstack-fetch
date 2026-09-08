import { defineConfig } from 'tsup'

const config = defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      react: 'src/react/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    treeshake: true,
    external: ['react', 'react/jsx-runtime'],
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
