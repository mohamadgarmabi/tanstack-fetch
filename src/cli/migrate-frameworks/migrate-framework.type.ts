type MigrateFramework =
  | 'react'
  | 'vue'
  | 'nuxt'
  | 'nextjs'
  | 'solid'
  | 'angular'
  | 'svelte'
  | 'sveltekit'

type FrameworkScaffoldFile = {
  path: string
  contents: string
}

type FrameworkScaffold = {
  id: MigrateFramework
  tip: string
  files: FrameworkScaffoldFile[]
}

export type { FrameworkScaffold, FrameworkScaffoldFile, MigrateFramework }
