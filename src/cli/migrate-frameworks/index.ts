import type { FrameworkScaffold, MigrateFramework } from './migrate-framework.type'
import { angularScaffold } from './angular'
import { nextjsScaffold } from './nextjs'
import { nuxtScaffold } from './nuxt'
import { createReactScaffold, reactScaffold } from './react'
import { solidScaffold } from './solid'
import { svelteScaffold } from './svelte'
import { sveltekitScaffold } from './sveltekit'
import { vueScaffold } from './vue'

type ResolveFrameworkScaffoldOptions = {
  provider?: boolean
}

const FRAMEWORK_LIST =
  'react|vue|nuxt|nextjs|solid|angular|svelte|sveltekit' as const

const frameworkScaffolds: Record<MigrateFramework, FrameworkScaffold> = {
  react: reactScaffold,
  vue: vueScaffold,
  nuxt: nuxtScaffold,
  nextjs: nextjsScaffold,
  solid: solidScaffold,
  angular: angularScaffold,
  svelte: svelteScaffold,
  sveltekit: sveltekitScaffold,
}

const resolveFrameworkScaffold = (
  framework: MigrateFramework,
  options: ResolveFrameworkScaffoldOptions = {},
): FrameworkScaffold => {
  if (framework === 'react') {
    return createReactScaffold(options.provider ?? false)
  }
  return frameworkScaffolds[framework]
}

const MIGRATE_FRAMEWORK_VALUES = new Set<MigrateFramework>([
  'react',
  'vue',
  'nuxt',
  'nextjs',
  'solid',
  'angular',
  'svelte',
  'sveltekit',
])

const parseMigrateFramework = (value: string): MigrateFramework => {
  if (!MIGRATE_FRAMEWORK_VALUES.has(value as MigrateFramework)) {
    throw new Error(
      `tanstack-fetch: --framework must be ${FRAMEWORK_LIST} (got "${value}")`,
    )
  }
  return value as MigrateFramework
}

export { frameworkScaffolds, parseMigrateFramework, resolveFrameworkScaffold, FRAMEWORK_LIST }
export type { FrameworkScaffold, MigrateFramework, ResolveFrameworkScaffoldOptions }
