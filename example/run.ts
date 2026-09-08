import { createFetch } from '../src'
import { createExampleServer } from './server'

const runExample = async () => {
  const server = createExampleServer()
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('example server did not bind a port')
  }

  const api = createFetch({
    baseUrl: `http://127.0.0.1:${address.port}`,
    source: 'ssr',
    plugins: ['trace', 'ssr-forward', 'sse-resume'],
    incoming: { cookie: 'session=demo', requestId: 'example-1' },
  })

  api.use('log', {
    order: 5,
    onRequest: (context) => {
      console.log(`${context.request.method} ${context.request.url.pathname}`)
      return { action: 'continue', context }
    },
  })

  const users = await api.get<Array<{ id: string; name: string }>>('/users', {
    query: { page: 1 },
  })
  console.log('users', users)

  try {
    await api.get('/missing')
  } catch (error) {
    console.log('error', error)
  }

  const events = []
  for await (const event of api.sse<{ id: number; status: string }>('/events')) {
    events.push(event)
  }
  console.log('sse events', events)

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

runExample().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
