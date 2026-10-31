#!/usr/bin/env node
/**
 * Render the brand motion scenes in scenes.html to looping MP4 + static posters.
 *
 *   npx -y -p playwright-core@1.56.1 node scripts/motion/render.mjs [scene-id …] [--posters-only]
 *
 * Uses the locally installed Google Chrome. Requires ffmpeg on PATH.
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const REPO = resolve(ROOT, '..')
const OUT = join(ROOT, 'public/images')
const DOCS_ASSETS = join(REPO, 'docs/assets')
const FPS = 30

/** id → output basename; `video` renders an mp4 loop next to the poster. */
const SCENES = [
  { id: 'docs-mental-model', out: 'docs-mental-model.png', video: true },
  { id: 'docs-auth-status', out: 'docs-auth-status.png', video: true },
  { id: 'docs-comparison', out: 'docs-comparison.jpg', video: true },
  { id: 'docs-entry-points', out: 'docs-entry-points.png', video: true },
  { id: 'docs-errors', out: 'docs-errors.png', video: true },
  { id: 'docs-plugins', out: 'docs-plugins.png', video: true },
  { id: 'docs-sse', out: 'docs-sse.png', video: true },
  { id: 'docs-ssr-forward', out: 'docs-ssr-forward.png', video: true },
  { id: 'docs-tanstack-query', out: 'docs-tanstack-query.png', video: true },
  { id: 'docs-trpc', out: 'docs-trpc.png', video: true },
  { id: 'docs-upload', out: 'docs-upload.png', video: true },
  { id: 'hero', out: 'tanstack-fetch-hero.png', video: true, gif: 'tanstack-fetch-hero.gif' },
  { id: 'og-banner', out: 'docs-og-banner.png' },
  { id: 'medium-cover', out: 'tanstack-fetch-medium-cover.png' },
  { id: 'blog-1-4', out: 'blog-1-4-cover.png', video: true },
  { id: 'blog-1-5', out: 'blog-1-5-cover.jpg', video: true },
  { id: 'blog-1-6-1', out: 'blog-1-6-1-cover.jpg', video: true },
  { id: 'blog-1-6-2', out: 'blog-1-6-2-cover.jpg', video: true },
  { id: 'blog-1-6-3', out: 'blog-1-6-3-cover.jpg', video: true },
  { id: 'blog-1-7-0', out: 'blog-1-7-0-cover.jpg', video: true },
  { id: 'blog-1-7-1', out: 'blog-1-7-1-cover.jpg', video: true },
  { id: 'blog-1-8-0', out: 'blog-1-8-0-cover.jpg', video: true },
  { id: 'blog-2-0-0', out: 'blog-2-0-0-cover.jpg', video: true },
  // one cover per page / post — see pages.mjs
  ...JSON.parse(readFileSync(new URL('./pages.json', import.meta.url), 'utf8')).map((p) => ({
    id: p.id,
    out: `${p.id}.jpg`,
    video: true,
    crf: 26,
  })),
]

const args = process.argv.slice(2)
const postersOnly = args.includes('--posters-only')
const only = args.filter((a) => !a.startsWith('--'))
const queue = only.length ? SCENES.filter((s) => only.includes(s.id)) : SCENES

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core')

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' }
const server = createServer((req, res) => {
  const file = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!file.startsWith(ROOT) || !existsSync(file)) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
})
await new Promise((r) => server.listen(0, r))
const base = `http://localhost:${server.address().port}/scripts/motion/scenes.html`

const ffmpeg = (...a) => {
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', ...a], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${a.join(' ')}`)
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
for (const scene of queue) {
  // A fresh page per scene: resizing a live headless viewport leaves stale pixels at the bottom.
  const probe = await browser.newPage()
  await probe.goto(base)
  const size = await probe.evaluate((id) => window.show(id), scene.id)
  await probe.close()
  const page = await browser.newPage({ viewport: { width: size.w, height: size.h } })
  await page.goto(`${base}?scene=${scene.id}`)
  await page.evaluate(() => window.ready)
  const meta = await page.evaluate((id) => window.show(id), scene.id)
  const L = meta.dur * 1000
  // Seek into the second loop so delayed animations are already mid-cycle — frame t and t + L match.
  const at = (ms) => page.evaluate((t) => window.seek(t), 2 * L + ms)

  await at(meta.poster * 1000)
  const poster = join(OUT, scene.out)
  await page.screenshot({ path: poster, type: poster.endsWith('.jpg') ? 'jpeg' : 'png', quality: poster.endsWith('.jpg') ? 90 : undefined })
  console.log('poster', scene.out)

  if (scene.video && !postersOnly) {
    const dir = join(tmpdir(), `tf-motion-${scene.id}`)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    const frames = Math.round((L / 1000) * FPS)
    for (let i = 0; i < frames; i++) {
      await at((i * 1000) / FPS)
      await page.screenshot({ path: join(dir, `${String(i).padStart(4, '0')}.png`) })
    }
    const mp4 = join(OUT, scene.out.replace(/\.(png|jpg)$/, '.mp4'))
    ffmpeg('-framerate', String(FPS), '-i', join(dir, '%04d.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', String(scene.crf ?? 23), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4)
    if (scene.gif) {
      ffmpeg(
        '-framerate', String(FPS), '-i', join(dir, '%04d.png'),
        '-vf', 'fps=15,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
        join(OUT, scene.gif),
      )
    }
    rmSync(dir, { recursive: true, force: true })
    console.log('video ', mp4.slice(ROOT.length + 1))
  }

  // docs/assets mirrors a subset of public/images for README and social posts
  for (const name of [scene.out, scene.gif].filter(Boolean)) {
    if (existsSync(join(DOCS_ASSETS, name))) copyFileSync(join(OUT, name), join(DOCS_ASSETS, name))
  }
  await page.close()
}

await browser.close()
server.close()
