import { p as run } from "../codes-D5Ya6_Bi.mjs";
import { n as _objectSpread2 } from "../getErrorShape-B0JBUs-i.mjs";
import { m as TRPCError } from "../tracked-D4jU_Hb3.mjs";
import { n as nodeHTTPRequestHandler, t as internal_exceptionHandler } from "../node-http-BUlb5EdB.mjs";
//#region src/adapters/next.ts
function createNextApiHandler(opts) {
	return async (req, res) => {
		let path = "";
		await run(async () => {
			path = run(() => {
				if (typeof req.query["trpc"] === "string") return req.query["trpc"];
				if (Array.isArray(req.query["trpc"])) return req.query["trpc"].join("/");
				throw new TRPCError({
					message: "Query \"trpc\" not found - is the file named `[trpc]`.ts or `[...trpc].ts`?",
					code: "INTERNAL_SERVER_ERROR"
				});
			});
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
export { createNextApiHandler };

//# sourceMappingURL=next.mjs.map