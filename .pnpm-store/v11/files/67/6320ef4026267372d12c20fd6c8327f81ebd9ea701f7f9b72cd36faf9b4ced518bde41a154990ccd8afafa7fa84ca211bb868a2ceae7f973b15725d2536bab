Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_rolldown_runtime = require("../rolldown-runtime-VH7oDXx4.cjs");
const require_codes = require("../codes-C6ZIq69A.cjs");
const require_getErrorShape = require("../getErrorShape-DeIapApr.cjs");
const require_node_http = require("../node-http-CikCqjt6.cjs");
let http = require("http");
http = require_rolldown_runtime.__toESM(http, 1);
//#region src/adapters/standalone.ts
/**
* If you're making an adapter for tRPC and looking at this file for reference, you should import types and functions from `@trpc/server` and `@trpc/server/http`
*
* @example
* ```ts
* import type { AnyTRPCRouter } from '@trpc/server'
* import type { HTTPBaseHandlerOptions } from '@trpc/server/http'
* ```
*/
function createHandler(opts) {
	var _opts$basePath;
	const sliceLength = ((_opts$basePath = opts.basePath) !== null && _opts$basePath !== void 0 ? _opts$basePath : "/").length;
	return (req, res) => {
		let path = "";
		require_codes.run(async () => {
			path = require_node_http.createURL(req).pathname.slice(sliceLength);
			await require_node_http.nodeHTTPRequestHandler(require_getErrorShape._objectSpread2(require_getErrorShape._objectSpread2({}, opts), {}, {
				req,
				res,
				path
			}));
		}).catch(require_node_http.internal_exceptionHandler(require_getErrorShape._objectSpread2({
			req,
			res,
			path
		}, opts)));
	};
}
/**
* @internal
*/
function createHTTPHandler(opts) {
	return createHandler(opts);
}
function createHTTPServer(opts) {
	return http.default.createServer(createHTTPHandler(opts));
}
function createHTTP2Handler(opts) {
	return createHandler(opts);
}
//#endregion
exports.createHTTP2Handler = createHTTP2Handler;
exports.createHTTPHandler = createHTTPHandler;
exports.createHTTPServer = createHTTPServer;
