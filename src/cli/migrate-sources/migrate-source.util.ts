const INSTANCE_ASSIGN_RE =
  /(?:const|let|var)\s+(\w+)\s*=\s*(?:axios\.create|ky\.create|ky\.extend|ofetch\.create|createFetch)\s*\(/g

const collectHttpClientInstanceNames = (source: string): string[] => {
  const names = new Set<string>()
  for (const match of source.matchAll(INSTANCE_ASSIGN_RE)) {
    names.add(match[1])
  }
  return [...names]
}

/** Top-level import statements, including multi-line `import {\n a,\n} from 'x'` and side-effect imports. */
const IMPORT_STATEMENT_RE = /^import\s+(?:[^'";]*?\sfrom\s*)?['"][^'"\n]+['"][^\n]*(?:\n|$)/gm

/** Shebang + directive prologue ('use client' / 'use server' / 'use strict'). Imports must go after it. */
const PROLOGUE_RE =
  /^(?:#![^\n]*\n)?(?:(?:\s|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*['"]use [\w -]+['"];?[^\n]*(?:\n|$))*/

const insertImportLine = (source: string, importLine: string): string => {
  const imports = [...source.matchAll(IMPORT_STATEMENT_RE)]
  if (imports.length > 0) {
    const last = imports[imports.length - 1]
    const at = (last.index ?? 0) + last[0].length
    const prefix = source[at - 1] === '\n' ? '' : '\n'
    return `${source.slice(0, at)}${prefix}${importLine}${source.slice(at)}`
  }
  const at = PROLOGUE_RE.exec(source)?.[0].length ?? 0
  const prefix = at > 0 && source[at - 1] !== '\n' ? '\n' : ''
  return `${source.slice(0, at)}${prefix}${importLine}\n${source.slice(at)}`
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const splitSpecifiers = (body: string) =>
  body
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

/** Add named imports from `specifier`, merging into an existing `import { … } from specifier`. */
const addNamedImport = (source: string, names: string[], specifier: string): string => {
  const existing = new RegExp(
    `^(\\s*import\\s*\\{)([^}]*)(\\}\\s*from\\s*['"]${escapeRegExp(specifier)}['"])`,
    'm',
  )
  const match = existing.exec(source)
  if (match) {
    const current = splitSpecifiers(match[2])
    const missing = [...new Set(names)].filter(
      (name) => !current.some((part) => part.split(/\s+as\s+/).pop() === name),
    )
    if (missing.length === 0) return source
    return source.replace(
      existing,
      (_full, head: string, _body, tail: string) =>
        `${head} ${[...current, ...missing].join(', ')} ${tail}`,
    )
  }
  return insertImportLine(
    source,
    `import { ${[...new Set(names)].join(', ')} } from '${specifier}'\n`,
  )
}

const ensureTanstackFetchImport = (source: string, names: string[] = ['createFetch']): string => {
  if (/\brequire\s*\(\s*['"]tanstack-fetch['"]\s*\)/.test(source)) return source
  return addNamedImport(source, names, 'tanstack-fetch')
}

const TANSTACK_NAMED_IMPORT_RE =
  /^[ \t]*import\s*\{([^}]*)\}\s*from\s*['"]tanstack-fetch['"][ \t]*;?[ \t]*(?:\r?\n|$)/gm

/** Collapse several `import { … } from 'tanstack-fetch'` (e.g. axios + ky rewrites in one file) into one. */
const mergeTanstackFetchImports = (source: string): string => {
  const all = [...source.matchAll(TANSTACK_NAMED_IMPORT_RE)]
  if (all.length < 2) return source
  const names = [...new Set(all.flatMap((match) => splitSpecifiers(match[1])))]
  let first = true
  return source.replace(TANSTACK_NAMED_IMPORT_RE, (full) => {
    if (!first) return ''
    first = false
    return full.replace(/\{[^}]*\}/, `{ ${names.join(', ')} }`)
  })
}

/** Index of the closing quote of the string/template starting at `start`, or -1. */
const skipString = (source: string, start: number): number => {
  const quote = source[start]
  for (let index = start + 1; index < source.length; index += 1) {
    const char = source[index]
    if (char === '\\') {
      index += 1
    } else if (char === quote) {
      return index
    } else if (quote === '`' && char === '$' && source[index + 1] === '{') {
      index = scanTo(source, index + 2, '}')
      if (index < 0) return -1
    } else if (quote !== '`' && char === '\n') {
      return -1
    }
  }
  return -1
}

/** Index of `stop` at bracket depth 0 from `start` (strings/comments skipped), or -1 when unbalanced. */
const scanTo = (source: string, start: number, stop: string): number => {
  let depth = 0
  for (let index = start; index < source.length; index += 1) {
    const char = source[index]
    if (char === '"' || char === "'" || char === '`') {
      index = skipString(source, index)
      if (index < 0) return -1
      continue
    }
    if (char === '/' && source[index + 1] === '/') {
      const end = source.indexOf('\n', index)
      if (end < 0) return -1
      index = end
      continue
    }
    if (char === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2)
      if (end < 0) return -1
      index = end + 1
      continue
    }
    if (depth === 0 && char === stop) return index
    if (char === '(' || char === '[' || char === '{') depth += 1
    else if (char === ')' || char === ']' || char === '}') {
      depth -= 1
      if (depth < 0) return -1
    }
  }
  return -1
}

/** Split on top-level commas (ignoring commas inside brackets/strings). Null when unparseable. */
const splitTopLevel = (text: string): string[] | null => {
  const parts: string[] = []
  let start = 0
  while (start <= text.length) {
    const end = scanTo(`${text},`, start, ',')
    if (end < 0) return null
    parts.push(text.slice(start, end))
    start = end + 1
  }
  return parts
}

type CallSite = {
  start: number
  /** Index of `(` */
  open: number
  /** Index of the matching `)` */
  close: number
  method: string
  /** Explicit type arguments on the call, e.g. `<User>` */
  typeArgs: string | undefined
}

const findCalls = (source: string, calleeNames: string[], methods: string): CallSite[] => {
  const calls: CallSite[] = []
  for (const name of calleeNames) {
    const pattern = new RegExp(
      `\\b${escapeRegExp(name)}\\.(${methods})\\s*(<[^()]*?>)?\\s*\\(`,
      'g',
    )
    for (const match of source.matchAll(pattern)) {
      const start = match.index ?? 0
      const open = start + match[0].length - 1
      const close = scanTo(source, open + 1, ')')
      if (close < 0) continue
      calls.push({ start, open, close, method: match[1], typeArgs: match[2] })
    }
  }
  return calls.sort((a, b) => a.start - b.start)
}

/** Apply `edit` to each call (outermost wins when calls nest). `edit` returns [replaceUntil, text] or null. */
const editCalls = (
  source: string,
  calls: CallSite[],
  edit: (call: CallSite) => [number, string] | null,
): string => {
  let out = ''
  let last = 0
  for (const call of calls) {
    if (call.start < last) continue
    const result = edit(call)
    if (!result) continue
    out += source.slice(last, call.start) + result[1]
    last = result[0]
  }
  return out + source.slice(last)
}

const JSON_CHAIN_RE = /^\s*\.json\s*(<[^()]*>)?\s*\(\s*\)/

/** `client.get(url, …).json<T>()` → `client.get<T>(url, …)` (tanstack-fetch already parses JSON). */
const stripJsonChainOnCalls = (source: string, calleeNames: string[]): string => {
  const calls = findCalls(source, calleeNames, 'get|post|put|patch|delete|head|request')
  return editCalls(source, calls, (call) => {
    const json = JSON_CHAIN_RE.exec(source.slice(call.close + 1))
    if (!json) return null
    const typeArgs = !call.typeArgs && json[1] ? json[1] : ''
    const callee = source.slice(call.start, call.open).trimEnd()
    return [
      call.close + 1 + json[0].length,
      `${callee}${typeArgs}${source.slice(call.open, call.close + 1)}`,
    ]
  })
}

/**
 * Rename a top-level key in the options-object argument of `client.method(…)` calls only,
 * e.g. axios `params:` → `query:` in the config — never inside request bodies.
 */
const renameOptionKey = (
  source: string,
  calleeNames: string[],
  argIndexByMethod: Record<string, number>,
  from: string,
  to: string,
): string => {
  const calls = findCalls(source, calleeNames, Object.keys(argIndexByMethod).join('|'))
  const keyRe = new RegExp(`^(\\s*)${from}(\\s*:)`)
  return editCalls(source, calls, (call) => {
    const args = splitTopLevel(source.slice(call.open + 1, call.close))
    const index = argIndexByMethod[call.method]
    const arg = args?.[index]
    const trimmed = arg?.trim() ?? ''
    if (!args || !arg || !trimmed.startsWith('{') || !trimmed.endsWith('}')) return null
    const open = arg.indexOf('{')
    const close = arg.lastIndexOf('}')
    const props = splitTopLevel(arg.slice(open + 1, close))
    if (!props) return null
    const renamed = props.map((prop) =>
      prop.trim() === from
        ? prop.replace(from, `${to}: ${from}`)
        : prop.replace(keyRe, `$1${to}$2`),
    )
    if (renamed.every((prop, i) => prop === props[i])) return null
    args[index] = `${arg.slice(0, open + 1)}${renamed.join(',')}${arg.slice(close)}`
    return [call.close + 1, `${source.slice(call.start, call.open + 1)}${args.join(',')})`]
  })
}

export {
  addNamedImport,
  collectHttpClientInstanceNames,
  ensureTanstackFetchImport,
  mergeTanstackFetchImports,
  renameOptionKey,
  stripJsonChainOnCalls,
}
