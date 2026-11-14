---
title: OpenAPI CLI
description: Generate a typed tanstack-fetch client from an OpenAPI document, or migrate from axios / ky / ofetch / fetch.
---

# OpenAPI CLI

![OpenAPI CLI](/images/page-guide-openapi.jpg)

The `tanstack-fetch` package ships a CLI that turns an OpenAPI document into a typed client: one TypeScript type per schema and one method per operation, built on `createFetch`. No extra package is needed.

## Generate a typed client from an OpenAPI spec

```bash
npx tanstack-fetch generate --spec ./openapi.json --out ./src/api
```

| Flag     | Required | Meaning                                                                     |
| -------- | -------- | --------------------------------------------------------------------------- |
| `--spec` | yes      | Path to an OpenAPI 3 document. `.json`, or `.yaml` / `.yml`                 |
| `--out`  | yes      | Output directory. Created if missing; the three files below are overwritten |

YAML specs need the optional `yaml` peer: `npm i -D yaml`. Run the command again whenever the spec changes; the output is meant to be regenerated, not edited.

### Output files

| File        | Contents                                                          |
| ----------- | ----------------------------------------------------------------- |
| `types.ts`  | A type for each `components.schemas` entry                        |
| `client.ts` | `createApi(options)`, which returns the operations grouped by tag |
| `index.ts`  | Re-exports `createApi` and every type                             |

## Example: spec → generated types → usage

A small spec (trimmed):

```yaml
paths:
  /users/{id}:
    parameters:
      - { name: id, in: path, required: true, schema: { type: integer } }
    get:
      operationId: getUser
      tags: [users]
      responses:
        '200': { content: { application/json: { schema: { $ref: '#/components/schemas/User' } } } }
  /users:
    get:
      operationId: listUsers
      tags: [users]
      parameters:
        - { name: page, in: query, schema: { type: integer } }
      responses:
        '200':
          content:
            application/json:
              { schema: { type: array, items: { $ref: '#/components/schemas/User' } } }
    post:
      operationId: createUser
      tags: [users]
      requestBody:
        content: { application/json: { schema: { $ref: '#/components/schemas/NewUser' } } }
      responses:
        '201': { content: { application/json: { schema: { $ref: '#/components/schemas/User' } } } }
components:
  schemas:
    User:
      type: object
      required: [id, name]
      properties:
        id: { type: integer }
        name: { type: string }
        role: { enum: [admin, member] }
        x-trace-id: { type: string }
    NewUser:
      type: object
      required: [name]
      properties:
        name: { type: string }
```

`types.ts`:

```ts
type User = {
  id: number
  name: string
  role?: 'admin' | 'member'
  'x-trace-id'?: string
}

type NewUser = {
  name: string
}

export type { User, NewUser }
```

`client.ts` (shortened):

```ts
const createApi = (options: CreateFetchOptions = {}) => {
  const api = createFetch(options)
  return {
    users: {
      getUser: (
        options: Omit<RequestOptions, 'params' | 'query' | 'body'> & { params: { id: number } },
      ) => api.get<User, { id: number }>('/users/:id', options),
      listUsers: (
        options: Omit<RequestOptions, 'params' | 'query' | 'body'> & { query?: { page?: number } },
      ) => api.get<Array<User>>('/users', options),
      createUser: (
        options: Omit<RequestOptions, 'params' | 'query' | 'body'> & { body: NewUser },
      ) => api.post<User, NoParams, NewUser>('/users', options),
    },
  }
}
```

### Use the generated client with TanStack Query

Every method accepts the normal request options, so pass Query's `signal` for cancellation:

```ts
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { createAuthInterceptor } from 'tanstack-fetch/plugins'
import { createApi, type NewUser } from './api'

export const api = createApi({
  baseUrl: import.meta.env.VITE_API_URL,
  interceptors: [createAuthInterceptor({ getToken: () => localStorage.getItem('token') })],
})

export const userQuery = (id: number) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) => api.users.getUser({ params: { id }, signal }),
  })

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: NewUser) => api.users.createUser({ body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
```

`useQuery(userQuery(1))` then returns `data` typed as `User`. Errors are [`FetchError`s](/api/errors).

::: tip Which createFetch
`client.ts` imports `createFetch` from `tanstack-fetch`, from `tanstack-fetch/sse` when an operation returns `text/event-stream`, or from `tanstack-fetch/live` when one returns NDJSON. On the core entry, option shortcuts such as `getToken` or `onUnauthorized` are ignored: pass interceptors from `tanstack-fetch/plugins`, as above.
:::

## Naming rules

- **Groups** come from each operation's first tag, camel-cased. Untagged operations go under `api`.
- **Method names** come from `operationId`, camel-cased. Without one, the name is built from the method and path: `GET /users/{id}` → `getUsersId`.
- **Type names** are the schema names in PascalCase: `user-profile` → `UserProfile`.
- **Property and parameter names** that aren't valid identifiers (`content-type`, `@id`, `x-trace-id`) are quoted.
- **Collisions** after conversion get a numeric suffix: `user-profile` and `user_profile` become `UserProfile` and `UserProfile2`; `getUser` and `get_user` in the same tag become `getUser` and `getUser2`.
- **Path parameters** (`{id}`) become `:id` in the client path and a typed `params` object. Query parameters become an optional `query` object.
- **Path-level `parameters`** and `#/components/parameters` `$ref`s are merged into each operation. An operation's own parameter wins over a path-level one with the same `name` and `in`.

## What the generator reads, and its limits

- Methods: `get`, `post`, `put`, `patch`, `delete`. Others are skipped.
- Response type: the `200` response, else `201`, from `application/json`, `text/event-stream` or NDJSON content. No schema gives `unknown`.
- Request body: `application/json` only.
- Parameters: `path` and `query`. `header` and `cookie` parameters are not typed; set them with `headers`.
- Schemas: `type`, `properties`, `required`, `items`, `enum` and `$ref`. `allOf`, `oneOf` and `anyOf` become `unknown`; `nullable` and `additionalProperties` are ignored.
- **Dashed path parameters** such as `{user-id}` stay literal in the URL and are never filled. Rename them to `{userId}` or `{user_id}` in the spec.
- **Schema names that start with a digit** (`2FAConfig`) produce an invalid TypeScript type name. Rename the schema.

## Migrate from axios / ky / ofetch / fetch

```bash
npx tanstack-fetch doctor --dir ./src
npx tanstack-fetch migrate --from axios --framework react --dir ./src --write
npx tanstack-fetch migrate --from ofetch --framework nuxt --write
npx tanstack-fetch migrate --from fetch --framework nextjs --write
npx tanstack-fetch migrate --from axios --framework vue --write
npx tanstack-fetch migrate --from axios --framework solid --write
npx tanstack-fetch migrate --from fetch --framework sveltekit --write
```

Full mapping + scaffolds: [Migrate](/guide/migrate).

The CLI ships as the `tanstack-fetch` binary from the same package. `npx tanstack-fetch --help` lists every command and flag.

## Related

- [Getting started](/guide/getting-started)
- [TanStack Query](/guide/tanstack-query)
- [FetchClient](/api/fetch-client): request options every generated method accepts
- [Migrate](/guide/migrate)
