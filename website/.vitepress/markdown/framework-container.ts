/**
 * Minimal markdown-it container for `:::: framework <id>` … `::::`.
 * Use four colons so nested VitePress `::: tip` blocks do not close the section early.
 */
const frameworkContainer = (md: MarkdownItLike) => {
  const name = 'framework'
  const minMarkers = 3
  const markerStr = ':'
  const markerChar = markerStr.charCodeAt(0)
  const markerLen = markerStr.length

  const validate = (params: string) => Boolean(params.trim().match(/^framework\s+[\w-]+$/))

  const render = (tokens: FrameworkToken[], idx: number) => {
    if (tokens[idx].nesting === 1) {
      const match = tokens[idx].info.trim().match(/^framework\s+([\w-]+)$/)
      const id = match?.[1] ?? 'all'
      return `<div class="fw-section" data-fw="${id}">\n`
    }
    return '</div>\n'
  }

  const container = (
    state: ContainerState,
    startLine: number,
    endLine: number,
    silent: boolean,
  ): boolean => {
    let pos = 0
    let autoClosed = false
    let start = state.bMarks[startLine] + state.tShift[startLine]
    let max = state.eMarks[startLine]

    if (markerChar !== state.src.charCodeAt(start)) return false

    for (pos = start + 1; pos <= max; pos++) {
      if (markerStr[(pos - start) % markerLen] !== state.src[pos]) break
    }

    const markerCount = Math.floor((pos - start) / markerLen)
    if (markerCount < minMarkers) return false
    pos -= (pos - start) % markerLen

    const markup = state.src.slice(start, pos)
    const params = state.src.slice(pos, max)
    if (!validate(params)) return false
    if (silent) return true

    let nextLine = startLine
    for (;;) {
      nextLine++
      if (nextLine >= endLine) break

      start = state.bMarks[nextLine] + state.tShift[nextLine]
      max = state.eMarks[nextLine]

      if (start < max && state.sCount[nextLine] < state.blkIndent) break
      if (markerChar !== state.src.charCodeAt(start)) continue
      if (state.sCount[nextLine] - state.blkIndent >= 4) continue

      for (pos = start + 1; pos <= max; pos++) {
        if (markerStr[(pos - start) % markerLen] !== state.src[pos]) break
      }

      if (Math.floor((pos - start) / markerLen) < markerCount) continue
      pos -= (pos - start) % markerLen
      pos = state.skipSpaces(pos)
      if (pos < max) continue

      autoClosed = true
      break
    }

    const oldParent = state.parentType
    const oldLineMax = state.lineMax
    state.parentType = 'container'
    state.lineMax = nextLine

    const tokenOpen = state.push(`container_${name}_open`, 'div', 1)
    tokenOpen.markup = markup
    tokenOpen.block = true
    tokenOpen.info = params
    tokenOpen.map = [startLine, nextLine]

    state.md.block.tokenize(state, startLine + 1, nextLine)

    const tokenClose = state.push(`container_${name}_close`, 'div', -1)
    tokenClose.markup = state.src.slice(start, pos)
    tokenClose.block = true

    state.parentType = oldParent
    state.lineMax = oldLineMax
    state.line = nextLine + (autoClosed ? 1 : 0)

    return true
  }

  md.block.ruler.before('fence', `container_${name}`, container, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules[`container_${name}_open`] = render
  md.renderer.rules[`container_${name}_close`] = render
}

interface FrameworkToken {
  nesting: number
  info: string
  markup?: string
  block?: boolean
  map?: number[]
}

interface ContainerState {
  bMarks: number[]
  eMarks: number[]
  tShift: number[]
  sCount: number[]
  blkIndent: number
  src: string
  parentType: string
  lineMax: number
  line: number
  push: (type: string, tag: string, nesting: number) => FrameworkToken
  skipSpaces: (pos: number) => number
  md: { block: { tokenize: (state: ContainerState, start: number, end: number) => void } }
}

interface MarkdownItLike {
  block: {
    ruler: {
      before: (
        beforeName: string,
        ruleName: string,
        fn: (
          state: ContainerState,
          startLine: number,
          endLine: number,
          silent: boolean,
        ) => boolean,
        options: { alt: string[] },
      ) => void
    }
  }
  renderer: {
    rules: Record<string, (tokens: FrameworkToken[], idx: number) => string>
  }
}

export { frameworkContainer }
