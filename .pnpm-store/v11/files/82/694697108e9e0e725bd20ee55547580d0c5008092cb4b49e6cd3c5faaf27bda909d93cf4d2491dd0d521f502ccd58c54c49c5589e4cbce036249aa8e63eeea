import { n as _objectSpread2 } from "../../getErrorShape-B0JBUs-i.mjs";
import { t as resolveResponse } from "../../resolveResponse-JtMyT9TQ.mjs";
//#region src/adapters/fetch/fetchRequestHandler.ts
const trimSlashes = (path) => {
	path = path.startsWith("/") ? path.slice(1) : path;
	path = path.endsWith("/") ? path.slice(0, -1) : path;
	return path;
};
async function fetchRequestHandler(opts) {
	const resHeaders = new Headers();
	const createContext = async (innerOpts) => {
		var _opts$createContext;
		return (_opts$createContext = opts.createContext) === null || _opts$createContext === void 0 ? void 0 : _opts$createContext.call(opts, _objectSpread2({
			req: opts.req,
			resHeaders
		}, innerOpts));
	};
	const url = new URL(opts.req.url);
	const pathname = trimSlashes(url.pathname);
	const endpoint = trimSlashes(opts.endpoint);
	const path = trimSlashes(pathname.slice(endpoint.length));
	return await resolveResponse(_objectSpread2(_objectSpread2({}, opts), {}, {
		req: opts.req,
		createContext,
		path,
		error: null,
		onError(o) {
			var _opts$onError;
			opts === null || opts === void 0 || (_opts$onError = opts.onError) === null || _opts$onError === void 0 || _opts$onError.call(opts, _objectSpread2(_objectSpread2({}, o), {}, { req: opts.req }));
		},
		responseMeta(data) {
			var _opts$responseMeta;
			const meta = (_opts$responseMeta = opts.responseMeta) === null || _opts$responseMeta === void 0 ? void 0 : _opts$responseMeta.call(opts, data);
			if (meta === null || meta === void 0 ? void 0 : meta.headers) {
				if (meta.headers instanceof Headers) for (const [key, value] of meta.headers.entries()) resHeaders.append(key, value);
				else
 /**
				* @deprecated, delete in v12
				*/
				for (const [key, value] of Object.entries(meta.headers)) if (Array.isArray(value)) for (const v of value) resHeaders.append(key, v);
				else if (typeof value === "string") resHeaders.set(key, value);
			}
			return {
				headers: resHeaders,
				status: meta === null || meta === void 0 ? void 0 : meta.status
			};
		}
	}));
}
//#endregion
export { fetchRequestHandler };

//# sourceMappingURL=index.mjs.map