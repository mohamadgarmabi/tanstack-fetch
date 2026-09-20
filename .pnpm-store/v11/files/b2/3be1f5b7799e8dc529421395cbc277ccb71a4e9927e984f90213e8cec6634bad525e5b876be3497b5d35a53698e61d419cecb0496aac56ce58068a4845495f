const require_objectSpread2 = require("./objectSpread2-D-dJi1gK.cjs");
const require_TRPCClientError = require("./TRPCClientError-CmHlBkPF.cjs");
const require_httpUtils = require("./httpUtils-cggqcHz0.cjs");
let _trpc_server_observable = require("@trpc/server/observable");
let _trpc_server_unstable_core_do_not_import = require("@trpc/server/unstable-core-do-not-import");
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
			return require_httpUtils.httpRequest(require_objectSpread2._objectSpread2(require_objectSpread2._objectSpread2({}, opts), {}, {
				contentTypeHeader: void 0,
				getUrl: require_httpUtils.getUrl,
				getBody: () => input
			}));
		}
		if (isOctetType(input)) {
			if (opts.type !== "mutation" && opts.methodOverride !== "POST") throw new Error("Octet type input is only supported for mutations");
			return require_httpUtils.httpRequest(require_objectSpread2._objectSpread2(require_objectSpread2._objectSpread2({}, opts), {}, {
				contentTypeHeader: "application/octet-stream",
				getUrl: require_httpUtils.getUrl,
				getBody: () => input
			}));
		}
	}
	return require_httpUtils.jsonHttpRequester(opts);
};
/**
* @see https://trpc.io/docs/client/links/httpLink
*/
function httpLink(opts) {
	const resolvedOpts = require_httpUtils.resolveHTTPLinkOptions(opts);
	return () => {
		return (operationOpts) => {
			const { op } = operationOpts;
			return (0, _trpc_server_observable.observable)((observer) => {
				const { path, input, type } = op;
				/* istanbul ignore if -- @preserve */
				if (type === "subscription") throw new Error("Subscriptions are unsupported by `httpLink` - use `httpSubscriptionLink` or `wsLink`");
				const ac = new AbortController();
				const request = universalRequester(require_objectSpread2._objectSpread2(require_objectSpread2._objectSpread2({}, resolvedOpts), {}, {
					type,
					path,
					input,
					signal: require_httpUtils.raceAbortSignals(op.signal, ac.signal),
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
					const transformed = (0, _trpc_server_unstable_core_do_not_import.transformResult)(res.json, resolvedOpts.transformer.output);
					if (!transformed.ok) {
						observer.error(require_TRPCClientError.TRPCClientError.from(transformed.error, { meta }));
						return;
					}
					observer.next({
						context: res.meta,
						result: transformed.result
					});
					observer.complete();
				}).catch((cause) => {
					isDone = true;
					observer.error(require_TRPCClientError.TRPCClientError.from(cause, { meta }));
				});
				return () => {
					if (!isDone) ac.abort();
				};
			});
		};
	};
}
//#endregion
Object.defineProperty(exports, "httpLink", {
	enumerable: true,
	get: function() {
		return httpLink;
	}
});
Object.defineProperty(exports, "isFormData", {
	enumerable: true,
	get: function() {
		return isFormData;
	}
});
Object.defineProperty(exports, "isNonJsonSerializable", {
	enumerable: true,
	get: function() {
		return isNonJsonSerializable;
	}
});
Object.defineProperty(exports, "isOctetType", {
	enumerable: true,
	get: function() {
		return isOctetType;
	}
});
