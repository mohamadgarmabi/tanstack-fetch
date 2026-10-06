const INSTANCE_ASSIGN_RE =
  /(?:const|let|var)\s+(\w+)\s*=\s*(?:axios\.create|ky\.create|ky\.extend|ofetch\.create|createFetch)\s*\(/g

const collectHttpClientInstanceNames = (source: string): string[] => {
  const names = new Set<string>()
  for (const match of source.matchAll(INSTANCE_ASSIGN_RE)) {
    names.add(match[1])
  }
  return [...names]
}

const ensureTanstackFetchImport = (source: string, names: string[] = ['createFetch']): string => {
  if (/from\s*['"]tanstack-fetch['"]/.test(source)) return source
  if (/\brequire\s*\(\s*['"]tanstack-fetch['"]\s*\)/.test(source)) return source
  const importLine = `import { ${[...new Set(names)].join(', ')} } from 'tanstack-fetch'\n`
  if (/^import\s/m.test(source)) {
    return source.replace(/^(import\s.+['"].+['"];?\s*\n)/m, `$1${importLine}`)
  }
  return `${importLine}\n${source}`
}

const stripJsonChainOnCalls = (source: string, calleeNames: string[]): string => {
  let next = source
  for (const name of calleeNames) {
    const pattern = new RegExp(
      `(\\b${name}\\.(get|post|put|patch|delete|head|request)\\([^)]*\\))\\s*\\.json\\s*\\(\\s*\\)`,
      'g',
    )
    next = next.replace(pattern, '$1')
  }
  return next
}

export { collectHttpClientInstanceNames, ensureTanstackFetchImport, stripJsonChainOnCalls }
