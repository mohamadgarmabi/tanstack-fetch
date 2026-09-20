import { n as Operation, t as HTTPHeaders, u as TRPCLink } from "./types-CAPs7vhA.mjs";
import { t as HTTPLinkBaseOptions } from "./httpUtils-C37jRVnj.mjs";
import { AnyClientTypes, AnyRouter } from "@trpc/server/unstable-core-do-not-import";
//#region src/links/httpLink.d.ts
type HTTPLinkOptions<TRoot extends AnyClientTypes> = HTTPLinkBaseOptions<TRoot> & {
  /**
   * Headers to be set on outgoing requests or a callback that of said headers
   * @see http://trpc.io/docs/client/headers
   */
  headers?: HTTPHeaders | ((opts: {
    op: Operation;
  }) => HTTPHeaders | Promise<HTTPHeaders>);
};
/**
 * @see https://trpc.io/docs/client/links/httpLink
 */
declare function httpLink<TRouter extends AnyRouter = AnyRouter>(opts: HTTPLinkOptions<TRouter['_def']['_config']['$types']>): TRPCLink<TRouter>;
//#endregion
export { httpLink as n, HTTPLinkOptions as t };
//# sourceMappingURL=httpLink-eSAq8J9S.d.mts.map