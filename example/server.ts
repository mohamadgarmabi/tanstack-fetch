import http from 'node:http'

const createExampleServer = () =>
  http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')

    if (url.pathname === '/users' && request.method === 'GET') {
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify([{ id: '1', name: 'Ada' }]))
      return
    }

    if (url.pathname === '/users/1' && request.method === 'GET') {
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({ id: '1', name: 'Ada' }))
      return
    }

    if (url.pathname === '/events' && request.method === 'GET') {
      response.setHeader('content-type', 'text/event-stream')
      response.write('event: ping\ndata: {}\n\n')
      response.write('id: 1\nevent: order.updated\ndata: {"id":7,"status":"paid"}\n\n')
      response.end()
      return
    }

    response.statusCode = 404
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ code: 'NOT_FOUND', message: 'missing' }))
  })

export { createExampleServer }
