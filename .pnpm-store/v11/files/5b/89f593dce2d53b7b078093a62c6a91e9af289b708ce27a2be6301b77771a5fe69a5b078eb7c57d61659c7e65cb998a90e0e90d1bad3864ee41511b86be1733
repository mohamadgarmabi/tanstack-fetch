import { t as _objectSpread2 } from "./objectSpread2-weooBxVk.mjs";
import { t as TRPCClientError } from "./TRPCClientError-CxFRO7Js.mjs";
import { a as jsonHttpRequester, i as httpRequest, l as raceAbortSignals, o as resolveHTTPLinkOptions, r as getUrl } from "./httpUtils-CB_100ND.mjs";
import { observable } from "@trpc/server/observable";
import { transformResult } from "@trpc/server/unstable-core-do-not-import";
//#region src/links/internals/contentTypes.ts
function isOctetType(input) {
	return input instanceof Uint8Array || input instanceof Blob;
}
function isFormData(input) {
	return input instanceof FormData;
}
function isNonJsonSerializable(input) {
	return isOctetType(input) || isFormData(input);
}
//#endregion
//#region src/links/httpLink.ts
const universalRequester = (opts) => {
	if ("input" in opts) {
		const { input } = opts;
		if (isFormData(input)) {
			if (opts.type !== "mutation" && opts.methodOverride !== "POST") throw new Error("FormData is only supported for mutations");
			return httpRequest(_objectSpread2(_objectSpread2({}, opts), {}, {
				contentTypeHeader: void 0,
				getUrl,
				getBody: () => input
			}));
		}
		if (isOctetType(input)) {
			if (opts.type !== "mutation" && opts.methodOverride !== "POST") throw new Error("Octet type input is only supported for mutations");
			return httpRequest(_objectSpread2(_objectSpread2({}, opts), {}, {
				contentTypeHeader: "application/octet-stream",
				getUrl,
				getBody: () => input
			}));
		}
	}
	return jsonHttpRequester(opts);
};
/**
* @see https://trpc.io/docs/client/links/httpLink
*/
function httpLink(opts) {
	const resolvedOpts = resolveHTTPLinkOptions(opts);
	return () => {
		return (operationOpts) => {
			const { op } = operationOpts;
			return observable((observer) => {
				const { path, input, type } = op;
				/* istanbul ignore if -- @preserve */
				if (type === "subscription") throw new Error("Subscriptions are unsupported by `httpLink` - use `httpSubscriptionLink` or `wsLink`");
				const ac = new AbortController();
				const request = universalRequester(_objectSpread2(_objectSpread2({}, resolvedOpts), {}, {
					type,
					path,
					input,
					signal: raceAbortSignals(op.signal, ac.signal),
					headers() {
						if (!opts.headers) return {};
						if (typeof opts.headers === "function") return opts.headers({ op });
						return opts.headers;
					}
				}));
				let isDone = false;
				let meta = void 0;
				request.then((res) => {
					isDone = true;
					meta = res.meta;
					const transformed = transformResult(res.json, resolvedOpts.transformer.output);
					if (!transformed.ok) {
						observer.error(TRPCClientError.from(transformed.error, { meta }));
						return;
					}
					observer.next({
						context: res.meta,
						result: transformed.result
					});
					observer.complete();
				}).catch((cause) => {
					isDone = true;
					observer.error(TRPCClientError.from(cause, { meta }));
				});
				return () => {
					if (!isDone) ac.abort();
				};
			});
		};
	};
}
//#endregion
export { isOctetType as i, isFormData as n, isNonJsonSerializable as r, httpLink as t };

//# sourceMappingURL=httpLink-Tm93WWFA.mjs.map