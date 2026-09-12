import type {
  FormDataFields,
  FormDataFieldValue,
  UploadBody,
  UploadOptions,
} from '../types/upload.type'

const appendFieldValue = (form: FormData, key: string, value: FormDataFieldValue) => {
  if (value === null || value === undefined) {
    return
  }
  const items = Array.isArray(value) ? value : [value]
  for (const item of items) {
    if (item === null || item === undefined) {
      continue
    }
    if (item instanceof Blob) {
      form.append(key, item)
      continue
    }
    form.append(key, String(item))
  }
}

const appendFormDataFields = (form: FormData, fields: FormDataFields) => {
  for (const [key, value] of Object.entries(fields)) {
    appendFieldValue(form, key, value)
  }
  return form
}

/** Build `FormData` from a plain object (files, strings, numbers, arrays). */
const createFormData = (fields: FormDataFields = {}): FormData =>
  appendFormDataFields(new FormData(), fields)

const hasUploadParts = (options: UploadOptions) =>
  Boolean(options.file || options.files?.length || options.fields)

const resolveUploadBody = (options: UploadOptions): UploadBody => {
  if (options.body !== undefined && !hasUploadParts(options)) {
    return options.body
  }

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    throw new Error(
      'tanstack-fetch: upload `body` must be FormData when using `file`, `files`, or `fields`',
    )
  }

  const form = options.body instanceof FormData ? options.body : createFormData()
  if (options.fields) {
    appendFormDataFields(form, options.fields)
  }

  const fieldName = options.fieldName ?? 'file'
  if (options.file) {
    form.append(fieldName, options.file)
  }
  if (options.files) {
    for (const file of options.files) {
      form.append(fieldName, file)
    }
  }

  return form
}

export { createFormData, appendFormDataFields, resolveUploadBody }
