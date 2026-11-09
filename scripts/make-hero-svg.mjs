// Builds docs/assets/tanstack-fetch-hero.svg: same timeline as make-hero-gif.sh (21 steps @ 3fps), pure CSS animation.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const out = join(root, 'docs/assets/tanstack-fetch-hero.svg')
const STEPS = 21
const DURATION = STEPS / 3

// SVG-as-<img> cannot load external files, so the logo is inlined (downscaled with macOS sips to keep it small).
const tmp = join(mkdtempSync(join(tmpdir(), 'hero-')), 'logo.jpg')
execFileSync('sips', ['-Z', '144', join(root, 'docs/assets/tanstack-fetch-logo.jpg'), '--out', tmp], { stdio: 'ignore' })
const logo = `data:image/jpeg;base64,${readFileSync(tmp).toString('base64')}`

const leftLines = [
  `<span class="k">import</span> { <span class="f">createFetch</span> } <span class="k">from</span> <span class="s">'tanstack-fetch'</span>`,
  ``,
  `<span class="k">const</span> api = <span class="f">createFetch</span>({`,
  `  baseUrl: <span class="s">'https://api.example.com'</span>,`,
  `  getToken: () =&gt; localStorage.getItem(<span class="s">'token'</span>),`,
  `})`,
]
const rightLines = [
  `<span class="k">import</span> { <span class="f">useQuery</span> } <span class="k">from</span> <span class="s">'@tanstack/react-query'</span>`,
  ``,
  `<span class="k">const</span> { data } = <span class="f">useQuery</span>({`,
  `  queryKey: [<span class="s">'users'</span>],`,
  `  queryFn: ({ signal }) =&gt;`,
  `    api.get&lt;<span class="t">User[]</span>&gt;(<span class="s">'/users'</span>, { signal }),`,
  `})`,
]

const keyframes = []
// Visible during steps [from, to); hidden otherwise. Returns a class name.
const win = (from, to = STEPS) => {
  const name = `w${from}_${to}`
  if (keyframes.some((k) => k.startsWith(`@keyframes ${name} `))) return name
  const p = (s) => ((s / STEPS) * 100).toFixed(3)
  const e = (s) => (Math.max(0, (s / STEPS) * 100 - 0.001)).toFixed(3)
  const frames = [`0%{opacity:0}`, `${e(from)}%{opacity:0}`, `${p(from)}%{opacity:1}`]
  frames.push(to < STEPS ? `${e(to)}%{opacity:1}` : '', to < STEPS ? `${p(to)}%,100%{opacity:0}` : '100%{opacity:1}')
  keyframes.push(`@keyframes ${name} {${frames.join('')}}`, `.${name}{opacity:0;animation:${name} ${DURATION}s step-end infinite}`)
  return name
}

const cursor = (step) => `<span class="${win(step, step + 1)}"><span class="cursor"></span></span>`
// Same rules as hero-frames.html: left line i appears at step 3+i, right line i at step 9+i; cursor sits on the newest line.
const left = leftLines
  .map((l, i) => `<div class="${win(3 + i)}">${l || '&#160;'}${i < leftLines.length - 1 ? cursor(3 + i) : ''}</div>`)
  .join('')
const right = rightLines
  .map((l, i) => `<div class="${win(9 + i)}">${l || '&#160;'}${i < rightLines.length - 1 ? cursor(9 + i) : ''}</div>`)
  .join('')

const html = `
<div class="scene">
  <div class="brand ${win(1)}">
    <div class="logo"><img src="${logo}" alt="" /></div>
    <h1>tanstack-<span>fetch</span></h1>
    <p class="tagline">Typed Fetch client designed for TanStack Query</p>
  </div>
  <div class="editor ${win(2)}">
    <div class="chrome">
      <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
      <div class="tabs">
        <div class="tab active">api.ts</div>
        <div class="tab">users.tsx<span class="tabbg ${win(9)}">users.tsx</span></div>
      </div>
    </div>
    <div class="panes">
      <div class="pane"><div class="pane-title">api.ts</div><pre>${left}</pre></div>
      <div class="pane"><div class="pane-title">users.tsx</div><pre>${right}</pre>
        <div class="tooltip ${win(16)}"><span class="hint">^?</span> const data: <span class="type">User[]</span></div>
      </div>
    </div>
  </div>
  <div class="foot ${win(17)}">npm i <span>tanstack-fetch</span> @tanstack/react-query</div>
</div>`

const css = `
*{box-sizing:border-box;margin:0;padding:0}
.root{width:1200px;height:760px;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  background:radial-gradient(ellipse 70% 55% at 50% 0%,rgba(255,122,24,.22) 0%,transparent 55%),linear-gradient(180deg,#0a0a0a 0%,#050505 100%);color:#fff7ed}
.scene{width:1200px;height:760px;padding:36px 48px 28px;display:flex;flex-direction:column;align-items:center;gap:22px}
.brand{text-align:center}
.logo{width:72px;height:72px;margin:0 auto 12px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,247,237,.85);box-shadow:0 0 0 4px rgba(255,122,24,.28),0 0 28px rgba(255,122,24,.35)}
.logo img{width:100%;height:100%;object-fit:cover;display:block}
h1{font-size:34px;font-weight:750;letter-spacing:-.03em;line-height:1.1}
h1 span,.foot span,.hint{color:#ff7a18}
.tagline{margin-top:8px;font-size:18px;color:#d6c4b0;font-weight:500}
.editor{width:100%;flex:1;min-height:0;border-radius:16px;border:1px solid rgba(255,122,24,.22);background:#121212;box-shadow:0 24px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.04);overflow:hidden;display:flex;flex-direction:column}
.chrome{height:40px;display:flex;align-items:center;gap:8px;padding:0 14px;border-bottom:1px solid rgba(255,122,24,.14);background:#0a0a0a}
.dot{width:10px;height:10px;border-radius:50%}.r{background:#ff5f57}.y{background:#febc2e}.g{background:#28c840}
.tabs{display:flex;gap:4px;margin-left:14px}
.tab,.pane-title,pre,.tooltip,.foot{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
.tab{position:relative;font-size:12px;color:#a89888;padding:6px 10px;border-radius:8px 8px 0 0}
.tab.active{color:#fff7ed;background:#121212}
.tabbg{position:absolute;inset:0;padding:6px 10px;color:#fff7ed;background:#121212;border-radius:8px 8px 0 0}
.panes{display:grid;grid-template-columns:1fr 1fr;flex:1;min-height:0}
.pane{padding:18px 20px 20px;border-right:1px solid rgba(255,122,24,.12);position:relative;overflow:hidden}
.pane:last-child{border-right:none}
.pane-title{font-size:11px;color:#8a7a6a;margin-bottom:12px}
pre{font-size:13.5px;line-height:1.55;white-space:pre;color:#e8ddd0}
.k{color:#ffb347}.s{color:#ff8a4c}.f,.type{color:#86c46a}.t{color:#ffd19a}
.cursor{display:inline-block;width:8px;height:15px;background:#ff7a18;vertical-align:-2px;margin-left:1px;animation:blink .9s step-end infinite}
@keyframes blink{50%{opacity:0}}
.tooltip{position:absolute;left:52px;bottom:58px;background:#1a1410;border:1px solid rgba(255,122,24,.35);border-radius:8px;padding:8px 12px;font-size:12.5px;color:#fff7ed;box-shadow:0 12px 30px rgba(0,0,0,.5)}
.foot{font-size:22px;font-weight:700;color:#e8ddd0;letter-spacing:-.02em}
${keyframes.join('\n')}
@media (prefers-reduced-motion:reduce){[class*=" w"],[class^="w"]{animation:none!important;opacity:1}.cursor{display:none}}`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" role="img" aria-label="tanstack-fetch: typed Fetch client designed for TanStack Query">
<foreignObject width="1200" height="760">
<div xmlns="http://www.w3.org/1999/xhtml" class="root"><style>${css}</style>${html}</div>
</foreignObject>
</svg>
`
writeFileSync(out, svg)
console.log(`${out} ${(svg.length / 1024).toFixed(1)} KB`)
