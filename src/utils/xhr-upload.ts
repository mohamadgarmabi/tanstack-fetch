import type { DownloadProgressHandler, UploadProgressHandler } from '../types/upload.type'

type XhrUploadBody = XMLHttpRequestBodyInit | null | undefined

type XhrProgressArgs = {
  url: URL
  method: string
  headers: Headers
  body?: XhrUploadBody
  signal?: AbortSignal
  credentials?: RequestCredentials
  onUploadProgress?: UploadProgressHandler
  onDownloadProgress?: DownloadProgressHandler
}

const parseResponseHeaders = (raw: string): Headers => {
  const headers = new Headers()
  for (const line of raw.trim().split(/[\r\n]+/)) {
    const index = line.indexOf(':')
    if (index === -1) {
      continue
    }
    headers.append(line.slice(0, index).trim(), line.slice(index + 1).trim())
  }
  return headers
}

const toProgressEvent = (event: ProgressEvent) => {
  const total = event.lengthComputable ? event.total : undefined
  return {
    loaded: event.loaded,
    total,
    progress: total && total > 0 ? event.loaded / total : undefined,
  }
}

/**
 * Browser request via XHR so upload / download `onprogress` works
 * (fetch has no upload progress and limited download progress APIs).
 */
const uploadWithProgress = (args: XhrProgressArgs): Promise<Response> =>
  new Promise((resolve, reject) => {
    if (args.signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'))
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open(args.method, args.url.toString(), true)
    xhr.responseType = 'arraybuffer'
    xhr.withCredentials = args.credentials === 'include'

    args.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-type' && args.body instanceof FormData) {
        return
      }
      xhr.setRequestHeader(key, value)
    })

    if (args.onUploadProgress) {
      xhr.upload.onprogress = (event) => {
        args.onUploadProgress?.(toProgressEvent(event))
      }
    }

    if (args.onDownloadProgress) {
      xhr.onprogress = (event) => {
        args.onDownloadProgress?.(toProgressEvent(event))
      }
    }

    const onAbort = () => xhr.abort()
    args.signal?.addEventListener('abort', onAbort, { once: true })

    xhr.onload = () => {
      args.signal?.removeEventListener('abort', onAbort)
      resolve(
        new Response(xhr.response.byteLength > 0 ? xhr.response : null, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseResponseHeaders(xhr.getAllResponseHeaders()),
        }),
      )
    }

    xhr.onerror = () => {
      args.signal?.removeEventListener('abort', onAbort)
      reject(new TypeError('Network request failed'))
    }

    xhr.onabort = () => {
      args.signal?.removeEventListener('abort', onAbort)
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    }

    xhr.send(args.body ?? null)
  })

const canTrackUploadProgress = () => typeof XMLHttpRequest !== 'undefined'

const canTrackDownloadProgress = () => typeof XMLHttpRequest !== 'undefined'

export { uploadWithProgress, canTrackUploadProgress, canTrackDownloadProgress }
