import { p as run } from "../codes-D5Ya6_Bi.mjs";
import { n as _objectSpread2 } from "../getErrorShape-B0JBUs-i.mjs";
import { n as nodeHTTPRequestHandler, t as internal_exceptionHandler } from "../node-http-BUlb5EdB.mjs";
//#region src/adapters/express.ts
function createExpressMiddleware(opts) {
	return (req, res) => {
		let path = "";
		run(async () => {
			path = req.path.slice(req.path.lastIndexOf("/") + 1);
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
//#endregion
export { createExpressMiddleware };

//# sourceMappingURL=express.mjs.map