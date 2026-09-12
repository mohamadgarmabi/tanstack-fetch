type UploadProgressEvent = {
  loaded: number
  total?: number
  /** `loaded / total` when `total` is known (0–1). */
  progress?: number
}

type UploadProgressHandler = (event: UploadProgressEvent) => void

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
  UploadProgressEvent,
  UploadProgressHandler,
  FormDataPrimitive,
  FormDataFieldValue,
  FormDataFields,
  UploadBody,
  UploadOptions,
}
