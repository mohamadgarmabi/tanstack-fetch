import type { AuthConfig, HttpInterceptor } from '../types'

const createAuthInterceptor = (auth: AuthConfig): HttpInterceptor => ({
  name: 'auth',
  order: 15,
  onRequest: async (context) => {
    const token = await auth.getToken()
    if (!token) {
      return { action: 'continue', context }
    }
    const header = auth.header ?? 'authorization'
    const scheme = auth.scheme === undefined ? 'Bearer' : auth.scheme
    const value = scheme ? `${scheme} ${token}` : token
    context.request.headers.set(header, value)
    return { action: 'continue', context }
  },
})

export { createAuthInterceptor }
