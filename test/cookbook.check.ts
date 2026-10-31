// Typecheck-only: the snippets on website/examples/cookbook.md.
import {
  createFetch,
  isAbortError,
  isFetchError,
  parseRetryAfter,
  pathParams,
  type HttpInterceptor,
  type NoParams,
} from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRefreshTokenInterceptor,
  createRetryIdempotentInterceptor,
  createStatusInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'
import { createFetch as createSseFetch } from 'tanstack-fetch/sse'
import { createFetch as createLiveFetch } from 'tanstack-fetch/live'

type User = { id: number; name: string }
type CreateUser = { name: string }
declare const auth: { token: string | null; expiresAt: number; refresh: () => Promise<void> }
declare const file: File
declare const files: File[]
declare const signal: AbortSignal
declare const toast: { error: (m: string) => void }
declare const render: (x: unknown) => void

// --- HTTP ---
const api = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => auth.token }),
    createTraceInterceptor(),
    createRetryIdempotentInterceptor(),
  ],
})

export const http = async () => {
  const users = await api.get<User[]>('/users', { query: { page: 1, q: 'ada' }, signal })
  const user = await api.get('/users/:id', { params: { id: 1 } })
  const typed = await api.get<User, { id: number }>('/users/:id', { params: { id: 1 } })
  const created = await api.post<User, NoParams, CreateUser>('/users', { body: { name: 'Ada' } })
  await api.patch<User, { id: number }, Partial<CreateUser>>('/users/:id', {
    params: { id: 1 },
    body: { name: 'Grace' },
  })
  await api.delete('/users/:id', { params: pathParams('/users/:id', { id: 1 }) })
  const csv = await api.get<string>('/export', { parseAs: 'text' })
  const blob = await api.get<Blob>('/avatar.png', { parseAs: 'blob' })
  return [users, user, typed, created, csv, blob]
}

// --- Errors / timeouts ---
export const errors = async () => {
  try {
    await api.get('/report', { timeoutMs: 5_000 })
  } catch (error) {
    if (isAbortError(error)) {
      if ((error as Error).name === 'TimeoutError') toast.error('Timed out')
    } else if (isFetchError(error)) {
      if (error.status === 404) toast.error('Not found')
      else toast.error(`${error.code}: ${error.message}`)
    }
  }
}

// --- Status handlers ---
export const statusApi = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => auth.token }),
    createStatusInterceptor({
      401: () => {
        window.location.href = '/login'
      },
      403: ({ error }) => toast.error(error.message),
      429: ({ context }) => ({
        action: 'retry',
        delayMs: parseRetryAfter(context.response?.headers, 1_000),
      }),
      '5xx': ({ status }) => toast.error(`Server error ${status}`),
    }),
  ],
})

// Option shortcuts (getToken, onUnauthorized, …) stay on the full clients.
export const shortcutApi = createSseFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => auth.token,
  onUnauthorized: () => {
    window.location.href = '/login'
  },
})

// --- Refresh token ---
export const refreshApi = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => auth.token }),
    createRefreshTokenInterceptor({
      refresh: () => auth.refresh(),
      before: { getExpiresAt: () => auth.expiresAt, skewMs: 30_000 },
      onRefreshFailed: () => {
        window.location.href = '/login'
      },
    }),
  ],
})

// --- Interceptors ---
const timing: HttpInterceptor = {
  name: 'timing',
  onRequest: (context) => {
    context.request.headers.set('x-started-at', String(Date.now()))
    return { action: 'continue', context }
  },
  onResponseError: (context) => {
    console.warn(context.request.url.pathname, context.error?.status)
    return { action: 'continue', context }
  },
}
api.use('timing', timing)
export const noRetry = () =>
  api.post('/payments', { body: { amount: 10 }, interceptors: { eject: ['retry-idempotent'] } })
export const mocked = () =>
  api.get('/flags', {
    interceptors: {
      use: [
        {
          name: 'mock-flags',
          onRequest: () => ({
            action: 'short-circuit',
            result: { ok: true, status: 200, data: { beta: true }, headers: new Headers() },
          }),
        },
      ],
    },
  })

// --- Upload / download (full client: `tanstack-fetch/sse`) ---
const fileApi = createSseFetch({ baseUrl: 'https://api.example.com' })
export const uploads = async () => {
  await fileApi.upload<{ id: string }>('/avatars', {
    file,
    fields: { userId: 1 },
    onUploadProgress: ({ progress }) => render(`${Math.round((progress ?? 0) * 100)}%`),
  })
  await fileApi.upload('/gallery', { files, fieldName: 'photos', method: 'PUT' })
  await fileApi.get<Blob>('/exports/big.zip', {
    parseAs: 'blob',
    onDownloadProgress: ({ loaded, total }) => render(`${loaded}/${total ?? '?'}`),
  })
}

// --- Live ---
const live = createLiveFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => auth.token,
  plugins: ['sse-resume'],
})

type ChatMessage = { type: 'message' | 'typing'; user: string; text?: string }
type Notification = { id: string; title: string }

export const realtime = async () => {
  // SSE
  const orders = live.sse<Notification>('/notifications', { onMessage: (n) => render(n) })
  orders.close()
  for await (const event of live.sse<Notification>('/notifications', { signal })) {
    if (event.event === 'done') break
  }

  // WebSocket: typed in/out, typing indicator, binary frames
  const room = live.ws<ChatMessage, { id: string }, ChatMessage | ArrayBuffer>('/rooms/:id', {
    params: { id: 'general' },
    query: { since: '2026-10-01' },
    authIn: 'query',
    onMessage: (message) => (message.type === 'typing' ? render('…') : render(message.text)),
  })
  room.send({ type: 'typing', user: 'ada' })
  room.send(new ArrayBuffer(8))
  room.getSocket()?.addEventListener('error', () => undefined)

  // Subprotocol auth + no reconnect + abort
  const controller = new AbortController()
  live.ws('/feed', {
    authIn: 'protocol',
    protocols: ['feed.v2'],
    reconnect: false,
    signal: controller.signal,
    parseAs: 'text',
  })
  controller.abort()

  // Absolute URL to another host
  live.ws('wss://realtime.example.com/socket', { authIn: 'query', authQueryKey: 'access_token' })

  // WebTransport
  const game = live.transport<{ x: number; y: number }, { id: number }, { dx: number }>(
    '/game/:id',
    {
      params: { id: 1 },
      authIn: 'query',
      webTransport: { congestionControl: 'low-latency' },
      onMessage: (state) => render(state),
    },
  )
  game.send({ dx: 1 })

  // NDJSON: LLM tokens, export progress, log tail
  let answer = ''
  for await (const chunk of live.stream<{ text: string }>('/chat', {
    body: { prompt: 'hi' },
    signal,
  })) {
    answer += chunk.text
  }
  for await (const row of live.stream<{ done: number; total: number }>('/exports', {
    method: 'POST',
    body: { format: 'csv' },
  })) {
    render(`${row.done}/${row.total}`)
  }
  for await (const line of live.stream<string>('/logs/tail', { query: { service: 'api' } })) {
    if (line.includes('READY')) break
  }
  return answer
}

// --- Live interceptor hooks ---
live.use('live-log', {
  onLiveOpen: (context) => {
    console.log('open', context.meta.transport, context.request.url.pathname)
    return { action: 'continue', context }
  },
  onLiveMessage: (context) => {
    console.log(context.message.direction, context.message.data)
    return { action: 'continue', context }
  },
  onLiveClose: (context) => {
    if (context.error) console.warn('closed', context.error.message)
    return { action: 'continue', context }
  },
})
