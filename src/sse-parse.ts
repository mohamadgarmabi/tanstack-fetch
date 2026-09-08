import type { SseEvent } from './types'

const parseSseBlock = (block: string): SseEvent<unknown> | undefined => {
  const dataLines: string[] = []
  let eventName: string | undefined
  let id: string | undefined
  let retry: number | undefined

  block.split('\n').forEach((line) => {
    if (line.startsWith(':')) {
      return
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).replace(/^ /, ''))
      return
    }
    if (line.startsWith('event:')) {
      eventName = line.slice(6).replace(/^ /, '')
      return
    }
    if (line.startsWith('id:')) {
      id = line.slice(3).replace(/^ /, '')
      return
    }
    if (line.startsWith('retry:')) {
      const parsed = Number.parseInt(line.slice(6).trim(), 10)
      if (!Number.isNaN(parsed)) {
        retry = parsed
      }
    }
  })

  if (dataLines.length === 0 && !eventName) {
    return undefined
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

  return { event: eventName, data, id, retry }
}

const consumeSseBuffer = (buffer: string) => {
  const normalized = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const chunks = normalized.split('\n\n')
  const rest = chunks.pop() ?? ''
  const events = chunks
    .map((block) => parseSseBlock(block.trim()))
    .filter((event): event is SseEvent<unknown> => Boolean(event))
  return { events, rest }
}

export { parseSseBlock, consumeSseBuffer }
