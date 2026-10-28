import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Renders `![alt](/images/name.png)` as a looping muted `<video>` when
 * `public/images/name.mp4` exists. The original image stays as the poster,
 * so markdown still reads fine on GitHub / dev.to and OG tags keep the still.
 */
interface ImageToken {
  attrGet: (name: string) => string | null
  content: string
}

interface MarkdownItLike {
  renderer: {
    rules: Record<string, ((tokens: ImageToken[], idx: number, ...rest: unknown[]) => string) | undefined>
  }
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const motionMedia = (md: MarkdownItLike, { publicDir }: { publicDir: string }) => {
  const fallback = md.renderer.rules.image
  md.renderer.rules.image = (tokens, idx, ...rest) => {
    const src = tokens[idx].attrGet('src') ?? ''
    const match = src.match(/^\/(images\/[\w.-]+)\.(png|jpe?g)$/)
    if (match && existsSync(join(publicDir, `${match[1]}.mp4`))) {
      const alt = escape(tokens[idx].content)
      // Root-relative: Vue/Vite resolve these from public/ and prepend the site base.
      const poster = `/${match[1]}.${match[2]}`
      const video = `/${match[1]}.mp4`
      return `<video class="motion-media" src="${video}" poster="${poster}" autoplay loop muted playsinline preload="metadata" aria-label="${alt}" title="${alt}"></video>`
    }
    return fallback ? fallback(tokens, idx, ...rest) : ''
  }
}

export { motionMedia }
