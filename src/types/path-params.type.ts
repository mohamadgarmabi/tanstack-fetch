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

export type {
  PathParamValue,
  ExtractPathParamKeys,
  PathParamsOf,
  HasRequiredPathParams,
  WithPathParams,
  PathRequestArgs,
}
