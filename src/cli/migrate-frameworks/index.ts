import type { FrameworkScaffold, MigrateFramework } from './migrate-framework.type'
import { nextjsScaffold } from './nextjs'
import { nuxtScaffold } from './nuxt'
import { createReactScaffold, reactScaffold } from './react'
import { vueScaffold } from './vue'

type ResolveFrameworkScaffoldOptions = {
  provider?: boolean
}

const frameworkScaffolds: Record<MigrateFramework, FrameworkScaffold> = {
  react: reactScaffold,
  vue: vueScaffold,
  nuxt: nuxtScaffold,
  nextjs: nextjsScaffold,
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

const MIGRATE_FRAMEWORK_VALUES = new Set<MigrateFramework>(['react', 'vue', 'nuxt', 'nextjs'])

const parseMigrateFramework = (value: string): MigrateFramework => {
  if (!MIGRATE_FRAMEWORK_VALUES.has(value as MigrateFramework)) {
    throw new Error(
      `tanstack-fetch: --framework must be react|vue|nuxt|nextjs (got "${value}")`,
    )
  }
  return value as MigrateFramework
}

export { frameworkScaffolds, parseMigrateFramework, resolveFrameworkScaffold }
export type { FrameworkScaffold, MigrateFramework, ResolveFrameworkScaffoldOptions }
