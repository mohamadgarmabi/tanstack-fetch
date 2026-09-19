import { describe, expect, it, vi } from 'vitest'
import { createFormData, isAbortError } from '../src'
import { createTestClient, jsonResponse } from './helpers'

describe('upload', () => {
  it('posts FormData without setting content-type', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { id: 'f1' } }))
    const http = createTestClient(fetchImpl)
    const form = createFormData({ name: 'Ada', count: 2 })

    const data = await http.post<{ id: string }>('/files', { body: form })

    expect(data.id).toBe('f1')
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit
    expect(init.body).toBe(form)
    expect(new Headers(init.headers).has('content-type')).toBe(false)
  })

  it('upload() builds multipart body and returns response data', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ status: 201, body: { url: 'https://cdn.example.com/a.png' } }),
      )
    const http = createTestClient(fetchImpl)
    const file = new Blob(['hello'], { type: 'text/plain' })

    const data = await http.upload<{ url: string }>('/upload', {
      file,
      fields: { folder: 'avatars' },
      fieldName: 'avatar',
    })

    expect(data.url).toContain('cdn.example.com')
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
    const body = init.body as FormData
    expect(body.get('folder')).toBe('avatars')
    expect(body.get('avatar')).toBeInstanceOf(Blob)
  })

  it('upload() accepts multiple files and custom method', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { ok: true } }))
    const http = createTestClient(fetchImpl)

    await http.upload('/docs', {
      method: 'PUT',
      files: [new Blob(['a']), new Blob(['b'])],
      fieldName: 'docs',
    })

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('PUT')
    const body = init.body as FormData
    expect(body.getAll('docs')).toHaveLength(2)
  })

  it('createFormData skips nullish and flattens arrays', () => {
    const form = createFormData({
      title: 'Report',
      empty: null,
      missing: undefined,
      tags: ['a', 'b'],
      flag: true,
    })

    expect(form.get('title')).toBe('Report')
    expect(form.get('flag')).toBe('true')
    expect(form.has('empty')).toBe(false)
    expect(form.getAll('tags')).toEqual(['a', 'b'])
  })

  it('tracks upload progress via XHR when onUploadProgress is set', async () => {
    type XhrInstance = {
      upload: { onprogress: ((event: ProgressEvent) => void) | null }
      onload: (() => void) | null
      onerror: (() => void) | null
      onabort: (() => void) | null
      status: number
      statusText: string
      response: ArrayBuffer
      open: ReturnType<typeof vi.fn>
      setRequestHeader: ReturnType<typeof vi.fn>
      send: ReturnType<typeof vi.fn>
      abort: ReturnType<typeof vi.fn>
      getAllResponseHeaders: ReturnType<typeof vi.fn>
    }

    let lastXhr: XhrInstance | undefined

    class XhrMock {
      upload: XhrInstance['upload'] = { onprogress: null }
      onload: XhrInstance['onload'] = null
      onerror: XhrInstance['onerror'] = null
      onabort: XhrInstance['onabort'] = null
      status = 200
      statusText = 'OK'
      response = new TextEncoder().encode(JSON.stringify({ ok: true })).buffer
      open = vi.fn()
      setRequestHeader = vi.fn()
      abort = vi.fn()
      getAllResponseHeaders = vi.fn(() => 'content-type: application/json\r\n')
      send = vi.fn(() => {
        this.upload.onprogress?.({
          loaded: 50,
          total: 100,
          lengthComputable: true,
        } as ProgressEvent)
        this.onload?.()
      })
    }

    const XhrProxy = new Proxy(XhrMock, {
      construct: (target, args, newTarget) => {
        const instance = Reflect.construct(target, args, newTarget) as XhrInstance
        lastXhr = instance
        return instance
      },
    })

    vi.stubGlobal('XMLHttpRequest', XhrProxy)

    const fetchImpl = vi.fn()
    const http = createTestClient(fetchImpl)
    const progress = vi.fn()

    const data = await http.upload<{ ok: boolean }>('/upload', {
      file: new Blob(['x'.repeat(100)]),
      onUploadProgress: progress,
    })

    expect(data.ok).toBe(true)
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(lastXhr?.open).toHaveBeenCalledWith('POST', 'https://api.example.com/upload', true)
    expect(progress).toHaveBeenCalledWith({ loaded: 50, total: 100, progress: 0.5 })

    vi.unstubAllGlobals()
  })

  it('rejects immediately when upload signal is already aborted', async () => {
    class XhrMock {
      upload = { onprogress: null }
      open = vi.fn()
      setRequestHeader = vi.fn()
      send = vi.fn()
      abort = vi.fn()
      getAllResponseHeaders = vi.fn(() => '')
    }
    vi.stubGlobal('XMLHttpRequest', XhrMock)

    const http = createTestClient(vi.fn())
    const controller = new AbortController()
    controller.abort()

    await expect(
      http.upload('/upload', {
        file: new Blob(['x']),
        signal: controller.signal,
        onUploadProgress: vi.fn(),
      }),
    ).rejects.toSatisfy((error: unknown) => isAbortError(error))

    vi.unstubAllGlobals()
  })
})
