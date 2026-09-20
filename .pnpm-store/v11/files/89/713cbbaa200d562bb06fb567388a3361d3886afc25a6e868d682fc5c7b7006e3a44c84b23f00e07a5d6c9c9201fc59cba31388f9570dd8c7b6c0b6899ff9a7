import { t as TRPCConnectionState } from "./subscriptions-DcqRZc4h.cjs";
import { DefaultErrorShape, InferrableClientTypes, Maybe, TRPCErrorResponse, TRPCResultMessage, TRPCSuccessResponse, inferClientTypes } from "@trpc/server/unstable-core-do-not-import";
import { Observable, Observer } from "@trpc/server/observable";
//#region src/internals/types.d.ts
/**
 * A subset of the standard fetch function type needed by tRPC internally.
 * @see fetch from lib.dom.d.ts
 * @remarks
 * If you need a property that you know exists but doesn't exist on this
 * interface, go ahead and add it.
 */
type FetchEsque = (input: RequestInfo | URL | string, init?: RequestInit | RequestInitEsque) => Promise<ResponseEsque>;
/**
 * A simpler version of the native fetch function's type for packages with
 * their own fetch types, such as undici and node-fetch.
 */
type NativeFetchEsque = (url: URL | string, init?: NodeFetchRequestInitEsque) => Promise<ResponseEsque>;
interface NodeFetchRequestInitEsque {
  body?: string;
}
/**
 * A subset of the standard RequestInit properties needed by tRPC internally.
 * @see RequestInit from lib.dom.d.ts
 * @remarks
 * If you need a property that you know exists but doesn't exist on this
 * interface, go ahead and add it.
 */
interface RequestInitEsque {
  /**
   * Sets the request's body.
   */
  body?: FormData | string | null | Uint8Array<ArrayBuffer> | Blob | File;
  /**
   * Sets the request's associated headers.
   */
  headers?: [string, string][] | Record<string, string>;
  /**
   * The request's HTTP-style method.
   */
  method?: string;
  /**
   * Sets the request's signal.
   */
  signal?: AbortSignal | undefined;
}
/**
 * A subset of the standard ReadableStream properties needed by tRPC internally.
 * @see ReadableStream from lib.dom.d.ts
 */
type WebReadableStreamEsque = {
  getReader: () => ReadableStreamDefaultReader<Uint8Array>;
};
type NodeJSReadableStreamEsque = {
  on(eventName: string | symbol, listener: (...args: any[]) => void): NodeJSReadableStreamEsque;
};
/**
 * A subset of the standard Response properties needed by tRPC internally.
 * @see Response from lib.dom.d.ts
 */
interface ResponseEsque {
  readonly ok: boolean;
  readonly body?: NodeJSReadableStreamEsque | WebReadableStreamEsque | null;
  /**
   * @remarks
   * The built-in Response::json() method returns Promise<any>, but
   * that's not as type-safe as unknown. We use unknown because we're
   * more type-safe. You do want more type safety, right? 😉
   */
  json(): Promise<unknown>;
}
/**
 * @internal
 */
type NonEmptyArray<TItem> = [TItem, ...TItem[]];
type ClientContext = Record<string, unknown>;
/**
 * @public
 */
interface TRPCProcedureOptions {
  /**
   * Client-side context
   */
  context?: ClientContext;
  signal?: AbortSignal;
}
//#endregion
//#region src/TRPCClientError.d.ts
type inferErrorShape<TInferrable extends InferrableClientTypes> = inferClientTypes<TInferrable>['errorShape'];
interface TRPCClientErrorBase<TShape extends DefaultErrorShape> {
  readonly message: string;
  readonly shape: Maybe<TShape>;
  readonly data: Maybe<TShape['data']>;
}
type TRPCClientErrorLike<TInferrable extends InferrableClientTypes> = TRPCClientErrorBase<inferErrorShape<TInferrable>>;
declare function isTRPCClientError<TInferrable extends InferrableClientTypes>(cause: unknown): cause is TRPCClientError<TInferrable>;
declare class TRPCClientError<TRouterOrProcedure extends InferrableClientTypes> extends Error implements TRPCClientErrorBase<inferErrorShape<TRouterOrProcedure>> {
  readonly cause: Error | undefined;
  readonly shape: Maybe<inferErrorShape<TRouterOrProcedure>>;
  readonly data: Maybe<inferErrorShape<TRouterOrProcedure>['data']>;
  /**
   * Additional meta data about the error
   * In the case of HTTP-errors, we'll have `response` and potentially `responseJSON` here
   */
  meta: Record<string, unknown> | undefined;
  constructor(message: string, opts?: {
    result?: Maybe<TRPCErrorResponse<inferErrorShape<TRouterOrProcedure>>>;
    cause?: Error;
    meta?: Record<string, unknown>;
  });
  static from<TRouterOrProcedure extends InferrableClientTypes>(_cause: Error | TRPCErrorResponse<any> | object, opts?: {
    meta?: Record<string, unknown>;
    cause?: Error;
  }): TRPCClientError<TRouterOrProcedure>;
}
//#endregion
//#region src/links/types.d.ts
/**
 * @internal
 */
interface OperationContext extends Record<string, unknown> {}
/**
 * @internal
 */
type Operation<TInput = unknown> = {
  id: number;
  type: 'mutation' | 'query' | 'subscription';
  input: TInput;
  path: string;
  context: OperationContext;
  signal: Maybe<AbortSignal>;
};
interface HeadersInitEsque {
  [Symbol.iterator](): IterableIterator<[string, string]>;
}
/**
 * @internal
 */
type HTTPHeaders = HeadersInitEsque | Record<string, string[] | string | undefined>;
/**
 * The default `fetch` implementation has an overloaded signature. By convention this library
 * only uses the overload taking a string and options object.
 */
type TRPCFetch = (url: string, options?: RequestInit) => Promise<ResponseEsque>;
interface TRPCClientRuntime {}
/**
 * @internal
 */
interface OperationResultEnvelope<TOutput, TError> {
  result: TRPCResultMessage<TOutput>['result'] | TRPCSuccessResponse<TOutput>['result'] | TRPCConnectionState<TError>;
  context?: OperationContext;
}
/**
 * @internal
 */
type OperationResultObservable<TInferrable extends InferrableClientTypes, TOutput> = Observable<OperationResultEnvelope<TOutput, TRPCClientError<TInferrable>>, TRPCClientError<TInferrable>>;
/**
 * @internal
 */
type OperationResultObserver<TInferrable extends InferrableClientTypes, TOutput> = Observer<OperationResultEnvelope<TOutput, TRPCClientError<TInferrable>>, TRPCClientError<TInferrable>>;
/**
 * @internal
 */
type OperationLink<TInferrable extends InferrableClientTypes, TInput = unknown, TOutput = unknown> = (opts: {
  op: Operation<TInput>;
  next: (op: Operation<TInput>) => OperationResultObservable<TInferrable, TOutput>;
}) => OperationResultObservable<TInferrable, TOutput>;
/**
 * @public
 */
type TRPCLink<TInferrable extends InferrableClientTypes> = (opts: TRPCClientRuntime) => OperationLink<TInferrable>;
//#endregion
export { NonEmptyArray as _, OperationResultEnvelope as a, TRPCClientRuntime as c, TRPCClientError as d, TRPCClientErrorBase as f, NativeFetchEsque as g, FetchEsque as h, OperationLink as i, TRPCFetch as l, isTRPCClientError as m, Operation as n, OperationResultObservable as o, TRPCClientErrorLike as p, OperationContext as r, OperationResultObserver as s, HTTPHeaders as t, TRPCLink as u, TRPCProcedureOptions as v };
//# sourceMappingURL=types-BxbMkv6C.d.cts.map