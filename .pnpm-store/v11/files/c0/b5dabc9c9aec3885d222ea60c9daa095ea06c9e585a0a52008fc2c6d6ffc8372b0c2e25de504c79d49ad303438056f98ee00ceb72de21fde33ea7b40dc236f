import { n as TRPC_ERROR_CODES_BY_NUMBER, o as emptyObject, t as TRPC_ERROR_CODES_BY_KEY, u as isObject } from "./codes-D5Ya6_Bi.mjs";
//#region src/unstable-core-do-not-import/createProxy.ts
const noop = () => {};
const freezeIfAvailable = (obj) => {
	if (Object.freeze) Object.freeze(obj);
};
function createInnerProxy(callback, path, memo) {
	var _memo$cacheKey;
	const cacheKey = path.join(".");
	(_memo$cacheKey = memo[cacheKey]) !== null && _memo$cacheKey !== void 0 || (memo[cacheKey] = new Proxy(noop, {
		get(_obj, key) {
			if (typeof key !== "string" || key === "then") return;
			return createInnerProxy(callback, [...path, key], memo);
		},
		apply(_1, _2, args) {
			const lastOfPath = path[path.length - 1];
			if (lastOfPath === "valueOf" || lastOfPath === "toString" || lastOfPath === "toJSON") return `tRPC.proxy(${path.slice(0, -1).join(".")})`;
			let opts = {
				args,
				path
			};
			if (lastOfPath === "call") opts = {
				args: args.length >= 2 ? [args[1]] : [],
				path: path.slice(0, -1)
			};
			else if (lastOfPath === "apply") opts = {
				args: args.length >= 2 ? args[1] : [],
				path: path.slice(0, -1)
			};
			freezeIfAvailable(opts.args);
			freezeIfAvailable(opts.path);
			return callback(opts);
		}
	}));
	return memo[cacheKey];
}
/**
* Creates a proxy that calls the callback with the path and arguments
*
* @internal
*/
const createRecursiveProxy = (callback) => createInnerProxy(callback, [], emptyObject());
/**
* Used in place of `new Proxy` where each handler will map 1 level deep to another value.
*
* @internal
*/
const createFlatProxy = (callback) => {
	return new Proxy(noop, { get(_obj, name) {
		if (name === "then") return;
		return callback(name);
	} });
};
//#endregion
//#region src/unstable-core-do-not-import/http/getHTTPStatusCode.ts
const JSONRPC2_TO_HTTP_CODE = {
	PARSE_ERROR: 400,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	PAYMENT_REQUIRED: 402,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_SUPPORTED: 405,
	TIMEOUT: 408,
	CONFLICT: 409,
	PRECONDITION_FAILED: 412,
	PAYLOAD_TOO_LARGE: 413,
	UNSUPPORTED_MEDIA_TYPE: 415,
	UNPROCESSABLE_CONTENT: 422,
	PRECONDITION_REQUIRED: 428,
	TOO_MANY_REQUESTS: 429,
	CLIENT_CLOSED_REQUEST: 499,
	INTERNAL_SERVER_ERROR: 500,
	NOT_IMPLEMENTED: 501,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
	GATEWAY_TIMEOUT: 504
};
const HTTP_CODE_TO_JSONRPC2 = {
	400: "BAD_REQUEST",
	401: "UNAUTHORIZED",
	402: "PAYMENT_REQUIRED",
	403: "FORBIDDEN",
	404: "NOT_FOUND",
	405: "METHOD_NOT_SUPPORTED",
	408: "TIMEOUT",
	409: "CONFLICT",
	412: "PRECONDITION_FAILED",
	413: "PAYLOAD_TOO_LARGE",
	415: "UNSUPPORTED_MEDIA_TYPE",
	422: "UNPROCESSABLE_CONTENT",
	428: "PRECONDITION_REQUIRED",
	429: "TOO_MANY_REQUESTS",
	499: "CLIENT_CLOSED_REQUEST",
	500: "INTERNAL_SERVER_ERROR",
	501: "NOT_IMPLEMENTED",
	502: "BAD_GATEWAY",
	503: "SERVICE_UNAVAILABLE",
	504: "GATEWAY_TIMEOUT"
};
function getStatusCodeFromKey(code) {
	var _JSONRPC2_TO_HTTP_COD;
	return (_JSONRPC2_TO_HTTP_COD = JSONRPC2_TO_HTTP_CODE[code]) !== null && _JSONRPC2_TO_HTTP_COD !== void 0 ? _JSONRPC2_TO_HTTP_COD : 500;
}
function getStatusKeyFromCode(code) {
	var _HTTP_CODE_TO_JSONRPC;
	return (_HTTP_CODE_TO_JSONRPC = HTTP_CODE_TO_JSONRPC2[code]) !== null && _HTTP_CODE_TO_JSONRPC !== void 0 ? _HTTP_CODE_TO_JSONRPC : "INTERNAL_SERVER_ERROR";
}
function getHTTPStatusCode(json) {
	const httpStatuses = new Set((Array.isArray(json) ? json : [json]).map((res) => {
		if ("error" in res && isObject(res.error.data)) {
			var _res$error$data;
			if (typeof ((_res$error$data = res.error.data) === null || _res$error$data === void 0 ? void 0 : _res$error$data["httpStatus"]) === "number") return res.error.data["httpStatus"];
			const code = TRPC_ERROR_CODES_BY_NUMBER[res.error.code];
			return getStatusCodeFromKey(code);
		}
		return 200;
	}));
	if (httpStatuses.size !== 1) return 207;
	return httpStatuses.values().next().value;
}
function getHTTPStatusCodeFromError(error) {
	return getStatusCodeFromKey(error.code);
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
		return typeof o;
	} : function(o) {
		return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	}, _typeof(o);
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/objectSpread2.js
function ownKeys(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread2(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
//#endregion
//#region src/unstable-core-do-not-import/error/getErrorShape.ts
/**
* @internal
*/
function getErrorShape(opts) {
	const { path, error, config } = opts;
	const { code } = opts.error;
	const shape = {
		message: error.message,
		code: TRPC_ERROR_CODES_BY_KEY[code],
		data: {
			code,
			httpStatus: getHTTPStatusCodeFromError(error)
		}
	};
	if (config.isDev && typeof opts.error.stack === "string") shape.data.stack = opts.error.stack;
	if (typeof path === "string") shape.data.path = path;
	return config.errorFormatter(_objectSpread2(_objectSpread2({}, opts), {}, { shape }));
}
//#endregion
export { JSONRPC2_TO_HTTP_CODE as a, getStatusCodeFromKey as c, createRecursiveProxy as d, HTTP_CODE_TO_JSONRPC2 as i, getStatusKeyFromCode as l, _objectSpread2 as n, getHTTPStatusCode as o, _defineProperty as r, getHTTPStatusCodeFromError as s, getErrorShape as t, createFlatProxy as u };

//# sourceMappingURL=getErrorShape-B0JBUs-i.mjs.map