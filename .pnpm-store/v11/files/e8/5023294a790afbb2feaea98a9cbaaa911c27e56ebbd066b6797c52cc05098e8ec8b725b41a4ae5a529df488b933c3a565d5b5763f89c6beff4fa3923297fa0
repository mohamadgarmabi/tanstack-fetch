import { d as mergeWithoutOverrides, l as isFunction, o as emptyObject, u as isObject } from "./codes-D5Ya6_Bi.mjs";
import { d as createRecursiveProxy, n as _objectSpread2, r as _defineProperty } from "./getErrorShape-B0JBUs-i.mjs";
//#region src/unstable-core-do-not-import/error/formatter.ts
const defaultFormatter = ({ shape }) => {
	return shape;
};
//#endregion
//#region src/unstable-core-do-not-import/error/TRPCError.ts
var UnknownCauseError = class extends Error {
	constructor(cause) {
		super(getMessage(cause));
		Object.assign(this, cause);
	}
};
function getMessage(cause) {
	if ("message" in cause) return String(cause.message);
}
function getCauseFromUnknown(cause) {
	if (cause instanceof Error) return cause;
	const type = typeof cause;
	if (type === "undefined" || type === "function" || cause === null) return;
	if (type !== "object") return new Error(String(cause));
	if (isObject(cause)) return new UnknownCauseError(cause);
}
function getTRPCErrorFromUnknown(cause) {
	if (cause instanceof TRPCError) return cause;
	if (cause instanceof Error && cause.name === "TRPCError") return cause;
	const trpcError = new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		cause
	});
	if (cause instanceof Error && cause.stack) trpcError.stack = cause.stack;
	return trpcError;
}
var TRPCError = class extends Error {
	constructor(opts) {
		var _ref, _opts$message, _this$cause;
		const cause = getCauseFromUnknown(opts.cause);
		const message = (_ref = (_opts$message = opts.message) !== null && _opts$message !== void 0 ? _opts$message : cause === null || cause === void 0 ? void 0 : cause.message) !== null && _ref !== void 0 ? _ref : opts.code;
		super(message, { cause });
		_defineProperty(this, "cause", void 0);
		_defineProperty(this, "code", void 0);
		this.code = opts.code;
		this.name = "TRPCError";
		(_this$cause = this.cause) !== null && _this$cause !== void 0 || (this.cause = cause);
	}
};
//#endregion
//#region src/unstable-core-do-not-import/transformer.ts
/**
* @internal
*/
function getDataTransformer(transformer) {
	if ("input" in transformer) return transformer;
	return {
		input: transformer,
		output: transformer
	};
}
/**
* @internal
*/
const defaultTransformer = {
	input: {
		serialize: (obj) => obj,
		deserialize: (obj) => obj
	},
	output: {
		serialize: (obj) => obj,
		deserialize: (obj) => obj
	}
};
function transformTRPCResponseItem(config, item) {
	if ("error" in item) return _objectSpread2(_objectSpread2({}, item), {}, { error: config.transformer.output.serialize(item.error) });
	if ("data" in item.result) return _objectSpread2(_objectSpread2({}, item), {}, { result: _objectSpread2(_objectSpread2({}, item.result), {}, { data: config.transformer.output.serialize(item.result.data) }) });
	return item;
}
/**
* Takes a unserialized `TRPCResponse` and serializes it with the router's transformers
**/
function transformTRPCResponse(config, itemOrItems) {
	return Array.isArray(itemOrItems) ? itemOrItems.map((item) => transformTRPCResponseItem(config, item)) : transformTRPCResponseItem(config, itemOrItems);
}
/** @internal */
function transformResultInner(response, transformer) {
	if ("error" in response) {
		const error = transformer.deserialize(response.error);
		return {
			ok: false,
			error: _objectSpread2(_objectSpread2({}, response), {}, { error })
		};
	}
	return {
		ok: true,
		result: _objectSpread2(_objectSpread2({}, response.result), (!response.result.type || response.result.type === "data") && {
			type: "data",
			data: transformer.deserialize(response.result.data)
		})
	};
}
var TransformResultError = class extends Error {
	constructor() {
		super("Unable to transform response from server");
	}
};
/**
* Transforms and validates that the result is a valid TRPCResponse
* @internal
*/
function transformResult(response, transformer) {
	let result;
	try {
		result = transformResultInner(response, transformer);
	} catch (_unused) {
		throw new TransformResultError();
	}
	if (!result.ok && (!isObject(result.error.error) || typeof result.error.error["code"] !== "number")) throw new TransformResultError();
	if (result.ok && !isObject(result.result)) throw new TransformResultError();
	return result;
}
//#endregion
//#region src/unstable-core-do-not-import/router.ts
/**
* @internal
*/
const lazyMarker = "lazyMarker";
function once(fn) {
	const uncalled = Symbol();
	let result = uncalled;
	return () => {
		if (result === uncalled) result = fn();
		return result;
	};
}
/**
* Lazy load a router
* @see https://trpc.io/docs/server/merging-routers#lazy-load
*/
function lazy(importRouter) {
	async function resolve() {
		const mod = await importRouter();
		if (isRouter(mod)) return mod;
		const routers = Object.values(mod);
		if (routers.length !== 1 || !isRouter(routers[0])) throw new Error("Invalid router module - either define exactly 1 export or return the router directly.\nExample: `lazy(() => import('./slow.js').then((m) => m.slowRouter))`");
		return routers[0];
	}
	resolve[lazyMarker] = true;
	return resolve;
}
function isLazy(input) {
	return typeof input === "function" && lazyMarker in input;
}
function isRouter(value) {
	return isObject(value) && isObject(value["_def"]) && "router" in value["_def"];
}
const emptyRouter = {
	_ctx: null,
	_errorShape: null,
	_meta: null,
	queries: {},
	mutations: {},
	subscriptions: {},
	errorFormatter: defaultFormatter,
	transformer: defaultTransformer
};
/**
* Reserved words that can't be used as router or procedure names
*/
const reservedWords = [
	"then",
	"call",
	"apply"
];
/**
* @internal
*/
function createRouterFactory(config) {
	function createRouterInner(input) {
		const reservedWordsUsed = new Set(Object.keys(input).filter((v) => reservedWords.includes(v)));
		if (reservedWordsUsed.size > 0) throw new Error("Reserved words used in `router({})` call: " + Array.from(reservedWordsUsed).join(", "));
		const procedures = emptyObject();
		const lazy = emptyObject();
		function createLazyLoader(opts) {
			return {
				ref: opts.ref,
				load: once(async () => {
					const router = await opts.ref();
					const lazyPath = [...opts.path, opts.key];
					const lazyKey = lazyPath.join(".");
					opts.aggregate[opts.key] = step(router._def.record, lazyPath);
					delete lazy[lazyKey];
					for (const [nestedKey, nestedItem] of Object.entries(router._def.lazy)) {
						const nestedRouterKey = [...lazyPath, nestedKey].join(".");
						lazy[nestedRouterKey] = createLazyLoader({
							ref: nestedItem.ref,
							path: lazyPath,
							key: nestedKey,
							aggregate: opts.aggregate[opts.key]
						});
					}
				})
			};
		}
		function step(from, path = []) {
			const aggregate = emptyObject();
			for (const [key, item] of Object.entries(from !== null && from !== void 0 ? from : {})) {
				if (isLazy(item)) {
					lazy[[...path, key].join(".")] = createLazyLoader({
						path,
						ref: item,
						key,
						aggregate
					});
					continue;
				}
				if (isRouter(item)) {
					aggregate[key] = step(item._def.record, [...path, key]);
					continue;
				}
				if (!isProcedure(item)) {
					aggregate[key] = step(item, [...path, key]);
					continue;
				}
				const newPath = [...path, key].join(".");
				if (procedures[newPath]) throw new Error(`Duplicate key: ${newPath}`);
				procedures[newPath] = item;
				aggregate[key] = item;
			}
			return aggregate;
		}
		const record = step(input);
		const _def = _objectSpread2(_objectSpread2({
			_config: config,
			router: true,
			procedures,
			lazy
		}, emptyRouter), {}, { record });
		return _objectSpread2(_objectSpread2({}, record), {}, {
			_def,
			createCaller: createCallerFactory()({ _def })
		});
	}
	return createRouterInner;
}
function isProcedure(procedureOrRouter) {
	return typeof procedureOrRouter === "function";
}
/**
* @internal
*/
async function getProcedureAtPath(router, path) {
	const { _def } = router;
	let procedure = _def.procedures[path];
	while (!procedure) {
		const key = Object.keys(_def.lazy).find((key) => path === key || path.startsWith(key + "."));
		if (!key) return null;
		await _def.lazy[key].load();
		procedure = _def.procedures[path];
	}
	return procedure;
}
/**
* @internal
*/
async function callProcedure(opts) {
	const { type, path } = opts;
	const proc = await getProcedureAtPath(opts.router, path);
	if (!proc || !isProcedure(proc) || proc._def.type !== type && !opts.allowMethodOverride) throw new TRPCError({
		code: "NOT_FOUND",
		message: `No "${type}"-procedure on path "${path}"`
	});
	/* istanbul ignore if -- @preserve */
	if (proc._def.type !== type && opts.allowMethodOverride && proc._def.type === "subscription") throw new TRPCError({
		code: "METHOD_NOT_SUPPORTED",
		message: `Method override is not supported for subscriptions`
	});
	return proc(opts);
}
function createCallerFactory() {
	return function createCallerInner(router) {
		const { _def } = router;
		return function createCaller(ctxOrCallback, opts) {
			return createRecursiveProxy(async (innerOpts) => {
				const { path, args } = innerOpts;
				const fullPath = path.join(".");
				if (path.length === 1 && path[0] === "_def") return _def;
				const procedure = await getProcedureAtPath(router, fullPath);
				let ctx = void 0;
				try {
					if (!procedure) throw new TRPCError({
						code: "NOT_FOUND",
						message: `No procedure found on path "${path}"`
					});
					ctx = isFunction(ctxOrCallback) ? await Promise.resolve(ctxOrCallback()) : ctxOrCallback;
					return await procedure({
						path: fullPath,
						getRawInput: async () => args[0],
						ctx,
						type: procedure._def.type,
						signal: opts === null || opts === void 0 ? void 0 : opts.signal,
						batchIndex: 0
					});
				} catch (cause) {
					var _opts$onError, _procedure$_def$type;
					opts === null || opts === void 0 || (_opts$onError = opts.onError) === null || _opts$onError === void 0 || _opts$onError.call(opts, {
						ctx,
						error: getTRPCErrorFromUnknown(cause),
						input: args[0],
						path: fullPath,
						type: (_procedure$_def$type = procedure === null || procedure === void 0 ? void 0 : procedure._def.type) !== null && _procedure$_def$type !== void 0 ? _procedure$_def$type : "unknown"
					});
					throw cause;
				}
			});
		};
	};
}
function mergeRouters(...routerList) {
	var _routerList$, _routerList$2;
	const record = mergeWithoutOverrides({}, ...routerList.map((r) => r._def.record));
	return createRouterFactory({
		errorFormatter: routerList.reduce((currentErrorFormatter, nextRouter) => {
			if (nextRouter._def._config.errorFormatter && nextRouter._def._config.errorFormatter !== defaultFormatter) {
				if (currentErrorFormatter !== defaultFormatter && currentErrorFormatter !== nextRouter._def._config.errorFormatter) throw new Error("You seem to have several error formatters");
				return nextRouter._def._config.errorFormatter;
			}
			return currentErrorFormatter;
		}, defaultFormatter),
		transformer: routerList.reduce((prev, current) => {
			if (current._def._config.transformer && current._def._config.transformer !== defaultTransformer) {
				if (prev !== defaultTransformer && prev !== current._def._config.transformer) throw new Error("You seem to have several transformers");
				return current._def._config.transformer;
			}
			return prev;
		}, defaultTransformer),
		isDev: routerList.every((r) => r._def._config.isDev),
		allowOutsideOfServer: routerList.every((r) => r._def._config.allowOutsideOfServer),
		isServer: routerList.every((r) => r._def._config.isServer),
		$types: (_routerList$ = routerList[0]) === null || _routerList$ === void 0 ? void 0 : _routerList$._def._config.$types,
		sse: (_routerList$2 = routerList[0]) === null || _routerList$2 === void 0 ? void 0 : _routerList$2._def._config.sse
	})(record);
}
//#endregion
//#region src/unstable-core-do-not-import/stream/tracked.ts
const trackedSymbol = Symbol();
/**
* Produce a typed server-sent event message
* @deprecated use `tracked(id, data)` instead
*/
function sse(event) {
	return tracked(event.id, event.data);
}
function isTrackedEnvelope(value) {
	return Array.isArray(value) && value[2] === trackedSymbol;
}
/**
* Automatically track an event so that it can be resumed from a given id if the connection is lost
*/
function tracked(id, data) {
	if (id === "") throw new Error("`id` must not be an empty string as empty string is the same as not setting the id at all");
	return [
		id,
		data,
		trackedSymbol
	];
}
//#endregion
export { defaultFormatter as _, createCallerFactory as a, lazy as c, getDataTransformer as d, transformResult as f, getTRPCErrorFromUnknown as g, getCauseFromUnknown as h, callProcedure as i, mergeRouters as l, TRPCError as m, sse as n, createRouterFactory as o, transformTRPCResponse as p, tracked as r, getProcedureAtPath as s, isTrackedEnvelope as t, defaultTransformer as u };

//# sourceMappingURL=tracked-D4jU_Hb3.mjs.map