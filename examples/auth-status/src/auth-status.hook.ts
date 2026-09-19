import { useEffect, useState } from 'react'
import { isFetchError } from 'tanstack-fetch'
import { api } from './lib/api'
import type { Profile } from './auth-status.type'

const useAuthStatusApp = () => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [message, setMessage] = useState('Loading…')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await api.get<Profile>('/me')
        if (!cancelled) {
          setProfile(data)
          setMessage('')
        }
      } catch (error) {
        if (cancelled) return
        if (isFetchError(error)) {
          setMessage(`${error.status}: ${error.message}`)
          return
        }
        setMessage('Something went wrong')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { profile, message }
}

export { useAuthStatusApp }
