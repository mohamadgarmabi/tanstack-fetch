import { t as TRPCConnectionState } from "./subscriptions-DcqRZc4h.cjs";
import { a as OperationResultEnvelope, c as TRPCClientRuntime, d as TRPCClientError, f as TRPCClientErrorBase, g as NativeFetchEsque, h as FetchEsque, i as OperationLink, l as TRPCFetch, m as isTRPCClientError, n as Operation, o as OperationResultObservable, p as TRPCClientErrorLike, r as OperationContext, s as OperationResultObserver, t as HTTPHeaders, u as TRPCLink, v as TRPCProcedureOptions } from "./types-BxbMkv6C.cjs";
import { n as TransformerOptions } from "./unstable-internals-CE8gFBQ9.cjs";
import { n as HTTPBatchLinkOptions, t as httpBatchLink } from "./httpBatchLink-Br-pzPXf.cjs";
import { n as httpLink, t as HTTPLinkOptions } from "./httpLink-D5FQijY2.cjs";
import { n as loggerLink, t as LoggerLinkOptions } from "./loggerLink-2o-uZ3r1.cjs";
import { t as splitLink } from "./splitLink-CJdcmEmS.cjs";
import { a as WebSocketClientOptions, c as jsonEncoder, i as createWSClient, n as wsLink, o as UrlOptionsWithConnectionParams, r as TRPCWebSocketClient, s as Encoder, t as WebSocketLinkOptions } from "./wsLink-DoiyfDgJ.cjs";
import { AnyClientTypes, AnyProcedure, AnyRouter, ErrorHandlerOptions, EventSourceLike, InferrableClientTypes, ProcedureType, RouterRecord, TypeError, inferAsyncIterableYield, inferClientTypes, inferProcedureInput, inferRouterContext, inferTransformedProcedureOutput } from "@trpc/server/unstable-core-do-not-import";
import { Unsubscribable } from "@trpc/server/observable";
import { AnyRouter as AnyRouter$1 } from "@trpc/server";
//#region src/links/internals/contentTypes.d.ts
export declare function isOctetType(input: unknown): input is Uint8Array<ArrayBuffer> | Blob;
export declare function isFormData(input: unknown): input is FormData;
export declare function isNonJsonSerializable(input: unknown): input is Blob | FormData | Uint8Array<ArrayBuffer>;
//#endregion
//#region src/internals/TRPCUntypedClient.d.ts
interface TRPCRequestOptions {
  /**
   * Pass additional context to links
   */
  context?: OperationContext;
  signal?: AbortSignal;
}
interface TRPCSubscriptionObserver<TValue, TError> {
  onStarted: (opts: {
    context: OperationContext | undefined;
  }) => void;
  onData: (value: inferAsyncIterableYield<TValue>) => void;
  onError: (err: TError) => void;
  onStopped: () => void;
  onComplete: () => void;
  onConnectionStateChange: (state: TRPCConnectionState<TError>) => void;
}
/** @internal */
type CreateTRPCClientOptions<TRouter extends InferrableClientTypes> = {
  links: TRPCLink<TRouter>[];
  transformer?: TypeError<'The transformer property has moved to httpLink/httpBatchLink/wsLink'>;
};
export declare class TRPCUntypedClient<TInferrable extends InferrableClientTypes> {
  private readonly links;
  readonly runtime: TRPCClientRuntime;
  private requestId;
  constructor(opts: CreateTRPCClientOptions<TInferrable>);
  private $request;
  private requestAsPromise;
  query(path: string, input?: unknown, opts?: TRPCRequestOptions): Promise<unknown>;
  mutation(path: string, input?: unknown, opts?: TRPCRequestOptions): Promise<unknown>;
  subscription(path: string, input: unknown, opts: Partial<TRPCSubscriptionObserver<unknown, TRPCClientError<AnyRouter>>> & TRPCRequestOptions): Unsubscribable;
}
//#endregion
//#region src/createTRPCUntypedClient.d.ts
export declare function createTRPCUntypedClient<TRouter extends AnyRouter>(opts: CreateTRPCClientOptions<TRouter>): TRPCUntypedClient<TRouter>;
//#endregion
//#region src/createTRPCClient.d.ts
/**
 * @public
 * @deprecated use {@link TRPCClient} instead, will be removed in v12
 **/
export type inferRouterClient<TRouter extends AnyRouter> = TRPCClient<TRouter>;
/**
 * @public
 * @deprecated use {@link TRPCClient} instead, will be removed in v12
 **/
export type CreateTRPCClient<TRouter extends AnyRouter> = TRPCClient<TRouter>;
declare const untypedClientSymbol: unique symbol;
/**
 * @public
 **/
export type TRPCClient<TRouter extends AnyRouter> = DecoratedProcedureRecord<{
  transformer: TRouter['_def']['_config']['$types']['transformer'];
  errorShape: TRouter['_def']['_config']['$types']['errorShape'];
}, TRouter['_def']['record']> & {
  [untypedClientSymbol]: TRPCUntypedClient<TRouter>;
};
/** @internal */
export type TRPCResolverDef = {
  input: any;
  output: any;
  transformer: boolean;
  errorShape: any;
};
type coerceAsyncGeneratorToIterable<T> = T extends AsyncGenerator<infer $T, infer $Return, infer $Next> ? AsyncIterable<$T, $Return, $Next> : T;
/** @internal */
export type Resolver<TDef extends TRPCResolverDef> = (input: TDef['input'], opts?: TRPCProcedureOptions) => Promise<coerceAsyncGeneratorToIterable<TDef['output']>>;
/** @internal */
export type SubscriptionResolver<TDef extends TRPCResolverDef> = (input: TDef['input'], opts: Partial<TRPCSubscriptionObserver<TDef['output'], TRPCClientError<TDef>>> & TRPCProcedureOptions) => Unsubscribable;
type DecorateProcedure<TType extends ProcedureType, TDef extends TRPCResolverDef> = TType extends 'query' ? {
  query: Resolver<TDef>;
} : TType extends 'mutation' ? {
  mutate: Resolver<TDef>;
} : TType extends 'subscription' ? {
  subscribe: SubscriptionResolver<TDef>;
} : never;
/**
 * @internal
 */
type DecoratedProcedureRecord<TRoot extends InferrableClientTypes, TRecord extends RouterRecord> = { [TKey in keyof TRecord]: TRecord[TKey] extends (infer $Value) ? $Value extends AnyProcedure ? DecorateProcedure<$Value['_def']['type'], {
  input: inferProcedureInput<$Value>;
  output: inferTransformedProcedureOutput<inferClientTypes<TRoot>, $Value>;
  errorShape: inferClientTypes<TRoot>['errorShape'];
  transformer: inferClientTypes<TRoot>['transformer'];
}> : $Value extends RouterRecord ? DecoratedProcedureRecord<TRoot, $Value> : never : never; };
/** @internal */
export declare const clientCallTypeToProcedureType: (clientCallType: string) => ProcedureType;
/**
 * @internal
 */
export declare function createTRPCClientProxy<TRouter extends AnyRouter>(client: TRPCUntypedClient<TRouter>): TRPCClient<TRouter>;
export declare function createTRPCClient<TRouter extends AnyRouter>(opts: CreateTRPCClientOptions<TRouter>): TRPCClient<TRouter>;
/**
 * Get an untyped client from a proxy client
 * @internal
 */
export declare function getUntypedClient<TRouter extends AnyRouter>(client: TRPCClient<TRouter>): TRPCUntypedClient<TRouter>;
//#endregion
//#region src/getFetch.d.ts
export declare function getFetch(customFetchImpl?: FetchEsque | NativeFetchEsque): FetchEsque;
//#endregion
//#region src/links/httpBatchStreamLink.d.ts
export type HTTPBatchStreamLinkOptions<TRoot extends AnyClientTypes> = HTTPBatchLinkOptions<TRoot> & {
  /**
   * Which header to use to signal the server that the client wants a streaming response.
   * - `'trpc-accept'` (default): sends `trpc-accept: application/jsonl` header
   * - `'accept'`: sends `Accept: application/jsonl` header, which can avoid CORS preflight for cross-origin streaming queries. Be aware that `application/jsonl` is not an official MIME type and so this is not completely spec-compliant - you should test that your infrastructure supports this value.
   * @default 'trpc-accept'
   */
  streamHeader?: 'trpc-accept' | 'accept';
};
/**
 * @see https://trpc.io/docs/client/links/httpBatchStreamLink
 */
export declare function httpBatchStreamLink<TRouter extends AnyRouter$1>(opts: HTTPBatchStreamLinkOptions<TRouter['_def']['_config']['$types']>): TRPCLink<TRouter>;
/**
 * @deprecated use {@link httpBatchStreamLink} instead
 */
export declare const unstable_httpBatchStreamLink: typeof httpBatchStreamLink;
//#endregion
//#region src/links/httpSubscriptionLink.d.ts
type HTTPSubscriptionLinkOptions<TRoot extends AnyClientTypes, TEventSource extends EventSourceLike.AnyConstructor = typeof EventSource> = {
  /**
   * EventSource ponyfill
   */
  EventSource?: TEventSource;
  /**
   * EventSource options or a callback that returns them
   */
  eventSourceOptions?: EventSourceLike.InitDictOf<TEventSource> | ((opts: {
    op: Operation;
  }) => EventSourceLike.InitDictOf<TEventSource> | Promise<EventSourceLike.InitDictOf<TEventSource>>);
} & TransformerOptions<TRoot> & UrlOptionsWithConnectionParams;
/**
 * @see https://trpc.io/docs/client/links/httpSubscriptionLink
 */
export declare function httpSubscriptionLink<TInferrable extends InferrableClientTypes, TEventSource extends EventSourceLike.AnyConstructor>(opts: HTTPSubscriptionLinkOptions<inferClientTypes<TInferrable>, TEventSource>): TRPCLink<TInferrable>;
/**
 * @deprecated use {@link httpSubscriptionLink} instead
 */
export declare const unstable_httpSubscriptionLink: typeof httpSubscriptionLink;
//#endregion
//#region src/links/retryLink.d.ts
interface RetryLinkOptions<TInferrable extends InferrableClientTypes> {
  /**
   * The retry function
   */
  retry: (opts: RetryFnOptions<TInferrable>) => boolean;
  /**
   * The delay between retries in ms (defaults to 0)
   */
  retryDelayMs?: (attempt: number) => number;
}
interface RetryFnOptions<TInferrable extends InferrableClientTypes> {
  /**
   * The operation that failed
   */
  op: Operation;
  /**
   * The error that occurred
   */
  error: TRPCClientError<TInferrable>;
  /**
   * The number of attempts that have been made (including the first call)
   */
  attempts: number;
}
/**
 * @see https://trpc.io/docs/v11/client/links/retryLink
 */
export declare function retryLink<TInferrable extends InferrableClientTypes>(opts: RetryLinkOptions<TInferrable>): TRPCLink<TInferrable>;
//#endregion
//#region src/links/localLink.d.ts
export type LocalLinkOptions<TRouter extends AnyRouter> = {
  router: TRouter;
  createContext: () => Promise<inferRouterContext<TRouter>>;
  onError?: (opts: ErrorHandlerOptions<inferRouterContext<TRouter>>) => void;
} & TransformerOptions<inferClientTypes<TRouter>>;
/**
 * localLink is a terminating link that allows you to make tRPC procedure calls directly in your application without going through HTTP.
 *
 * @see https://trpc.io/docs/links/localLink
 */
export declare function unstable_localLink<TRouter extends AnyRouter>(opts: LocalLinkOptions<TRouter>): TRPCLink<TRouter>;
/**
 * @deprecated Renamed to `unstable_localLink`. This alias will be removed in a future major release.
 */
export declare const experimental_localLink: typeof unstable_localLink;
//#endregion
export { type CreateTRPCClientOptions, type Encoder, HTTPBatchLinkOptions, HTTPHeaders, HTTPLinkOptions, LoggerLinkOptions, Operation, OperationContext, OperationLink, OperationResultEnvelope, OperationResultObservable, OperationResultObserver, TRPCClientError, TRPCClientErrorBase, TRPCClientErrorLike, TRPCClientRuntime, TRPCFetch, TRPCLink, type TRPCProcedureOptions, type TRPCRequestOptions, type TRPCWebSocketClient, type WebSocketClientOptions, WebSocketLinkOptions, createTRPCClient as createTRPCProxyClient, createWSClient, httpBatchLink, httpLink, type inferRouterClient as inferRouterProxyClient, isTRPCClientError, jsonEncoder, loggerLink, splitLink, wsLink };
//# sourceMappingURL=index.d.cts.map