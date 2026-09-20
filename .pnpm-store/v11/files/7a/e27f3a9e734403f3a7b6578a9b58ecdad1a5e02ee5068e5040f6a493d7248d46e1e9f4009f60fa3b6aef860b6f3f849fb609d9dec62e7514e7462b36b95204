import { J as AnyRouter, ft as inferRouterContext, gn as BaseHandlerOptions, ii as MaybePromise, yt as CreateContextCallback } from "../unstable-core-do-not-import-BK_OKrtM.mjs";
import { o as NodeHTTPCreateContextFnOptions } from "../index-_jAhoJQ7.mjs";
import { IncomingMessage } from "http";
import ws from "ws";
//#region src/adapters/wsEncoder.d.ts
/**
 * Encoder for WebSocket wire format.
 * Encodes outgoing messages and decodes incoming messages.
 *
 * @example
 * ```ts
 * const customEncoder: Encoder = {
 *   encode: (data) => myFormat.stringify(data),
 *   decode: (data) => myFormat.parse(data),
 * };
 * ```
 */
interface Encoder {
  /** Encode data for transmission over the wire */
  encode(data: unknown): string | Uint8Array<ArrayBuffer>;
  /** Decode data received from the wire */
  decode(data: string | ArrayBuffer | Uint8Array): unknown;
}
/**
 * Default JSON encoder - used when no encoder is specified.
 * This maintains backwards compatibility with existing behavior.
 */
export declare const jsonEncoder: Encoder;
//#endregion
//#region src/adapters/ws.d.ts
/**
 * @public
 */
export type CreateWSSContextFnOptions = NodeHTTPCreateContextFnOptions<IncomingMessage, ws.WebSocket>;
/**
 * @public
 */
export type CreateWSSContextFn<TRouter extends AnyRouter> = (opts: CreateWSSContextFnOptions) => MaybePromise<inferRouterContext<TRouter>>;
export type WSConnectionHandlerOptions<TRouter extends AnyRouter> = BaseHandlerOptions<TRouter, IncomingMessage> & CreateContextCallback<inferRouterContext<TRouter>, CreateWSSContextFn<TRouter>>;
/**
 * Web socket server handler
 */
export type WSSHandlerOptions<TRouter extends AnyRouter> = WSConnectionHandlerOptions<TRouter> & {
  wss: ws.WebSocketServer;
  prefix?: string;
  keepAlive?: {
    /**
     * Enable heartbeat messages
     * @default false
     */
    enabled: boolean;
    /**
     * Heartbeat interval in milliseconds
     * @default 30_000
     */
    pingMs?: number;
    /**
     * Terminate the WebSocket if no pong is received after this many milliseconds
     * @default 5_000
     */
    pongWaitMs?: number;
  };
  /**
   * Disable responding to ping messages from the client
   * **Not recommended** - this is mainly used for testing
   * @default false
   */
  dangerouslyDisablePong?: boolean;
  /**
   * Custom encoder for wire encoding (e.g. custom binary formats)
   * @default jsonEncoder
   */
  experimental_encoder?: Encoder;
};
export declare function getWSConnectionHandler<TRouter extends AnyRouter>(opts: WSSHandlerOptions<TRouter>): (client: ws.WebSocket, req: IncomingMessage) => void;
/**
 * Handle WebSocket keep-alive messages
 */
export declare function handleKeepAlive(client: ws.WebSocket, pingMs?: number, pongWaitMs?: number): void;
export declare function applyWSSHandler<TRouter extends AnyRouter>(opts: WSSHandlerOptions<TRouter>): {
  broadcastReconnectNotification: () => void;
};
//#endregion
export type { Encoder };
//# sourceMappingURL=ws.d.mts.map