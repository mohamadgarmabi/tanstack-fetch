import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'])

const IGNORED_DIRECTORY_NAMES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.next',
  '.nuxt',
  '.output',
  '.turbo',
  '.vitepress',
])

const listSourceFiles = (rootDirectory: string): string[] => {
  const files: string[] = []

  const visit = (directoryPath: string) => {
    for (const entry of readdirSync(directoryPath)) {
      if (IGNORED_DIRECTORY_NAMES.has(entry)) continue
      const absolutePath = join(directoryPath, entry)
      const stats = statSync(absolutePath)
      if (stats.isDirectory()) {
        visit(absolutePath)
        continue
      }
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

export { listSourceFiles, toRelativePath }
