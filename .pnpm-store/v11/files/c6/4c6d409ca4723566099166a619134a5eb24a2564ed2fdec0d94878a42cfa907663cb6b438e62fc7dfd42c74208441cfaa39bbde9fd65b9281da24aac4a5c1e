import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.mjs";
import { t as TRPCClientError } from "./TRPCClientError-CxFRO7Js.mjs";
import { getTransformer } from "./unstable-internals.mjs";
import { behaviorSubject, observable } from "@trpc/server/observable";
import { run, sleep, transformResult } from "@trpc/server/unstable-core-do-not-import";
//#region src/links/wsLink/wsClient/encoder.ts
const jsonEncoder = {
	encode: (data) => JSON.stringify(data),
	decode: (data) => {
		if (typeof data !== "string") throw new Error("jsonEncoder received binary data. JSON uses text frames. Use a binary encoder for binary data.");
		return JSON.parse(data);
	}
};
//#endregion
//#region src/links/wsLink/wsClient/options.ts
const lazyDefaults = {
	enabled: false,
	closeMs: 0
};
const keepAliveDefaults = {
	enabled: false,
	pongTimeoutMs: 1e3,
	intervalMs: 5e3
};
/**
* Calculates a delay for exponential backoff based on the retry attempt index.
* The delay starts at 0 for the first attempt and doubles for each subsequent attempt,
* capped at 30 seconds.
*/
const exponentialBackoff = (attemptIndex) => {
	return attemptIndex === 0 ? 0 : Math.min(1e3 * 2 ** attemptIndex, 3e4);
};
//#endregion
//#region src/links/internals/urlWithConnectionParams.ts
/**
* Get the result of a value or function that returns a value
* It also optionally accepts typesafe arguments for the function
*/
const resultOf = (value, ...args) => {
	return typeof value === "function" ? value(...args) : value;
};
//#endregion
//#region src/links/wsLink/wsClient/utils.ts
var TRPCWebSocketClosedError = class TRPCWebSocketClosedError extends Error {
	constructor(opts) {
		super(opts.message, { cause: opts.cause });
		this.name = "TRPCWebSocketClosedError";
		Object.setPrototypeOf(this, TRPCWebSocketClosedError.prototype);
	}
};
/**
* Utility class for managing a timeout that can be started, stopped, and reset.
* Useful for scenarios where the timeout duration is reset dynamically based on events.
*/
var ResettableTimeout = class {
	constructor(onTimeout, timeoutMs) {
		this.onTimeout = onTimeout;
		this.timeoutMs = timeoutMs;
		_defineProperty(this, "timeout", void 0);
	}
	/**
	* Resets the current timeout, restarting it with the same duration.
	* Does nothing if no timeout is active.
	*/
	reset() {
		if (!this.timeout) return;
		clearTimeout(this.timeout);
		this.timeout = setTimeout(this.onTimeout, this.timeoutMs);
	}
	start() {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(this.onTimeout, this.timeoutMs);
	}
	stop() {
		clearTimeout(this.timeout);
		this.timeout = void 0;
	}
};
function withResolvers() {
	let resolve;
	let reject;
	return {
		promise: new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		}),
		resolve,
		reject
	};
}
/**
* Resolves a WebSocket URL and optionally appends connection parameters.
*
* If connectionParams are provided, appends 'connectionParams=1' query parameter.
*/
async function prepareUrl(urlOptions) {
	const url = await resultOf(urlOptions.url);
	if (!urlOptions.connectionParams) return url;
	return url + `${url.includes("?") ? "&" : "?"}connectionParams=1`;
}
async function buildConnectionMessage(connectionParams, encoder) {
	const message = {
		method: "connectionParams",
		data: await resultOf(connectionParams)
	};
	return encoder.encode(message);
}
//#endregion
//#region src/links/wsLink/wsClient/requestManager.ts
/**
* Manages WebSocket requests, tracking their lifecycle and providing utility methods
* for handling outgoing and pending requests.
*
* - **Outgoing requests**: Requests that are queued and waiting to be sent.
* - **Pending requests**: Requests that have been sent and are in flight awaiting a response.
*   For subscriptions, multiple responses may be received until the subscription is closed.
*/
var RequestManager = class {
	constructor() {
		_defineProperty(this, "outgoingRequests", new Array());
		_defineProperty(this, "pendingRequests", {});
	}
	/**
	* Registers a new request by adding it to the outgoing queue and setting up
	* callbacks for lifecycle events such as completion or error.
	*
	* @param message - The outgoing message to be sent.
	* @param callbacks - Callback functions to observe the request's state.
	* @returns A cleanup function to manually remove the request.
	*/
	register(message, callbacks) {
		const { promise: end, resolve } = withResolvers();
		this.outgoingRequests.push({
			id: String(message.id),
			message,
			end,
			callbacks: {
				next: callbacks.next,
				complete: () => {
					callbacks.complete();
					resolve();
				},
				error: (e) => {
					callbacks.error(e);
					resolve();
				}
			}
		});
		return () => {
			this.delete(message.id);
			callbacks.complete();
			resolve();
		};
	}
	/**
	* Deletes a request from both the outgoing and pending collections, if it exists.
	*/
	delete(messageId) {
		if (messageId === null) return;
		this.outgoingRequests = this.outgoingRequests.filter(({ id }) => id !== String(messageId));
		delete this.pendingRequests[String(messageId)];
	}
	/**
	* Moves all outgoing requests to the pending state and clears the outgoing queue.
	*
	* The caller is expected to handle the actual sending of the requests
	* (e.g., sending them over the network) after this method is called.
	*
	* @returns The list of requests that were transitioned to the pending state.
	*/
	flush() {
		const requests = this.outgoingRequests;
		this.outgoingRequests = [];
		for (const request of requests) this.pendingRequests[request.id] = request;
		return requests;
	}
	/**
	* Retrieves all currently pending requests, which are in flight awaiting responses
	* or handling ongoing subscriptions.
	*/
	getPendingRequests() {
		return Object.values(this.pendingRequests);
	}
	/**
	* Retrieves a specific pending request by its message ID.
	*/
	getPendingRequest(messageId) {
		if (messageId === null) return null;
		return this.pendingRequests[String(messageId)];
	}
	/**
	* Retrieves all outgoing requests, which are waiting to be sent.
	*/
	getOutgoingRequests() {
		return this.outgoingRequests;
	}
	/**
	* Retrieves all requests, both outgoing and pending, with their respective states.
	*
	* @returns An array of all requests with their state ("outgoing" or "pending").
	*/
	getRequests() {
		return [...this.getOutgoingRequests().map((request) => ({
			state: "outgoing",
			message: request.message,
			end: request.end,
			callbacks: request.callbacks
		})), ...this.getPendingRequests().map((request) => ({
			state: "pending",
			message: request.message,
			end: request.end,
			callbacks: request.callbacks
		}))];
	}
	/**
	* Checks if there are any pending requests, including ongoing subscriptions.
	*/
	hasPendingRequests() {
		return this.getPendingRequests().length > 0;
	}
	/**
	* Checks if there are any pending subscriptions
	*/
	hasPendingSubscriptions() {
		return this.getPendingRequests().some((request) => request.message.method === "subscription");
	}
	/**
	* Checks if there are any outgoing requests waiting to be sent.
	*/
	hasOutgoingRequests() {
		return this.outgoingRequests.length > 0;
	}
};
//#endregion
//#region src/links/wsLink/wsClient/wsConnection.ts
/**
* Opens a WebSocket connection asynchronously and returns a promise
* that resolves when the connection is successfully established.
* The promise rejects if an error occurs during the connection attempt.
*/
function asyncWsOpen(ws) {
	const { promise, resolve, reject } = withResolvers();
	ws.addEventListener("open", () => {
		ws.removeEventListener("error", reject);
		resolve();
	});
	ws.addEventListener("error", reject);
	return promise;
}
/**
* Sets up a periodic ping-pong mechanism to keep the WebSocket connection alive.
*
* - Sends "PING" messages at regular intervals defined by `intervalMs`.
* - If a "PONG" response is not received within the `pongTimeoutMs`, the WebSocket is closed.
* - The ping timer resets upon receiving any message to maintain activity.
* - Automatically starts the ping process when the WebSocket connection is opened.
* - Cleans up timers when the WebSocket is closed.
*
* @param ws - The WebSocket instance to manage.
* @param options - Configuration options for ping-pong intervals and timeouts.
*/
function setupPingInterval(ws, { intervalMs, pongTimeoutMs }) {
	let pingTimeout;
	let pongTimeout;
	function start() {
		pingTimeout = setTimeout(() => {
			ws.send("PING");
			pongTimeout = setTimeout(() => {
				ws.close();
			}, pongTimeoutMs);
		}, intervalMs);
	}
	function reset() {
		clearTimeout(pingTimeout);
		start();
	}
	function pong() {
		clearTimeout(pongTimeout);
		reset();
	}
	ws.addEventListener("open", start);
	ws.addEventListener("message", ({ data }) => {
		clearTimeout(pingTimeout);
		start();
		if (data === "PONG") pong();
	});
	ws.addEventListener("close", () => {
		clearTimeout(pingTimeout);
		clearTimeout(pongTimeout);
	});
}
/**
* Manages a WebSocket connection with support for reconnection, keep-alive mechanisms,
* and observable state tracking.
*/
var WsConnection = class WsConnection {
	constructor(opts) {
		var _opts$WebSocketPonyfi;
		_defineProperty(this, "id", ++WsConnection.connectCount);
		_defineProperty(this, "WebSocketPonyfill", void 0);
		_defineProperty(this, "urlOptions", void 0);
		_defineProperty(this, "keepAliveOpts", void 0);
		_defineProperty(this, "encoder", void 0);
		_defineProperty(this, "wsObservable", behaviorSubject(null));
		_defineProperty(this, "openPromise", null);
		this.WebSocketPonyfill = (_opts$WebSocketPonyfi = opts.WebSocketPonyfill) !== null && _opts$WebSocketPonyfi !== void 0 ? _opts$WebSocketPonyfi : WebSocket;
		if (!this.WebSocketPonyfill) throw new Error("No WebSocket implementation found - you probably don't want to use this on the server, but if you do you need to pass a `WebSocket`-ponyfill");
		this.urlOptions = opts.urlOptions;
		this.keepAliveOpts = opts.keepAlive;
		this.encoder = opts.encoder;
	}
	get ws() {
		return this.wsObservable.get();
	}
	set ws(ws) {
		this.wsObservable.next(ws);
	}
	/**
	* Checks if the WebSocket connection is open and ready to communicate.
	*/
	isOpen() {
		return !!this.ws && this.ws.readyState === this.WebSocketPonyfill.OPEN && !this.openPromise;
	}
	/**
	* Checks if the WebSocket connection is closed or in the process of closing.
	*/
	isClosed() {
		return !!this.ws && (this.ws.readyState === this.WebSocketPonyfill.CLOSING || this.ws.readyState === this.WebSocketPonyfill.CLOSED);
	}
	async open() {
		if (this.openPromise) return this.openPromise;
		this.id = ++WsConnection.connectCount;
		const wsPromise = prepareUrl(this.urlOptions).then((url) => new this.WebSocketPonyfill(url));
		this.openPromise = wsPromise.then(async (ws) => {
			this.ws = ws;
			ws.binaryType = "arraybuffer";
			ws.addEventListener("message", function({ data }) {
				if (data === "PING") this.send("PONG");
			});
			if (this.keepAliveOpts.enabled) setupPingInterval(ws, this.keepAliveOpts);
			ws.addEventListener("close", () => {
				if (this.ws === ws) this.ws = null;
			});
			await asyncWsOpen(ws);
			if (this.urlOptions.connectionParams) ws.send(await buildConnectionMessage(this.urlOptions.connectionParams, this.encoder));
		});
		try {
			await this.openPromise;
		} finally {
			this.openPromise = null;
		}
	}
	/**
	* Closes the WebSocket connection gracefully.
	* Waits for any ongoing open operation to complete before closing.
	*/
	async close() {
		try {
			await this.openPromise;
		} finally {
			var _this$ws;
			(_this$ws = this.ws) === null || _this$ws === void 0 || _this$ws.close();
		}
	}
};
_defineProperty(WsConnection, "connectCount", 0);
/**
* Provides a backward-compatible representation of the connection state.
*/
function backwardCompatibility(connection) {
	if (connection.isOpen()) return {
		id: connection.id,
		state: "open",
		ws: connection.ws
	};
	if (connection.isClosed()) return {
		id: connection.id,
		state: "closed",
		ws: connection.ws
	};
	if (!connection.ws) return null;
	return {
		id: connection.id,
		state: "connecting",
		ws: connection.ws
	};
}
//#endregion
//#region src/links/wsLink/wsClient/wsClient.ts
/**
* A WebSocket client for managing TRPC operations, supporting lazy initialization,
* reconnection, keep-alive, and request management.
*/
var WsClient = class {
	constructor(opts) {
		var _opts$experimental_en, _opts$retryDelayMs;
		_defineProperty(this, "connectionState", void 0);
		_defineProperty(this, "allowReconnect", false);
		_defineProperty(this, "requestManager", new RequestManager());
		_defineProperty(this, "activeConnection", void 0);
		_defineProperty(this, "reconnectRetryDelay", void 0);
		_defineProperty(this, "inactivityTimeout", void 0);
		_defineProperty(this, "callbacks", void 0);
		_defineProperty(this, "lazyMode", void 0);
		_defineProperty(this, "encoder", void 0);
		_defineProperty(this, "reconnecting", null);
		this.encoder = (_opts$experimental_en = opts.experimental_encoder) !== null && _opts$experimental_en !== void 0 ? _opts$experimental_en : jsonEncoder;
		this.callbacks = {
			onOpen: opts.onOpen,
			onClose: opts.onClose,
			onError: opts.onError
		};
		const lazyOptions = _objectSpread2(_objectSpread2({}, lazyDefaults), opts.lazy);
		this.inactivityTimeout = new ResettableTimeout(() => {
			if (this.requestManager.hasOutgoingRequests() || this.requestManager.hasPendingRequests()) {
				this.inactivityTimeout.reset();
				return;
			}
			this.close().catch(() => null);
		}, lazyOptions.closeMs);
		this.activeConnection = new WsConnection({
			WebSocketPonyfill: opts.WebSocket,
			urlOptions: opts,
			keepAlive: _objectSpread2(_objectSpread2({}, keepAliveDefaults), opts.keepAlive),
			encoder: this.encoder
		});
		this.activeConnection.wsObservable.subscribe({ next: (ws) => {
			if (!ws) return;
			this.setupWebSocketListeners(ws);
		} });
		this.reconnectRetryDelay = (_opts$retryDelayMs = opts.retryDelayMs) !== null && _opts$retryDelayMs !== void 0 ? _opts$retryDelayMs : exponentialBackoff;
		this.lazyMode = lazyOptions.enabled;
		this.connectionState = behaviorSubject({
			type: "state",
			state: lazyOptions.enabled ? "idle" : "connecting",
			error: null
		});
		if (!this.lazyMode) this.open().catch(() => null);
	}
	/**
	* Opens the WebSocket connection. Handles reconnection attempts and updates
	* the connection state accordingly.
	*/
	async open() {
		this.allowReconnect = true;
		if (this.connectionState.get().state === "idle") this.connectionState.next({
			type: "state",
			state: "connecting",
			error: null
		});
		try {
			await this.activeConnection.open();
		} catch (error) {
			this.reconnect(new TRPCWebSocketClosedError({
				message: "Initialization error",
				cause: error
			}));
			return this.reconnecting;
		}
	}
	/**
	* Closes the WebSocket connection and stops managing requests.
	* Ensures all outgoing and pending requests are properly finalized.
	*/
	async close() {
		this.allowReconnect = false;
		this.inactivityTimeout.stop();
		const requestsToAwait = [];
		for (const request of this.requestManager.getRequests()) if (request.message.method === "subscription") request.callbacks.complete();
		else if (request.state === "outgoing") request.callbacks.error(TRPCClientError.from(new TRPCWebSocketClosedError({ message: "Closed before connection was established" })));
		else requestsToAwait.push(request.end);
		await Promise.all(requestsToAwait).catch(() => null);
		await this.activeConnection.close().catch(() => null);
		this.connectionState.next({
			type: "state",
			state: "idle",
			error: null
		});
	}
	/**
	* Method to request the server.
	* Handles data transformation, batching of requests, and subscription lifecycle.
	*
	* @param op - The operation details including id, type, path, input and signal
	* @param transformer - Data transformer for serializing requests and deserializing responses
	* @param lastEventId - Optional ID of the last received event for subscriptions
	*
	* @returns An observable that emits operation results and handles cleanup
	*/
	request({ op: { id, type, path, input, signal }, transformer, lastEventId }) {
		return observable((observer) => {
			const abort = this.batchSend({
				id,
				method: type,
				params: {
					input: transformer.input.serialize(input),
					path,
					lastEventId
				}
			}, _objectSpread2(_objectSpread2({}, observer), {}, { next(event) {
				const transformed = transformResult(event, transformer.output);
				if (!transformed.ok) {
					observer.error(TRPCClientError.from(transformed.error));
					return;
				}
				observer.next({ result: transformed.result });
			} }));
			const onAbort = () => observer.complete();
			if (signal === null || signal === void 0 ? void 0 : signal.aborted) onAbort();
			else signal === null || signal === void 0 || signal.addEventListener("abort", onAbort, { once: true });
			return () => {
				abort();
				if (type === "subscription" && this.activeConnection.isOpen()) this.send({
					id,
					method: "subscription.stop"
				});
				signal === null || signal === void 0 || signal.removeEventListener("abort", onAbort);
			};
		});
	}
	get connection() {
		return backwardCompatibility(this.activeConnection);
	}
	reconnect(closedError) {
		this.connectionState.next({
			type: "state",
			state: "connecting",
			error: TRPCClientError.from(closedError)
		});
		if (this.reconnecting) return;
		const tryReconnect = async (attemptIndex) => {
			try {
				await sleep(this.reconnectRetryDelay(attemptIndex));
				if (this.allowReconnect) {
					await this.activeConnection.close();
					await this.activeConnection.open();
					if (this.requestManager.hasPendingRequests()) this.send(this.requestManager.getPendingRequests().map(({ message }) => message));
				}
				this.reconnecting = null;
			} catch (_unused) {
				await tryReconnect(attemptIndex + 1);
			}
		};
		this.reconnecting = tryReconnect(0);
	}
	setupWebSocketListeners(ws) {
		const handleCloseOrError = (cause) => {
			const reqs = this.requestManager.getPendingRequests();
			for (const { message, callbacks } of reqs) {
				if (message.method === "subscription") continue;
				callbacks.error(TRPCClientError.from(cause !== null && cause !== void 0 ? cause : new TRPCWebSocketClosedError({
					message: "WebSocket closed",
					cause
				})));
				this.requestManager.delete(message.id);
			}
		};
		ws.addEventListener("open", () => {
			run(async () => {
				var _this$callbacks$onOpe, _this$callbacks;
				if (this.lazyMode) this.inactivityTimeout.start();
				(_this$callbacks$onOpe = (_this$callbacks = this.callbacks).onOpen) === null || _this$callbacks$onOpe === void 0 || _this$callbacks$onOpe.call(_this$callbacks);
				this.connectionState.next({
					type: "state",
					state: "pending",
					error: null
				});
			}).catch((error) => {
				ws.close(3e3);
				handleCloseOrError(error);
			});
		});
		ws.addEventListener("message", ({ data }) => {
			this.inactivityTimeout.reset();
			if (["PING", "PONG"].includes(data)) return;
			const incomingMessage = this.encoder.decode(data);
			if ("method" in incomingMessage) {
				this.handleIncomingRequest(incomingMessage);
				return;
			}
			this.handleResponseMessage(incomingMessage);
		});
		ws.addEventListener("close", (event) => {
			var _this$callbacks$onClo, _this$callbacks2;
			handleCloseOrError(event);
			(_this$callbacks$onClo = (_this$callbacks2 = this.callbacks).onClose) === null || _this$callbacks$onClo === void 0 || _this$callbacks$onClo.call(_this$callbacks2, event);
			if (!this.lazyMode || this.requestManager.hasPendingSubscriptions()) this.reconnect(new TRPCWebSocketClosedError({
				message: "WebSocket closed",
				cause: event
			}));
		});
		ws.addEventListener("error", (event) => {
			var _this$callbacks$onErr, _this$callbacks3;
			handleCloseOrError(event);
			(_this$callbacks$onErr = (_this$callbacks3 = this.callbacks).onError) === null || _this$callbacks$onErr === void 0 || _this$callbacks$onErr.call(_this$callbacks3, event);
			this.reconnect(new TRPCWebSocketClosedError({
				message: "WebSocket closed",
				cause: event
			}));
		});
	}
	handleResponseMessage(message) {
		const request = this.requestManager.getPendingRequest(message.id);
		if (!request) return;
		request.callbacks.next(message);
		let completed = true;
		if ("result" in message && request.message.method === "subscription") {
			if (message.result.type === "data") request.message.params.lastEventId = message.result.id;
			if (message.result.type !== "stopped") completed = false;
		}
		if (completed) {
			request.callbacks.complete();
			this.requestManager.delete(message.id);
		}
	}
	handleIncomingRequest(message) {
		if (message.method === "reconnect") this.reconnect(new TRPCWebSocketClosedError({ message: "Server requested reconnect" }));
	}
	/**
	* Sends a message or batch of messages directly to the server.
	*/
	send(messageOrMessages) {
		if (!this.activeConnection.isOpen()) throw new Error("Active connection is not open");
		const messages = messageOrMessages instanceof Array ? messageOrMessages : [messageOrMessages];
		this.activeConnection.ws.send(this.encoder.encode(messages.length === 1 ? messages[0] : messages));
	}
	/**
	* Groups requests for batch sending.
	*
	* @returns A function to abort the batched request.
	*/
	batchSend(message, callbacks) {
		this.inactivityTimeout.reset();
		run(async () => {
			if (!this.activeConnection.isOpen()) await this.open();
			await sleep(0);
			if (!this.requestManager.hasOutgoingRequests()) return;
			this.send(this.requestManager.flush().map(({ message }) => message));
		}).catch((err) => {
			this.requestManager.delete(message.id);
			callbacks.error(TRPCClientError.from(err));
		});
		return this.requestManager.register(message, callbacks);
	}
};
//#endregion
//#region src/links/wsLink/createWsClient.ts
function createWSClient(opts) {
	return new WsClient(opts);
}
//#endregion
//#region src/links/wsLink/wsLink.ts
function wsLink(opts) {
	const { client } = opts;
	const transformer = getTransformer(opts.transformer);
	return () => {
		return ({ op }) => {
			return observable((observer) => {
				const connStateSubscription = op.type === "subscription" ? client.connectionState.subscribe({ next(result) {
					observer.next({
						result,
						context: op.context
					});
				} }) : null;
				const requestSubscription = client.request({
					op,
					transformer
				}).subscribe(observer);
				return () => {
					requestSubscription.unsubscribe();
					connStateSubscription === null || connStateSubscription === void 0 || connStateSubscription.unsubscribe();
				};
			});
		};
	};
}
//#endregion
export { jsonEncoder as i, createWSClient as n, resultOf as r, wsLink as t };

//# sourceMappingURL=wsLink-Bm5LKL6z.mjs.map