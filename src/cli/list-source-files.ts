import { lstatSync, readdirSync, realpathSync } from 'node:fs'
import { join, relative } from 'node:path'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'])

const IGNORED_DIRECTORY_NAMES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'out',
  'vendor',
  '.git',
  '.next',
  '.nuxt',
  '.output',
  '.turbo',
  '.vitepress',
  '.cache',
  '.svelte-kit',
  'storybook-static',
])

/** Skip oversized generated bundles (bytes). */
const MAX_SOURCE_FILE_BYTES = 1_500_000

const listSourceFiles = (rootDirectory: string): string[] => {
  const files: string[] = []
  const visitedDirectories = new Set<string>()

  const visit = (directoryPath: string) => {
    let realDirectory: string
    try {
      realDirectory = realpathSync(directoryPath)
    } catch {
      return
    }
    if (visitedDirectories.has(realDirectory)) return
    visitedDirectories.add(realDirectory)

    for (const entry of readdirSync(directoryPath)) {
      if (IGNORED_DIRECTORY_NAMES.has(entry)) continue
      const absolutePath = join(directoryPath, entry)
      let stats
      try {
        stats = lstatSync(absolutePath)
      } catch {
        continue
      }
      if (stats.isSymbolicLink()) continue
      if (stats.isDirectory()) {
        visit(absolutePath)
        continue
      }
      if (!stats.isFile()) continue
      if (stats.size > MAX_SOURCE_FILE_BYTES) continue
      const extension = entry.slice(entry.lastIndexOf('.'))
      if (SOURCE_EXTENSIONS.has(extension)) {
        files.push(absolutePath)
      }
    }
  }

  visit(rootDirectory)
  return files.sort((left, right) => left.localeCompare(right))
}

const toRelativePath = (rootDirectory: string, absolutePath: string) =>
  relative(rootDirectory, absolutePath).split('\\').join('/')

export { listSourceFiles, toRelativePath, MAX_SOURCE_FILE_BYTES }
