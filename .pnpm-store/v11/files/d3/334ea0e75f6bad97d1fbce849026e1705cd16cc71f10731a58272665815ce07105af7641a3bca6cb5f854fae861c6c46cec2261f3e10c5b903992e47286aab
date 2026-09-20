import { Cn as TRPCRequestInfo, J as AnyRouter, _n as HTTPBaseHandlerOptions, ft as inferRouterContext, yt as CreateContextCallback } from "../../unstable-core-do-not-import-B9ZnrQAU.cjs";
//#region src/adapters/fetch/types.d.ts
export type FetchCreateContextFnOptions = {
  req: Request;
  resHeaders: Headers;
  info: TRPCRequestInfo;
};
export type FetchCreateContextFn<TRouter extends AnyRouter> = (opts: FetchCreateContextFnOptions) => inferRouterContext<TRouter> | Promise<inferRouterContext<TRouter>>;
export type FetchCreateContextOption<TRouter extends AnyRouter> = CreateContextCallback<inferRouterContext<TRouter>, FetchCreateContextFn<TRouter>>;
export type FetchHandlerOptions<TRouter extends AnyRouter> = FetchCreateContextOption<TRouter> & HTTPBaseHandlerOptions<TRouter, Request> & {
  req: Request;
  endpoint: string;
};
export type FetchHandlerRequestOptions<TRouter extends AnyRouter> = HTTPBaseHandlerOptions<TRouter, Request> & CreateContextCallback<inferRouterContext<TRouter>, FetchCreateContextFn<TRouter>> & {
  req: Request;
  endpoint: string;
};
//#endregion
//#region src/adapters/fetch/fetchRequestHandler.d.ts
export declare function fetchRequestHandler<TRouter extends AnyRouter>(opts: FetchHandlerRequestOptions<TRouter>): Promise<Response>;
//#endregion
//# sourceMappingURL=index.d.cts.map