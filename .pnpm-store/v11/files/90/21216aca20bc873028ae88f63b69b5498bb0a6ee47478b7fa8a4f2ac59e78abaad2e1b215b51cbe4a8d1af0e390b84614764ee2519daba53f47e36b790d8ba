Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_codes = require("../codes-C6ZIq69A.cjs");
const require_getErrorShape = require("../getErrorShape-DeIapApr.cjs");
const require_tracked = require("../tracked-BQJb0ANk.cjs");
const require_node_http = require("../node-http-CikCqjt6.cjs");
//#region src/adapters/next.ts
function createNextApiHandler(opts) {
	return async (req, res) => {
		let path = "";
		await require_codes.run(async () => {
			path = require_codes.run(() => {
				if (typeof req.query["trpc"] === "string") return req.query["trpc"];
				if (Array.isArray(req.query["trpc"])) return req.query["trpc"].join("/");
				throw new require_tracked.TRPCError({
					message: "Query \"trpc\" not found - is the file named `[trpc]`.ts or `[...trpc].ts`?",
					code: "INTERNAL_SERVER_ERROR"
				});
			});
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
//#endregion
exports.createNextApiHandler = createNextApiHandler;
