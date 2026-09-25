const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const KEYWORD =
  '\\b(?:import|from|const|let|export|await|return|if|else|for|of|async|new|type|try|catch|as)\\b'

const highlightTypeScript = (source: string) => {
  const escaped = escapeHtml(source)

  return escaped.replace(
    new RegExp(
      `(<span class="tok-c">[\\s\\S]*?<\\/span>)|(\\/\\/.*$)|('[^']*'|"[^"]*"|\`[^\`]*\`)|(${KEYWORD})`,
      'gm',
    ),
    (
      match,
      comment: string | undefined,
      lineComment: string | undefined,
      string: string | undefined,
      keyword: string | undefined,
    ) => {
      if (comment) return comment
      if (lineComment) return `<span class="tok-c">${lineComment}</span>`
      if (string) return `<span class="tok-s">${string}</span>`
      if (keyword) return `<span class="tok-k">${keyword}</span>`
      return match
    },
  )
}

export { highlightTypeScript }
