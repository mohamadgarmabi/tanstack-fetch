// `upload()` and progress events live on the full client.
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
  getToken: () => localStorage.getItem('access_token'),
})

export { api }
