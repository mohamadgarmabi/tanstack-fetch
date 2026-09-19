import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const root = new URL('../dist/', import.meta.url).pathname
const targets = ['index.js', 'sse.js', 'plugins.js', 'react.js', 'trpc.js', 'cli.js']

console.log('tanstack-fetch gzip (minified, no sourcemaps)\n')

for (const name of targets) {
  const raw = readFileSync(join(root, name))
  const gzip = gzipSync(raw, { level: 9 })
  console.log(
    `${name.padEnd(14)} raw ${String(raw.byteLength).padStart(6)}B   gzip ${String(gzip.byteLength).padStart(5)}B`,
  )
}

console.log('\nImport guide:')
console.log('  tanstack-fetch          → index.js   (HTTP only)')
console.log('  tanstack-fetch/sse      → sse.js     (HTTP + SSE)')
console.log('  tanstack-fetch/plugins  → plugins.js')
console.log('  tanstack-fetch/react    → react.js')
console.log('  tanstack-fetch/trpc     → trpc.js')
