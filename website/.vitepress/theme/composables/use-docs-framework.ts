import { onMounted, ref, watch, type Ref } from 'vue'

type DocsFramework =
  | 'all'
  | 'core'
  | 'tanstack-start'
  | 'react'
  | 'nextjs'
  | 'remix'
  | 'vue'
  | 'nuxt'
  | 'solid'
  | 'solid-start'
  | 'angular'
  | 'svelte'
  | 'sveltekit'

const STORAGE_KEY = 'tf-docs-framework'

const FRAMEWORK_OPTIONS: { id: DocsFramework; label: string }[] = [
  { id: 'all', label: 'All frameworks' },
  { id: 'core', label: 'Core' },
  { id: 'tanstack-start', label: 'TanStack Start' },
  { id: 'react', label: 'React' },
  { id: 'nextjs', label: 'Next.js' },
  { id: 'remix', label: 'Remix' },
  { id: 'vue', label: 'Vue / Nuxt' },
  { id: 'nuxt', label: 'Nuxt' },
  { id: 'solid', label: 'Solid' },
  { id: 'solid-start', label: 'SolidStart' },
  { id: 'angular', label: 'Angular' },
  { id: 'svelte', label: 'Svelte' },
  { id: 'sveltekit', label: 'SvelteKit' },
]

/** Sidebar / nav link → frameworks that may see it. `core` = always when not All-only-hide. */
const LINK_FRAMEWORKS: Record<string, DocsFramework[]> = {
  '/guide/react': ['react', 'nextjs', 'tanstack-start', 'remix'],
  '/api/react': ['react', 'nextjs', 'tanstack-start', 'remix'],
  '/examples/react': ['react', 'nextjs', 'tanstack-start', 'remix'],
  '/guide/vue': ['vue', 'nuxt'],
  '/api/vue': ['vue', 'nuxt'],
  '/examples/nuxt-ssr': ['vue', 'nuxt'],
  '/guide/solid': ['solid', 'solid-start'],
  '/guide/angular': ['angular'],
  '/guide/svelte': ['svelte', 'sveltekit'],
  '/guide/ssr': ['react', 'nextjs', 'vue', 'nuxt', 'tanstack-start', 'remix', 'solid-start'],
  '/examples/next-ssr': ['react', 'nextjs'],
}

const HUB_PATH: Partial<Record<DocsFramework, string>> = {
  react: '/guide/react',
  nextjs: '/guide/ssr',
  vue: '/guide/vue',
  nuxt: '/guide/vue',
  solid: '/guide/solid',
  'solid-start': '/guide/solid',
  angular: '/guide/angular',
  svelte: '/guide/svelte',
  sveltekit: '/guide/svelte',
  'tanstack-start': '/guide/tanstack-query',
  remix: '/recipes/trpc',
}

const OTHER_HUBS = [
  '/guide/react',
  '/guide/vue',
  '/guide/solid',
  '/guide/angular',
  '/guide/svelte',
]

const framework: Ref<DocsFramework> = ref('all')

const isDocsFramework = (value: string): value is DocsFramework =>
  FRAMEWORK_OPTIONS.some((item) => item.id === value)

const readStoredFramework = (): DocsFramework => {
  if (typeof localStorage === 'undefined') return 'all'
  const value = localStorage.getItem(STORAGE_KEY)
  return value && isDocsFramework(value) ? value : 'all'
}

const matchesSelection = (sectionFw: string, selected: DocsFramework) => {
  if (selected === 'all') return true
  // Shared foundation stays visible with every stack.
  if (sectionFw === 'core') return true
  if (selected === 'core') return sectionFw === 'core'
  if (selected === 'vue' && (sectionFw === 'vue' || sectionFw === 'nuxt')) return true
  if (selected === 'nuxt' && (sectionFw === 'nuxt' || sectionFw === 'vue')) return true
  if (selected === 'svelte' && (sectionFw === 'svelte' || sectionFw === 'sveltekit')) return true
  if (selected === 'sveltekit' && (sectionFw === 'sveltekit' || sectionFw === 'svelte')) {
    return true
  }
  if (selected === 'nextjs' && (sectionFw === 'nextjs' || sectionFw === 'react')) return true
  if (
    selected === 'tanstack-start' &&
    (sectionFw === 'tanstack-start' || sectionFw === 'react')
  ) {
    return true
  }
  if (selected === 'solid-start' && (sectionFw === 'solid-start' || sectionFw === 'solid')) {
    return true
  }
  if (selected === 'remix' && (sectionFw === 'remix' || sectionFw === 'react')) return true
  if (
    selected === 'react' &&
    (sectionFw === 'react' ||
      sectionFw === 'tanstack-start' ||
      sectionFw === 'remix' ||
      sectionFw === 'nextjs')
  ) {
    return true
  }
  if (selected === 'solid' && (sectionFw === 'solid' || sectionFw === 'solid-start')) return true
  return sectionFw === selected
}

const normalizePath = (href: string) => {
  try {
    const url = new URL(href, 'http://local')
    return url.pathname.replace(/\/$/, '') || '/'
  } catch {
    return href
  }
}

const linkMatches = (pathname: string, selected: DocsFramework) => {
  if (selected === 'all') return true
  const path = pathname.replace(/^\/tanstack-fetch/, '') || '/'
  const rules = Object.entries(LINK_FRAMEWORKS).find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
  if (!rules) return true
  return rules[1].some((id) => matchesSelection(id, selected))
}

const pathWithoutBase = (pathname: string) => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const path = pathname.replace(/\/$/, '') || '/'
  if (base && path.startsWith(base)) {
    return path.slice(base.length) || '/'
  }
  return path
}

const applySidebarFilter = (selected: DocsFramework) => {
  if (typeof document === 'undefined') return
  const links = document.querySelectorAll<HTMLAnchorElement>(
    '.VPSidebar a.VPLink, .VPNavBarMenu a.VPLink',
  )
  links.forEach((link) => {
    const href = link.getAttribute('href') ?? ''
    const visible = linkMatches(normalizePath(href), selected)
    const item = link.closest(
      '.VPSidebarItem, .VPNavBarMenuLink, .VPMenuLink',
    ) as HTMLElement | null
    const target = item ?? link
    target.hidden = !visible
    target.classList.toggle('fw-section-hidden', !visible)
  })
}

type PagerTarget = { href: string; text: string }

const rememberPagerOriginal = (link: HTMLAnchorElement) => {
  if (link.dataset.fwOriginalHref !== undefined) return
  link.dataset.fwOriginalHref = link.getAttribute('href') ?? ''
  link.dataset.fwOriginalTitle = link.querySelector('.title')?.innerHTML ?? ''
}

const setPagerLink = (link: HTMLAnchorElement | null, target: PagerTarget | null) => {
  if (!link) return
  rememberPagerOriginal(link)
  const pager = link.closest('.pager') as HTMLElement | null
  if (!target) {
    link.hidden = true
    if (pager) pager.hidden = true
    return
  }
  link.hidden = false
  if (pager) pager.hidden = false
  link.setAttribute('href', target.href)
  const title = link.querySelector('.title')
  if (title) title.textContent = target.text
}

const restorePagerLink = (link: HTMLAnchorElement | null) => {
  if (!link || link.dataset.fwOriginalHref === undefined) return
  const pager = link.closest('.pager') as HTMLElement | null
  link.hidden = false
  if (pager) pager.hidden = false
  link.setAttribute('href', link.dataset.fwOriginalHref)
  const title = link.querySelector('.title')
  if (title && link.dataset.fwOriginalTitle !== undefined) {
    title.innerHTML = link.dataset.fwOriginalTitle
  }
}

const collectVisibleSidebarLinks = (selected: DocsFramework): PagerTarget[] => {
  const seen = new Set<string>()
  const links: PagerTarget[] = []
  document.querySelectorAll<HTMLAnchorElement>('.VPSidebar a.VPLink').forEach((anchor) => {
    const item = anchor.closest('.VPSidebarItem') as HTMLElement | null
    if (item?.hidden) return
    const href = anchor.getAttribute('href') ?? ''
    if (!href || !linkMatches(normalizePath(href), selected)) return
    const path = pathWithoutBase(normalizePath(href))
    if (seen.has(path)) return
    seen.add(path)
    const text = (
      anchor.querySelector('.text')?.textContent ??
      anchor.textContent ??
      ''
    ).trim()
    if (!text) return
    links.push({ href, text })
  })
  return links
}

const applyPagerFilter = (selected: DocsFramework) => {
  if (typeof document === 'undefined') return
  const prevLink = document.querySelector<HTMLAnchorElement>('.VPDocFooter .pager-link.prev')
  const nextLink = document.querySelector<HTMLAnchorElement>('.VPDocFooter .pager-link.next')
  const nav = document.querySelector<HTMLElement>('.VPDocFooter .prev-next')

  if (selected === 'all') {
    restorePagerLink(prevLink)
    restorePagerLink(nextLink)
    if (nav) nav.hidden = false
    return
  }

  // Ensure originals are stored before rewrite (VitePress may only render one side).
  if (prevLink) rememberPagerOriginal(prevLink)
  if (nextLink) rememberPagerOriginal(nextLink)

  const links = collectVisibleSidebarLinks(selected)
  const current = pathWithoutBase(window.location.pathname)
  const index = links.findIndex(
    (link) => pathWithoutBase(normalizePath(link.href)) === current,
  )

  const prev = index > 0 ? links[index - 1] : null
  const next = index >= 0 && index < links.length - 1 ? links[index + 1] : null

  setPagerLink(prevLink, prev)
  setPagerLink(nextLink, next)

  if (nav) {
    nav.hidden = !prev && !next
  }
}

const applyFrameworkFilter = (selected: DocsFramework) => {
  if (typeof document === 'undefined') return

  const sections = document.querySelectorAll<HTMLElement>('.fw-section[data-fw]')
  sections.forEach((section) => {
    const sectionFw = section.dataset.fw ?? ''
    const visible = matchesSelection(sectionFw, selected)
    section.hidden = !visible
    section.classList.toggle('fw-section-hidden', !visible)
  })

  const doc = document.querySelector('.vp-doc')
  if (doc) {
    const hasSections = sections.length > 0
    const visibleCount = [...sections].filter((section) => !section.hidden).length
    let hint = doc.querySelector<HTMLElement>('.fw-empty-hint')
    if (selected !== 'all' && hasSections && visibleCount === 0) {
      if (!hint) {
        hint = document.createElement('p')
        hint.className = 'fw-empty-hint custom-block tip'
        hint.innerHTML =
          'No sections for this framework on this page. Pick <strong>All</strong> or open the framework guide from the sidebar.'
        doc.prepend(hint)
      }
      hint.hidden = false
    } else if (hint) {
      hint.hidden = true
    }
  }

  applySidebarFilter(selected)
  applyPagerFilter(selected)
}

const withDocsBase = (path: string) => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return `${base}${path}`
}

const maybeRedirectToHub = (selected: DocsFramework) => {
  if (typeof window === 'undefined' || selected === 'all' || selected === 'core') return
  const path = window.location.pathname.replace(/\/$/, '')

  // API adapter pages
  if (path.endsWith('/api/react') && (selected === 'vue' || selected === 'nuxt')) {
    window.location.assign(withDocsBase('/api/vue'))
    return
  }
  if (
    path.endsWith('/api/vue') &&
    (selected === 'react' ||
      selected === 'nextjs' ||
      selected === 'tanstack-start' ||
      selected === 'remix')
  ) {
    window.location.assign(withDocsBase('/api/react'))
    return
  }

  const onOtherHub = OTHER_HUBS.some((hub) => {
    const full = withDocsBase(hub)
    return path === full && HUB_PATH[selected] !== hub
  })
  if (!onOtherHub) return
  const target = HUB_PATH[selected]
  if (target) window.location.assign(withDocsBase(target))
}

const useDocsFramework = () => {
  onMounted(() => {
    framework.value = readStoredFramework()
    applyFrameworkFilter(framework.value)
  })

  watch(framework, (value, previous) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value)
    }
    applyFrameworkFilter(value)
    if (previous && previous !== value) {
      maybeRedirectToHub(value)
    }
  })

  return { framework, FRAMEWORK_OPTIONS, applyFrameworkFilter, matchesSelection }
}

export {
  applyFrameworkFilter,
  FRAMEWORK_OPTIONS,
  framework,
  matchesSelection,
  useDocsFramework,
}
export type { DocsFramework }
