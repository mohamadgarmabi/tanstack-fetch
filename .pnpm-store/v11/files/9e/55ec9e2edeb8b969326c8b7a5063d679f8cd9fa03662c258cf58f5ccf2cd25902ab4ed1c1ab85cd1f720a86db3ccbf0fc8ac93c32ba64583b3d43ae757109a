import { n as createChain, t as splitLink } from "./splitLink-BZPioDdG.mjs";
import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.mjs";
import { n as isTRPCClientError, t as TRPCClientError } from "./TRPCClientError-CxFRO7Js.mjs";
import { c as allAbortSignals, l as raceAbortSignals, n as getBody, o as resolveHTTPLinkOptions, r as getUrl, s as abortSignalToPromise, t as fetchHTTPResponse, u as getFetch } from "./httpUtils-CB_100ND.mjs";
import { i as isOctetType, n as isFormData, r as isNonJsonSerializable, t as httpLink } from "./httpLink-Tm93WWFA.mjs";
import { n as dataLoader, t as httpBatchLink } from "./httpBatchLink-BMtWxLJV.mjs";
import { getTransformer } from "./unstable-internals.mjs";
import { loggerLink } from "./links/loggerLink.mjs";
import { i as jsonEncoder, n as createWSClient, r as resultOf, t as wsLink } from "./wsLink-Bm5LKL6z.mjs";
import { behaviorSubject, observable, observableToPromise, share } from "@trpc/server/observable";
import { callProcedure, createFlatProxy, createRecursiveProxy, isAbortError, isAsyncIterable, iteratorResource, jsonlStreamConsumer, makeResource, retryableRpcCodes, run, sseStreamConsumer } from "@trpc/server/unstable-core-do-not-import";
import { getTRPCErrorFromUnknown, getTRPCErrorShape, isTrackedEnvelope } from "@trpc/server";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";
//#region src/internals/TRPCUntypedClient.ts
var TRPCUntypedClient = class {
	constructor(opts) {
		_defineProperty(this, "links", void 0);
		_defineProperty(this, "runtime", void 0);
		_defineProperty(this, "requestId", void 0);
		this.requestId = 0;
		this.runtime = {};
		this.links = opts.links.map((link) => link(this.runtime));
	}
	$request(opts) {
		var _opts$context;
		return createChain({
			links: this.links,
			op: _objectSpread2(_objectSpread2({}, opts), {}, {
				context: (_opts$context = opts.context) !== null && _opts$context !== void 0 ? _opts$context : {},
				id: ++this.requestId
			})
		}).pipe(share());
	}
	async requestAsPromise(opts) {
		try {
			const req$ = this.$request(opts);
			return (await observableToPromise(req$)).result.data;
		} catch (err) {
			throw TRPCClientError.from(err);
		}
	}
	query(path, input, opts) {
		return this.requestAsPromise({
			type: "query",
			path,
			input,
			context: opts === null || opts === void 0 ? void 0 : opts.context,
			signal: opts === null || opts === void 0 ? void 0 : opts.signal
		});
	}
	mutation(path, input, opts) {
		return this.requestAsPromise({
			type: "mutation",
			path,
			input,
			context: opts === null || opts === void 0 ? void 0 : opts.context,
			signal: opts === null || opts === void 0 ? void 0 : opts.signal
		});
	}
	subscription(path, input, opts) {
		return this.$request({
			type: "subscription",
			path,
			input,
			context: opts.context,
			signal: opts.signal
		}).subscribe({
			next(envelope) {
				switch (envelope.result.type) {
					case "state":
						var _opts$onConnectionSta;
						(_opts$onConnectionSta = opts.onConnectionStateChange) === null || _opts$onConnectionSta === void 0 || _opts$onConnectionSta.call(opts, envelope.result);
						break;
					case "started":
						var _opts$onStarted;
						(_opts$onStarted = opts.onStarted) === null || _opts$onStarted === void 0 || _opts$onStarted.call(opts, { context: envelope.context });
						break;
					case "stopped":
						var _opts$onStopped;
						(_opts$onStopped = opts.onStopped) === null || _opts$onStopped === void 0 || _opts$onStopped.call(opts);
						break;
					case "data":
					case void 0:
						var _opts$onData;
						(_opts$onData = opts.onData) === null || _opts$onData === void 0 || _opts$onData.call(opts, envelope.result.data);
				}
			},
			error(err) {
				var _opts$onError;
				(_opts$onError = opts.onError) === null || _opts$onError === void 0 || _opts$onError.call(opts, err);
			},
			complete() {
				var _opts$onComplete;
				(_opts$onComplete = opts.onComplete) === null || _opts$onComplete === void 0 || _opts$onComplete.call(opts);
			}
		});
	}
};
//#endregion
//#region src/createTRPCUntypedClient.ts
function createTRPCUntypedClient(opts) {
	return new TRPCUntypedClient(opts);
}
//#endregion
//#region src/createTRPCClient.ts
const untypedClientSymbol = Symbol.for("trpc_untypedClient");
const clientCallTypeMap = {
	query: "query",
	mutate: "mutation",
	subscribe: "subscription"
};
/** @internal */
const clientCallTypeToProcedureType = (clientCallType) => {
	return clientCallTypeMap[clientCallType];
};
/**
* @internal
*/
function createTRPCClientProxy(client) {
	const proxy = createRecursiveProxy(({ path, args }) => {
		const pathCopy = [...path];
		const procedureType = clientCallTypeToProcedureType(pathCopy.pop());
		const fullPath = pathCopy.join(".");
		return client[procedureType](fullPath, ...args);
	});
	return createFlatProxy((key) => {
		if (key === untypedClientSymbol) return client;
		return proxy[key];
	});
}
function createTRPCClient(opts) {
	return createTRPCClientProxy(new TRPCUntypedClient(opts));
}
/**
* Get an untyped client from a proxy client
* @internal
*/
function getUntypedClient(client) {
	return client[untypedClientSymbol];
}
//#endregion
//#region src/links/httpBatchStreamLink.ts
/**
* @see https://trpc.io/docs/client/links/httpBatchStreamLink
*/
function httpBatchStreamLink(opts) {
	var _opts$maxURLLength, _opts$maxItems;
	const resolvedOpts = resolveHTTPLinkOptions(opts);
	const maxURLLength = (_opts$maxURLLength = opts.maxURLLength) !== null && _opts$maxURLLength !== void 0 ? _opts$maxURLLength : Infinity;
	const maxItems = (_opts$maxItems = opts.maxItems) !== null && _opts$maxItems !== void 0 ? _opts$maxItems : Infinity;
	return () => {
		const batchLoader = (type) => {
			return {
				validate(batchOps) {
					if (maxURLLength === Infinity && maxItems === Infinity) return true;
					if (batchOps.length > maxItems) return false;
					const path = batchOps.map((op) => op.path).join(",");
					const inputs = batchOps.map((op) => op.input);
					return getUrl(_objectSpread2(_objectSpread2({}, resolvedOpts), {}, {
						type,
						path,
						inputs,
						signal: null
					})).length <= maxURLLength;
				},
				async fetch(batchOps) {
					var _opts$streamHeader;
					const path = batchOps.map((op) => op.path).join(",");
					const inputs = batchOps.map((op) => op.input);
					const batchSignals = allAbortSignals(...batchOps.map((op) => op.signal));
					const abortController = new AbortController();
					const res = await fetchHTTPResponse(_objectSpread2(_objectSpread2({}, resolvedOpts), {}, {
						signal: raceAbortSignals(batchSignals, abortController.signal),
						type,
						contentTypeHeader: "application/json",
						trpcAcceptHeader: "application/jsonl",
						trpcAcceptHeaderKey: (_opts$streamHeader = opts.streamHeader) !== null && _opts$streamHeader !== void 0 ? _opts$streamHeader : "trpc-accept",
						getUrl,
						getBody,
						inputs,
						path,
						headers() {
							if (!opts.headers) return {};
							if (typeof opts.headers === "function") return opts.headers({ opList: batchOps });
							return opts.headers;
						}
					}));
					if (!res.ok) {
						const json = await res.json();
						if ("error" in json) json.error = resolvedOpts.transformer.output.deserialize(json.error);
						return batchOps.map(() => Promise.resolve({
							json,
							meta: { response: res }
						}));
					}
					const [head] = await jsonlStreamConsumer({
						from: res.body,
						deserialize: (data) => resolvedOpts.transformer.output.deserialize(data),
						formatError(opts) {
							const error = opts.error;
							return TRPCClientError.from({ error });
						},
						abortController
					});
					return Object.keys(batchOps).map(async (key) => {
						let json = await Promise.resolve(head[key]);
						if ("result" in json) {
							/**
							* Not very pretty, but we need to unwrap nested data as promises
							* Our stream producer will only resolve top-level async values or async values that are directly nested in another async value
							*/
							const result = await Promise.resolve(json.result);
							json = { result: { data: await Promise.resolve(result.data) } };
						}
						return {
							json,
							meta: { response: res }
						};
					});
				}
			};
		};
		const loaders = {
			query: dataLoader(batchLoader("query")),
			mutation: dataLoader(batchLoader("mutation"))
		};
		return ({ op }) => {
			return observable((observer) => {
				/* istanbul ignore if -- @preserve */
				if (op.type === "subscription") throw new Error("Subscriptions are unsupported by `httpBatchStreamLink` - use `httpSubscriptionLink` or `wsLink`");
				const ac = new AbortController();
				const promise = loaders[op.type].load(_objectSpread2(_objectSpread2({}, op), {}, { signal: raceAbortSignals(op.signal, ac.signal) }));
				let isDone = false;
				let _res = void 0;
				promise.then((res) => {
					isDone = true;
					_res = res;
					if ("error" in res.json) {
						observer.error(TRPCClientError.from(res.json, { meta: res.meta }));
						return;
					} else if ("result" in res.json) {
						observer.next({
							context: res.meta,
							result: res.json.result
						});
						observer.complete();
						return;
					}
					observer.complete();
				}).catch((err) => {
					isDone = true;
					observer.error(TRPCClientError.from(err, { meta: _res === null || _res === void 0 ? void 0 : _res.meta }));
				});
				return () => {
					if (!isDone) ac.abort();
				};
			});
		};
	};
}
/**
* @deprecated use {@link httpBatchStreamLink} instead
*/
const unstable_httpBatchStreamLink = httpBatchStreamLink;
//#endregion
//#region src/internals/inputWithTrackedEventId.ts
function inputWithTrackedEventId(input, lastEventId) {
	if (!lastEventId) return input;
	if (input != null && typeof input !== "object") return input;
	return _objectSpread2(_objectSpread2({}, input !== null && input !== void 0 ? input : {}), {}, { lastEventId });
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/asyncIterator.js
function _asyncIterator(r) {
	var n, t, o, e = 2;
	for ("undefined" != typeof Symbol && (t = Symbol.asyncIterator, o = Symbol.iterator); e--;) {
		if (t && null != (n = r[t])) return n.call(r);
		if (o && null != (n = r[o])) return new AsyncFromSyncIterator(n.call(r));
		t = "@@asyncIterator", o = "@@iterator";
	}
	throw new TypeError("Object is not async iterable");
}
function AsyncFromSyncIterator(r) {
	function AsyncFromSyncIteratorContinuation(r) {
		if (Object(r) !== r) return Promise.reject(/* @__PURE__ */ new TypeError(r + " is not an object."));
		var n = r.done;
		return Promise.resolve(r.value).then(function(r) {
			return {
				value: r,
				done: n
			};
		});
	}
	return AsyncFromSyncIterator = function AsyncFromSyncIterator(r) {
		this.s = r, this.n = r.next;
	}, AsyncFromSyncIterator.prototype = {
		s: null,
		n: null,
		next: function next() {
			return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments));
		},
		"return": function _return(r) {
			var n = this.s["return"];
			return void 0 === n ? Promise.resolve({
				value: r,
				done: !0
			}) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments));
		},
		"throw": function _throw(r) {
			var n = this.s["return"];
			return void 0 === n ? Promise.reject(r) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments));
		}
	}, new AsyncFromSyncIterator(r);
}
//#endregion
//#region src/links/httpSubscriptionLink.ts
async function urlWithConnectionParams(opts) {
	let url = await resultOf(opts.url);
	if (opts.connectionParams) {
		const params = await resultOf(opts.connectionParams);
		const prefix = url.includes("?") ? "&" : "?";
		url += prefix + "connectionParams=" + encodeURIComponent(JSON.stringify(params));
	}
	return url;
}
/**
* @see https://trpc.io/docs/client/links/httpSubscriptionLink
*/
function httpSubscriptionLink(opts) {
	const transformer = getTransformer(opts.transformer);
	return () => {
		return ({ op }) => {
			return observable((observer) => {
				var _opts$EventSource;
				const { type, path, input } = op;
				/* istanbul ignore if -- @preserve */
				if (type !== "subscription") throw new Error("httpSubscriptionLink only supports subscriptions");
				let lastEventId = void 0;
				const ac = new AbortController();
				const signal = raceAbortSignals(op.signal, ac.signal);
				const eventSourceStream = sseStreamConsumer({
					url: async () => getUrl({
						transformer,
						url: await urlWithConnectionParams(opts),
						input: inputWithTrackedEventId(input, lastEventId),
						path,
						type,
						signal: null
					}),
					init: () => resultOf(opts.eventSourceOptions, { op }),
					signal,
					deserialize: (data) => transformer.output.deserialize(data),
					EventSource: (_opts$EventSource = opts.EventSource) !== null && _opts$EventSource !== void 0 ? _opts$EventSource : globalThis.EventSource
				});
				const connectionState = behaviorSubject({
					type: "state",
					state: "connecting",
					error: null
				});
				const connectionSub = connectionState.subscribe({ next(state) {
					observer.next({ result: state });
				} });
				run(async () => {
					var _iteratorAbruptCompletion = false;
					var _didIteratorError = false;
					var _iteratorError;
					try {
						for (var _iterator = _asyncIterator(eventSourceStream), _step; _iteratorAbruptCompletion = !(_step = await _iterator.next()).done; _iteratorAbruptCompletion = false) {
							const chunk = _step.value;
							switch (chunk.type) {
								case "ping": break;
								case "data":
									const chunkData = chunk.data;
									let result;
									if (chunkData.id) {
										lastEventId = chunkData.id;
										result = {
											id: chunkData.id,
											data: chunkData
										};
									} else result = { data: chunkData.data };
									observer.next({
										result,
										context: { eventSource: chunk.eventSource }
									});
									break;
								case "connected":
									observer.next({
										result: { type: "started" },
										context: { eventSource: chunk.eventSource }
									});
									connectionState.next({
										type: "state",
										state: "pending",
										error: null
									});
									break;
								case "serialized-error": {
									const error = TRPCClientError.from({ error: chunk.error });
									if (retryableRpcCodes.includes(chunk.error.code)) {
										connectionState.next({
											type: "state",
											state: "connecting",
											error
										});
										break;
									}
									throw error;
								}
								case "connecting": {
									const lastState = connectionState.get();
									const error = chunk.event && TRPCClientError.from(chunk.event);
									if (!error && lastState.state === "connecting") break;
									connectionState.next({
										type: "state",
										state: "connecting",
										error
									});
									break;
								}
								case "timeout": connectionState.next({
									type: "state",
									state: "connecting",
									error: new TRPCClientError(`Timeout of ${chunk.ms}ms reached while waiting for a response`)
								});
							}
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (_iteratorAbruptCompletion && _iterator.return != null) await _iterator.return();
						} finally {
							if (_didIteratorError) throw _iteratorError;
						}
					}
					observer.next({ result: { type: "stopped" } });
					connectionState.next({
						type: "state",
						state: "idle",
						error: null
					});
					observer.complete();
				}).catch((error) => {
					observer.error(TRPCClientError.from(error));
				});
				return () => {
					observer.complete();
					ac.abort();
					connectionSub.unsubscribe();
				};
			});
		};
	};
}
/**
* @deprecated use {@link httpSubscriptionLink} instead
*/
const unstable_httpSubscriptionLink = httpSubscriptionLink;
//#endregion
//#region src/links/retryLink.ts
/* istanbul ignore file -- @preserve */
/**
* @see https://trpc.io/docs/v11/client/links/retryLink
*/
function retryLink(opts) {
	return () => {
		return (callOpts) => {
			return observable((observer) => {
				let next$;
				let callNextTimeout = void 0;
				let lastEventId = void 0;
				attempt(1);
				function opWithLastEventId() {
					const op = callOpts.op;
					if (!lastEventId) return op;
					return _objectSpread2(_objectSpread2({}, op), {}, { input: inputWithTrackedEventId(op.input, lastEventId) });
				}
				function attempt(attempts) {
					const op = opWithLastEventId();
					next$ = callOpts.next(op).subscribe({
						error(error) {
							var _opts$retryDelayMs, _opts$retryDelayMs2;
							if (!opts.retry({
								op,
								attempts,
								error
							})) {
								observer.error(error);
								return;
							}
							const delayMs = (_opts$retryDelayMs = (_opts$retryDelayMs2 = opts.retryDelayMs) === null || _opts$retryDelayMs2 === void 0 ? void 0 : _opts$retryDelayMs2.call(opts, attempts)) !== null && _opts$retryDelayMs !== void 0 ? _opts$retryDelayMs : 0;
							if (delayMs <= 0) {
								attempt(attempts + 1);
								return;
							}
							callNextTimeout = setTimeout(() => attempt(attempts + 1), delayMs);
						},
						next(envelope) {
							if ((!envelope.result.type || envelope.result.type === "data") && envelope.result.id) lastEventId = envelope.result.id;
							observer.next(envelope);
						},
						complete() {
							observer.complete();
						}
					});
				}
				return () => {
					next$.unsubscribe();
					clearTimeout(callNextTimeout);
				};
			});
		};
	};
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/usingCtx.js
function _usingCtx() {
	var r = "function" == typeof SuppressedError ? SuppressedError : function(r, e) {
		var n = Error();
		return n.name = "SuppressedError", n.error = r, n.suppressed = e, n;
	}, e = {}, n = [];
	function using(r, e) {
		if (null != e) {
			if (Object(e) !== e) throw new TypeError("using declarations can only be used with objects, functions, null, or undefined.");
			if (r) var o = e[Symbol.asyncDispose || Symbol["for"]("Symbol.asyncDispose")];
			if (void 0 === o && (o = e[Symbol.dispose || Symbol["for"]("Symbol.dispose")], r)) var t = o;
			if ("function" != typeof o) throw new TypeError("Object is not disposable.");
			t && (o = function o() {
				try {
					t.call(e);
				} catch (r) {
					return Promise.reject(r);
				}
			}), n.push({
				v: e,
				d: o,
				a: r
			});
		} else r && n.push({
			d: e,
			a: r
		});
		return e;
	}
	return {
		e,
		u: using.bind(null, !1),
		a: using.bind(null, !0),
		d: function d() {
			var o, t = this.e, s = 0;
			function next() {
				for (; o = n.pop();) try {
					if (!o.a && 1 === s) return s = 0, n.push(o), Promise.resolve().then(next);
					if (o.d) {
						var r = o.d.call(o.v);
						if (o.a) return s |= 2, Promise.resolve(r).then(next, err);
					} else s |= 1;
				} catch (r) {
					return err(r);
				}
				if (1 === s) return t !== e ? Promise.reject(t) : Promise.resolve();
				if (t !== e) throw t;
			}
			function err(n) {
				return t = t !== e ? new r(n, t) : n, next();
			}
			return next();
		}
	};
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/OverloadYield.js
function _OverloadYield(e, d) {
	this.v = e, this.k = d;
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/awaitAsyncGenerator.js
function _awaitAsyncGenerator(e) {
	return new _OverloadYield(e, 0);
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/wrapAsyncGenerator.js
function _wrapAsyncGenerator(e) {
	return function() {
		return new AsyncGenerator(e.apply(this, arguments));
	};
}
function AsyncGenerator(e) {
	var r, t;
	function resume(r, t) {
		try {
			var n = e[r](t), o = n.value, u = o instanceof _OverloadYield;
			Promise.resolve(u ? o.v : o).then(function(t) {
				if (u) {
					var i = "return" === r ? "return" : "next";
					if (!o.k || t.done) return resume(i, t);
					t = e[i](t).value;
				}
				settle(n.done ? "return" : "normal", t);
			}, function(e) {
				resume("throw", e);
			});
		} catch (e) {
			settle("throw", e);
		}
	}
	function settle(e, n) {
		switch (e) {
			case "return":
				r.resolve({
					value: n,
					done: !0
				});
				break;
			case "throw":
				r.reject(n);
				break;
			default: r.resolve({
				value: n,
				done: !1
			});
		}
		(r = r.next) ? resume(r.key, r.arg) : t = null;
	}
	this._invoke = function(e, n) {
		return new Promise(function(o, u) {
			var i = {
				key: e,
				arg: n,
				resolve: o,
				reject: u,
				next: null
			};
			t ? t = t.next = i : (r = t = i, resume(e, n));
		});
	}, "function" != typeof e["return"] && (this["return"] = void 0);
}
AsyncGenerator.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function() {
	return this;
}, AsyncGenerator.prototype.next = function(e) {
	return this._invoke("next", e);
}, AsyncGenerator.prototype["throw"] = function(e) {
	return this._invoke("throw", e);
}, AsyncGenerator.prototype["return"] = function(e) {
	return this._invoke("return", e);
};
//#endregion
//#region src/links/localLink.ts
/**
* localLink is a terminating link that allows you to make tRPC procedure calls directly in your application without going through HTTP.
*
* @see https://trpc.io/docs/links/localLink
*/
function unstable_localLink(opts) {
	const transformer = getTransformer(opts.transformer);
	const transformChunk = (chunk) => {
		if (opts.transformer) return chunk;
		if (chunk === void 0) return chunk;
		const serialized = JSON.stringify(transformer.input.serialize(chunk));
		return JSON.parse(transformer.output.deserialize(serialized));
	};
	return () => ({ op }) => observable((observer) => {
		let ctx = void 0;
		const ac = new AbortController();
		const signal = raceAbortSignals(op.signal, ac.signal);
		const signalPromise = abortSignalToPromise(signal);
		signalPromise.catch(() => {});
		let input = op.input;
		async function runProcedure(newInput) {
			input = newInput;
			ctx = await opts.createContext();
			return callProcedure({
				router: opts.router,
				path: op.path,
				getRawInput: async () => newInput,
				ctx,
				type: op.type,
				signal,
				batchIndex: 0
			});
		}
		function onErrorCallback(cause) {
			var _opts$onError;
			if (isAbortError(cause)) return;
			(_opts$onError = opts.onError) === null || _opts$onError === void 0 || _opts$onError.call(opts, {
				error: getTRPCErrorFromUnknown(cause),
				type: op.type,
				path: op.path,
				input,
				ctx
			});
		}
		function coerceToTRPCClientError(cause) {
			if (isTRPCClientError(cause)) return cause;
			const error = getTRPCErrorFromUnknown(cause);
			const shape = getTRPCErrorShape({
				config: opts.router._def._config,
				ctx,
				error,
				input,
				path: op.path,
				type: op.type
			});
			return TRPCClientError.from({ error: transformChunk(shape) }, { cause: cause instanceof Error ? cause : void 0 });
		}
		run(async () => {
			switch (op.type) {
				case "query":
				case "mutation": {
					const result = await runProcedure(op.input);
					if (!isAsyncIterable(result)) {
						observer.next({ result: { data: transformChunk(result) } });
						observer.complete();
						break;
					}
					observer.next({ result: { data: _wrapAsyncGenerator(function* () {
						try {
							var _usingCtx$1 = _usingCtx();
							const iterator = _usingCtx$1.a(iteratorResource(result));
							_usingCtx$1.u(makeResource({}, () => {
								observer.complete();
							}));
							try {
								while (true) {
									const res = yield _awaitAsyncGenerator(Promise.race([iterator.next(), signalPromise]));
									if (res.done) return transformChunk(res.value);
									yield transformChunk(res.value);
								}
							} catch (cause) {
								onErrorCallback(cause);
								throw coerceToTRPCClientError(cause);
							}
						} catch (_) {
							_usingCtx$1.e = _;
						} finally {
							yield _awaitAsyncGenerator(_usingCtx$1.d());
						}
					})() } });
					break;
				}
				case "subscription": try {
					var _usingCtx3 = _usingCtx();
					const connectionState = behaviorSubject({
						type: "state",
						state: "connecting",
						error: null
					});
					const connectionSub = connectionState.subscribe({ next(state) {
						observer.next({ result: state });
					} });
					let lastEventId = void 0;
					_usingCtx3.u(makeResource({}, async () => {
						observer.complete();
						connectionState.next({
							type: "state",
							state: "idle",
							error: null
						});
						connectionSub.unsubscribe();
					}));
					while (true) try {
						var _usingCtx4 = _usingCtx();
						const result = await runProcedure(inputWithTrackedEventId(op.input, lastEventId));
						if (!isAsyncIterable(result)) throw new Error("Expected an async iterable");
						const iterator = _usingCtx4.a(iteratorResource(result));
						observer.next({ result: { type: "started" } });
						connectionState.next({
							type: "state",
							state: "pending",
							error: null
						});
						while (true) {
							let res;
							try {
								res = await Promise.race([iterator.next(), signalPromise]);
							} catch (cause) {
								if (isAbortError(cause)) return;
								const error = getTRPCErrorFromUnknown(cause);
								if (!retryableRpcCodes.includes(TRPC_ERROR_CODES_BY_KEY[error.code])) throw coerceToTRPCClientError(error);
								onErrorCallback(error);
								connectionState.next({
									type: "state",
									state: "connecting",
									error: coerceToTRPCClientError(error)
								});
								break;
							}
							if (res.done) return;
							let chunk;
							if (isTrackedEnvelope(res.value)) {
								lastEventId = res.value[0];
								chunk = {
									id: res.value[0],
									data: {
										id: res.value[0],
										data: res.value[1]
									}
								};
							} else chunk = { data: res.value };
							observer.next({ result: _objectSpread2(_objectSpread2({}, chunk), {}, { data: transformChunk(chunk.data) }) });
						}
					} catch (_) {
						_usingCtx4.e = _;
					} finally {
						await _usingCtx4.d();
					}
					break;
				} catch (_) {
					_usingCtx3.e = _;
				} finally {
					_usingCtx3.d();
				}
			}
		}).catch((cause) => {
			onErrorCallback(cause);
			observer.error(coerceToTRPCClientError(cause));
		});
		return () => {
			ac.abort();
		};
	});
}
/**
* @deprecated Renamed to `unstable_localLink`. This alias will be removed in a future major release.
*/
const experimental_localLink = unstable_localLink;
//#endregion
export { TRPCClientError, TRPCUntypedClient, clientCallTypeToProcedureType, createTRPCClient, createTRPCClient as createTRPCProxyClient, createTRPCClientProxy, createTRPCUntypedClient, createWSClient, experimental_localLink, getFetch, getUntypedClient, httpBatchLink, httpBatchStreamLink, httpLink, httpSubscriptionLink, isFormData, isNonJsonSerializable, isOctetType, isTRPCClientError, jsonEncoder, loggerLink, retryLink, splitLink, unstable_httpBatchStreamLink, unstable_httpSubscriptionLink, unstable_localLink, wsLink };

//# sourceMappingURL=index.mjs.map