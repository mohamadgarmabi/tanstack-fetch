import type { PathParams } from './common.type'

type PathParamValue = string | number

type ExtractColonParams<TPath extends string> =
  TPath extends `${string}:${infer Param}/${infer Rest}`
    ? CleanParamName<Param> | ExtractColonParams<`/${Rest}`>
    : TPath extends `${string}:${infer Param}`
      ? CleanParamName<Param>
      : never

type ExtractBraceParams<TPath extends string> =
  TPath extends `${string}{${infer Param}}${infer Rest}`
    ? CleanParamName<Param> | ExtractBraceParams<Rest>
    : never

type CleanParamName<T extends string> = T extends `${infer Name}?${string}`
  ? Name
  : T extends `${infer Name}&${string}`
    ? Name
    : T extends `${infer Name}#${string}`
      ? Name
      : T

/** Param names from `/users/:id` or `/users/{id}` patterns. */
type ExtractPathParamKeys<TPath extends string> =
  ExtractColonParams<TPath> | ExtractBraceParams<TPath>

/** `{ id: string | number }` inferred from a path pattern. */
type PathParamsOf<TPath extends string> = {
  [Key in ExtractPathParamKeys<TPath>]: PathParamValue
}

type HasRequiredPathParams<TPath extends string> = string extends TPath
  ? false
  : [ExtractPathParamKeys<TPath>] extends [never]
    ? false
    : true

/**
 * Merges request options with path-derived `params`.
 * - Path with `:id` / `{id}` → `params` required and typed
 * - Path without placeholders → `params` omitted
 * - Dynamic `string` path → loose `params?`
 */
type WithPathParams<TPath extends string> = string extends TPath
  ? { params?: PathParams }
  : HasRequiredPathParams<TPath> extends true
    ? { params: PathParamsOf<TPath> }
    : { params?: never }

type PathRequestArgs<TPath extends string, TBase> = string extends TPath
  ? [options?: TBase & { params?: PathParams }]
  : HasRequiredPathParams<TPath> extends true
    ? [options: TBase & { params: PathParamsOf<TPath> }]
    : [options?: TBase & { params?: never }]

/** Sentinel: no response generic was passed. */
type InferFetchData = { readonly '~tanstackFetchInferData': true }

/** Sentinel: no params generic was passed. Use as `NoParams` to skip to a body type. */
type UnsetFetchParams = { readonly '~tanstackFetchUnsetParams': true }

/** Alias for skipping the params generic: `api.post<User, NoParams, CreateUser>(…)`. */
type NoParams = UnsetFetchParams

/** Sentinel: no body generic was passed. */
type UnsetFetchBody = { readonly '~tanstackFetchUnsetBody': true }

type ResolveFetchData<TData> = [TData] extends [InferFetchData] ? unknown : TData

type FetchParamsConstraint = Record<string, PathParamValue> | UnsetFetchParams

type WithTypedBody<TBase, TBody> = [TBody] extends [UnsetFetchBody]
  ? TBase
  : Omit<TBase, 'body'> & { body: TBody }

/**
 * Every key in `TParams` must appear in the path as `:key` or `{key}`.
 * Catches `api.get<User, { userId: number }>('/users/:id')`.
 */
type PathMatchingParams<TParams> = [keyof TParams & string] extends [never]
  ? string
  : {
      [Key in keyof TParams & string]:
        | `${string}:${Key}`
        | `${string}:${Key}/${string}`
        | `${string}{${Key}}`
        | `${string}{${Key}}${string}`
    }[keyof TParams & string]

type FetchMethodPath<TParams, TPath extends string> = [TParams] extends [UnsetFetchParams]
  ? TPath
  : TPath & PathMatchingParams<Exclude<TParams, UnsetFetchParams>>

type ParamsOption<TParams> = [keyof TParams & string] extends [never]
  ? { params?: never }
  : { params: TParams }

/**
 * - No generics → `params` from the URL literal (`:id` / `{id}` required)
 * - `<Data>` only → options argument required (path literal is lost by TS)
 * - `<Data, Params>` → `params` required as `Params`; path must contain those keys
 * - `<Data, Params, Body>` (body methods) → `body` required as `Body` when set
 */
type FetchMethodArgs<TData, TParams, TPath extends string, TBase, TBody = UnsetFetchBody> = [
  TParams,
] extends [UnsetFetchParams]
  ? [TData] extends [InferFetchData]
    ? PathRequestArgs<TPath, WithTypedBody<TBase, TBody>>
    : [options: WithTypedBody<TBase & { params?: PathParams }, TBody>]
  : [options: WithTypedBody<TBase & ParamsOption<Exclude<TParams, UnsetFetchParams>>, TBody>]

export type {
  PathParamValue,
  ExtractPathParamKeys,
  PathParamsOf,
  HasRequiredPathParams,
  WithPathParams,
  PathRequestArgs,
  InferFetchData,
  UnsetFetchParams,
  NoParams,
  UnsetFetchBody,
  ResolveFetchData,
  FetchParamsConstraint,
  PathMatchingParams,
  FetchMethodPath,
  FetchMethodArgs,
}
