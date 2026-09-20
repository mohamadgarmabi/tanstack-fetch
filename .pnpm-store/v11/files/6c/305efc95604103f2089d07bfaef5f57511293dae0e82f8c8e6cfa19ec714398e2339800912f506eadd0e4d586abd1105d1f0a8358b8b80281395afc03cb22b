import { p as run } from "../codes-D5Ya6_Bi.mjs";
import { n as _objectSpread2 } from "../getErrorShape-B0JBUs-i.mjs";
import { n as nodeHTTPRequestHandler, r as createURL, t as internal_exceptionHandler } from "../node-http-BUlb5EdB.mjs";
import http from "http";
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
		run(async () => {
			path = createURL(req).pathname.slice(sliceLength);
			await nodeHTTPRequestHandler(_objectSpread2(_objectSpread2({}, opts), {}, {
				req,
				res,
				path
			}));
		}).catch(internal_exceptionHandler(_objectSpread2({
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
	return http.createServer(createHTTPHandler(opts));
}
function createHTTP2Handler(opts) {
	return createHandler(opts);
}
//#endregion
export { createHTTP2Handler, createHTTPHandler, createHTTPServer };

//# sourceMappingURL=standalone.mjs.map