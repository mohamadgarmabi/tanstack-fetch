# Refresh token on 401

Full walkthrough lives in the repo recipe. Pattern:

1. Intercept `onResponseError` when `status === 401`  
2. Refresh the access token once (dedupe in-flight refresh)  
3. Return `{ action: 'retry' }` so the original request runs again  

```ts
api.use('refresh-token', {
  order: 40,
  onResponseError: async (context) => {
    if (context.error?.status !== 401) {
      return { action: 'continue', context }
    }
    const token = await refreshAccessToken()
    if (!token) return { action: 'continue', context }
    context.request.headers.set('authorization', `Bearer ${token}`)
    return { action: 'retry' }
  },
})
```

Source: [`docs/recipes/refresh-token.md`](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/docs/recipes/refresh-token.md)
