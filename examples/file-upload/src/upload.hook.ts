import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { isFetchError } from 'tanstack-fetch'
import { api } from './lib/api'
import type { UploadResponse } from './upload.type'

const useUploadApp = () => {
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setErrorMessage('')
    setProgress(0)
    setResultUrl('')

    try {
      const uploaded = await api.upload<UploadResponse>('/files', {
        file,
        fieldName: 'avatar',
        fields: { folder: 'avatars' },
        onUploadProgress: ({ progress: value }) => {
          setProgress(Math.round((value ?? 0) * 100))
        },
      })
      setResultUrl(uploaded.url)
    } catch (error) {
      if (isFetchError(error)) {
        setErrorMessage(`${error.status}: ${error.message}`)
      } else {
        setErrorMessage('Upload failed')
      }
    } finally {
      setIsUploading(false)
    }
  }

  return { progress, resultUrl, errorMessage, isUploading, handleFileChange }
}

export { useUploadApp }
