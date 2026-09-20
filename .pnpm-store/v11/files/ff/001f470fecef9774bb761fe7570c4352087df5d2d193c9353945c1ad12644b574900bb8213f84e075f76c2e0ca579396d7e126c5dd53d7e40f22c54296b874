import { _ as NonEmptyArray, n as Operation, t as HTTPHeaders, u as TRPCLink } from "./types-BxbMkv6C.cjs";
import { t as HTTPLinkBaseOptions } from "./httpUtils-CUqAubVD.cjs";
import { AnyClientTypes } from "@trpc/server/unstable-core-do-not-import";
import { AnyRouter as AnyRouter$1 } from "@trpc/server";
//#region src/links/HTTPBatchLinkOptions.d.ts
type HTTPBatchLinkOptions<TRoot extends AnyClientTypes> = HTTPLinkBaseOptions<TRoot> & {
  maxURLLength?: number;
  /**
   * Headers to be set on outgoing requests or a callback that of said headers
   * @see http://trpc.io/docs/client/headers
   */
  headers?: HTTPHeaders | ((opts: {
    opList: NonEmptyArray<Operation>;
  }) => HTTPHeaders | Promise<HTTPHeaders>);
  /**
   * Maximum number of calls in a single batch request
   * @default Infinity
   */
  maxItems?: number;
};
//#endregion
//#region src/links/httpBatchLink.d.ts
/**
 * @see https://trpc.io/docs/client/links/httpBatchLink
 */
declare function httpBatchLink<TRouter extends AnyRouter$1>(opts: HTTPBatchLinkOptions<TRouter['_def']['_config']['$types']>): TRPCLink<TRouter>;
//#endregion
export { HTTPBatchLinkOptions as n, httpBatchLink as t };
//# sourceMappingURL=httpBatchLink-Br-pzPXf.d.cts.map