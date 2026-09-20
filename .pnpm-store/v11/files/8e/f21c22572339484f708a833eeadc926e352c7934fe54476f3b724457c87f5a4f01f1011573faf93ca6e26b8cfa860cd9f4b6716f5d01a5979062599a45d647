import { J as AnyRouter } from "../unstable-core-do-not-import-BK_OKrtM.mjs";
import { c as NodeHTTPHandlerOptions, d as NodeHTTPResponse, l as NodeHTTPRequest, o as NodeHTTPCreateContextFnOptions } from "../index-_jAhoJQ7.mjs";
import http from "http";
import * as http2 from "http2";
//#region src/adapters/standalone.d.ts
type StandaloneHandlerOptions<TRouter extends AnyRouter, TRequest extends NodeHTTPRequest, TResponse extends NodeHTTPResponse> = NodeHTTPHandlerOptions<TRouter, TRequest, TResponse> & {
  /**
   * The base path to handle requests for.
   * This will be sliced from the beginning of the request path
   * (Do not miss including the trailing slash)
   * @default '/'
   * @example '/trpc/'
   * @example '/trpc/api/'
   */
  basePath?: string;
};
export type CreateHTTPHandlerOptions<TRouter extends AnyRouter> = StandaloneHandlerOptions<TRouter, http.IncomingMessage, http.ServerResponse>;
export type CreateHTTPContextOptions = NodeHTTPCreateContextFnOptions<http.IncomingMessage, http.ServerResponse>;
/**
 * @internal
 */
export declare function createHTTPHandler<TRouter extends AnyRouter>(opts: CreateHTTPHandlerOptions<TRouter>): http.RequestListener;
export declare function createHTTPServer<TRouter extends AnyRouter>(opts: CreateHTTPHandlerOptions<TRouter>): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export type CreateHTTP2HandlerOptions<TRouter extends AnyRouter> = StandaloneHandlerOptions<TRouter, http2.Http2ServerRequest, http2.Http2ServerResponse>;
export type CreateHTTP2ContextOptions = NodeHTTPCreateContextFnOptions<http2.Http2ServerRequest, http2.Http2ServerResponse>;
export declare function createHTTP2Handler(opts: CreateHTTP2HandlerOptions<AnyRouter>): (req: http2.Http2ServerRequest, res: http2.Http2ServerResponse<http2.Http2ServerRequest>) => void;
//#endregion
//# sourceMappingURL=standalone.d.mts.map