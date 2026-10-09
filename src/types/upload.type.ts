type TransferProgressEvent = {
  loaded: number
  total?: number
  /** `loaded / total` when `total` is known (0–1). */
  progress?: number
}

/** @deprecated Prefer `TransferProgressEvent` — same shape for upload and download. */
type UploadProgressEvent = TransferProgressEvent

type DownloadProgressEvent = TransferProgressEvent

type UploadProgressHandler = (event: TransferProgressEvent) => void

type DownloadProgressHandler = (event: TransferProgressEvent) => void

type FormDataPrimitive = string | number | boolean | Blob

type FormDataFieldValue = FormDataPrimitive | null | undefined | FormDataPrimitive[]

type FormDataFields = Record<string, FormDataFieldValue>

type UploadBody = FormData | Blob | ArrayBuffer | URLSearchParams | string

type UploadOptions = {
  /** Pre-built body (`FormData`, `Blob`, `File`, …). */
  body?: UploadBody
  /** Single file — appended as `fieldName` (default `"file"`). */
  file?: Blob
  /** Multiple files — same field name repeated. */
  files?: Blob[]
  /** Extra multipart fields (strings, numbers, Blobs). */
  fields?: FormDataFields
  /** Form field name for `file` / `files`. Default `"file"`. */
  fieldName?: string
  /** HTTP method. Default `POST`. */
  method?: 'POST' | 'PUT' | 'PATCH'
  onUploadProgress?: UploadProgressHandler
}

export type {
  TransferProgressEvent,
  UploadProgressEvent,
  DownloadProgressEvent,
  UploadProgressHandler,
  DownloadProgressHandler,
  FormDataPrimitive,
  FormDataFieldValue,
  FormDataFields,
  UploadBody,
  UploadOptions,
}
