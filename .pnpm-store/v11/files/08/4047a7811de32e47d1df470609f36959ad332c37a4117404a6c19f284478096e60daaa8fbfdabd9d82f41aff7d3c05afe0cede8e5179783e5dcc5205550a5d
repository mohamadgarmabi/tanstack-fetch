Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_codes = require("../codes-C6ZIq69A.cjs");
const require_getErrorShape = require("../getErrorShape-DeIapApr.cjs");
const require_node_http = require("../node-http-CikCqjt6.cjs");
//#region src/adapters/express.ts
function createExpressMiddleware(opts) {
	return (req, res) => {
		let path = "";
		require_codes.run(async () => {
			path = req.path.slice(req.path.lastIndexOf("/") + 1);
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
exports.createExpressMiddleware = createExpressMiddleware;
