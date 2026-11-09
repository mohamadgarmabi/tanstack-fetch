// Exports the 5 "Everything around the request" diagrams (HomeBlocks.vue) as standalone animated SVGs in docs/assets/blocks/.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const homeDir = join(root, 'website/.vitepress/theme/home')
const outDir = join(root, 'docs/assets/blocks')
const require = createRequire(join(root, 'website/package.json'))
const { parse, compileScript } = require('@vue/compiler-sfc')

// SSR-render the real component so the export never drifts from the site.
const { descriptor } = parse(readFileSync(join(homeDir, 'HomeBlocks.vue'), 'utf8'), { filename: 'HomeBlocks.vue' })
const { content } = compileScript(descriptor, { id: 'blocks', inlineTemplate: true, templateOptions: { ssr: true } })
const tmp = join(homeDir, '.blocks-ssr.tmp.mts')
writeFileSync(tmp, content.replace(/import ['"]\.\/blocks\.css['"]\s*;?/, ''))
let html
try {
  const { default: component } = await import(tmp)
  const { createSSRApp } = await import(require.resolve('vue'))
  const { renderToString } = await import(require.resolve('vue/server-renderer'))
  html = await renderToString(createSSRApp(component))
} finally {
  rmSync(tmp)
}

const blocksCss = readFileSync(join(homeDir, 'blocks.css'), 'utf8')
const svgCss = blocksCss.slice(blocksCss.indexOf('/* ---------- SVG parts'), blocksCss.indexOf('/* ---------- Layout'))
const reducedMotion = blocksCss.slice(blocksCss.indexOf('@media (prefers-reduced-motion'))
const css = `svg{--vp-font-family-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;--vp-font-family-base:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
${svgCss}${reducedMotion}`

const cards = [...html.matchAll(/<li class="blk[^"]*" style="--c: ?([^";]+);?"[^>]*>[\s\S]*?(<svg[\s\S]*?<\/svg>)[\s\S]*?<h3>[\s\S]*?([A-Z][^<]+)<\/h3>/g)]
if (cards.length !== 5) throw new Error(`expected 5 blocks, found ${cards.length}`)

mkdirSync(outDir, { recursive: true })
cards.forEach(([, color, svg, title], index) => {
  const slug = `${index + 1}-${title.trim().toLowerCase().replace(/\s+/g, '-')}`
  const file = svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(
      /^<svg/,
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" style="--c: ${color}"`,
    )
    .replace(
      /(<svg[^>]*>)/,
      `$1<style>${css}</style>
<defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.09)"/></pattern></defs>
<rect x="-20" y="-20" width="400" height="240" fill="#0e0e10"/><rect x="-20" y="-20" width="400" height="240" fill="url(#dots)"/>`,
    )
    // Margin so glows near the edge are not clipped (the site relies on overflow: visible).
    .replace('viewBox="0 0 360 200"', 'viewBox="-20 -20 400 240"')
  writeFileSync(join(outDir, `${slug}.svg`), `${file}\n`)
  console.log(`${slug}.svg ${(file.length / 1024).toFixed(1)} KB`)
})
