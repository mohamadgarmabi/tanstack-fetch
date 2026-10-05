type MigrateFramework = 'react' | 'vue' | 'nuxt' | 'nextjs'

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
