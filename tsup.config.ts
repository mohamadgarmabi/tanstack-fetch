import { defineConfig } from 'tsup'

const shared = {
  format: ['esm', 'cjs'] as const,
  dts: true,
  sourcemap: true,
  target: 'es2022' as const,
  treeshake: true,
  external: ['react', 'react/jsx-runtime'],
}

const config = defineConfig([
  {
    ...shared,
    entry: ['src/index.ts'],
    clean: true,
  },
  {
    ...shared,
    entry: { react: 'src/react/index.ts' },
    clean: false,
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
