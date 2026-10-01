import type { HttpMethod } from './common.type'

/**
 * Response types keyed by path — `'/users/:id'` or `'GET /users/:id'` (method-specific wins).
 * Pass to `createFetch<Routes>()` so calls infer both the response and URL `params`.
 */
type FetchRoutes = object

type NoRoutes = Record<never, never>

/** Default for `TData` — replaced by the route-map entry (or `unknown`) when not passed explicitly. */
type InferData = { readonly '~tanstackFetchInferData': true }

type IsAny<T> = 0 extends 1 & T ? true : false

type RouteData<
  TRoutes,
  TMethod extends HttpMethod,
  TPath extends string,
> = `${TMethod} ${TPath}` extends keyof TRoutes
  ? TRoutes[`${TMethod} ${TPath}`]
  : TPath extends keyof TRoutes
    ? TRoutes[TPath]
    : unknown

type ResolveData<TData, TRoutes, TMethod extends HttpMethod, TPath extends string> =
  IsAny<TData> extends true
    ? TData
    : [TData] extends [InferData]
      ? RouteData<TRoutes, TMethod, TPath>
      : TData

type RoutePathKey<TKey, TMethod extends HttpMethod> = TKey extends `${TMethod} ${infer Path}`
  ? Path
  : TKey extends `${HttpMethod} ${string}`
    ? never
    : TKey & string

/** Known paths for autocomplete — any other string is still accepted. */
type RoutePath<TRoutes, TMethod extends HttpMethod> =
  RoutePathKey<keyof TRoutes, TMethod> | (string & {})

export type { FetchRoutes, NoRoutes, InferData, RouteData, ResolveData, RoutePath }
