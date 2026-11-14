import type { SseEvent } from './types'

type SseBlock = {
  /** `id:` field of the block; updates the last event id even when nothing is dispatched. */
  id?: string
  /** Absent when the block has no `data` line (spec: nothing to dispatch). */
  event?: SseEvent<unknown>
}

const parseSseBlock = (block: string): SseBlock => {
  const dataLines: string[] = []
  let eventName: string | undefined
  let id: string | undefined
  let retry: number | undefined

  block.split('\n').forEach((line) => {
    if (line === '' || line.startsWith(':')) {
      return
    }
    // Spec: field is everything before the first ':', one leading space of the value is dropped.
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
    if (field === 'data') {
      dataLines.push(value)
    } else if (field === 'event') {
      eventName = value
    } else if (field === 'id' && !value.includes('\0')) {
      id = value
    } else if (field === 'retry' && /^\d+$/.test(value)) {
      retry = Number(value)
    }
  })

  if (dataLines.length === 0) {
    return { id }
  }

  const raw = dataLines.join('\n')
  let data: unknown = raw
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = raw
    }
  }

  return { id, event: { event: eventName || undefined, data, id, retry } }
}

const consumeSseBuffer = (buffer: string) => {
  const normalized = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const chunks = normalized.split('\n\n')
  const rest = chunks.pop() ?? ''
  const blocks = chunks.map(parseSseBlock)
  // A trailing \r may be the first half of a \r\n split across chunks: keep it raw so the next
  // chunk's \n joins it instead of adding a blank line.
  return { blocks, rest: buffer.endsWith('\r') && rest ? `${rest.slice(0, -1)}\r` : rest }
}

export { parseSseBlock, consumeSseBuffer }
