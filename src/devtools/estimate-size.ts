const estimateSize = (value: unknown): number => {
  if (value == null) return 0
  if (typeof value === 'string') return new TextEncoder().encode(value).byteLength
  if (typeof Blob !== 'undefined' && value instanceof Blob) return value.size
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return value.byteLength
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    let total = 0
    value.forEach((entry, key) => {
      total += key.length
      if (typeof entry === 'string') total += new TextEncoder().encode(entry).byteLength
      else if (typeof Blob !== 'undefined' && entry instanceof Blob) total += entry.size
    })
    return total
  }
  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) {
    return new TextEncoder().encode(value.toString()).byteLength
  }
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength
  } catch {
    return String(value).length
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export { estimateSize, formatBytes }
