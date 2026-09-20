import type { PathParamsOf } from '../types/path-params.type'

/**
 * Identity helper to build typed path params from a URL pattern.
 *
 * @example
 * pathParams('/users/:id', { id: '1' })
 * pathParams('/users/{id}/posts/{postId}', { id: 1, postId: 2 })
 */
const pathParams = <TPath extends string>(
  _path: TPath,
  params: PathParamsOf<TPath>,
): PathParamsOf<TPath> => params

export { pathParams }
