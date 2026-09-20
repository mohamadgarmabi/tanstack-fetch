import { t as _objectSpread2 } from "./objectSpread2-weooBxVk.mjs";
import { getTransformer } from "./unstable-internals.mjs";
//#region src/getFetch.ts
const isFunction = (fn) => typeof fn === "function";
function getFetch(customFetchImpl) {
	if (customFetchImpl) return customFetchImpl;
	if (typeof window !== "undefined" && isFunction(window.fetch)) return window.fetch.bind(window);
	if (typeof globalThis !== "undefined" && isFunction(globalThis.fetch)) return globalThis.fetch;
	throw new Error("No fetch implementation found");
}
//#endregion
//#region src/internals/signals.ts
/**
* Like `Promise.all()` but for abort signals
* - When all signals have been aborted, the merged signal will be aborted
* - If one signal is `null`, no signal will be aborted
*/
function allAbortSignals(...signals) {
	const ac = new AbortController();
	const count = signals.length;
	let abortedCount = 0;
	const onAbort = () => {
		if (++abortedCount === count) ac.abort();
	};
	for (const signal of signals) if (signal === null || signal === void 0 ? void 0 : signal.aborted) onAbort();
	else signal === null || signal === void 0 || signal.addEventListener("abort", onAbort, { once: true });
	return ac.signal;
}
/**
* Like `Promise.race` but for abort signals
*
* Basically, a ponyfill for
* [`AbortSignal.any`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static).
*/
function raceAbortSignals(...signals) {
	const ac = new AbortController();
	for (const signal of signals) if (signal === null || signal === void 0 ? void 0 : signal.aborted) ac.abort();
	else signal === null || signal === void 0 || signal.addEventListener("abort", () => ac.abort(), { once: true });
	return ac.signal;
}
function abortSignalToPromise(signal) {
	return new Promise((_, reject) => {
		if (signal.aborted) {
			reject(signal.reason);
			return;
		}
		signal.addEventListener("abort", () => {
			reject(signal.reason);
		}, { once: true });
	});
}
//#endregion
//#region src/links/internals/httpUtils.ts
function resolveHTTPLinkOptions(opts) {
	return {
		url: opts.url.toString(),
		fetch: opts.fetch,
		transformer: getTransformer(opts.transformer),
		methodOverride: opts.methodOverride
	};
}
function arrayToDict(array) {
	const dict = {};
	for (let index = 0; index < array.length; index++) {
		const element = array[index];
		dict[index] = element;
	}
	return dict;
}
const METHOD = {
	query: "GET",
	mutation: "POST",
	subscription: "PATCH"
};
function getInput(opts) {
	return "input" in opts ? opts.transformer.input.serialize(opts.input) : arrayToDict(opts.inputs.map((_input) => opts.transformer.input.serialize(_input)));
}
const getUrl = (opts) => {
	const parts = opts.url.split("?");
	let url = parts[0].replace(/\/$/, "") + "/" + opts.path;
	const queryParts = [];
	if (parts[1]) queryParts.push(parts[1]);
	if ("inputs" in opts) queryParts.push("batch=1");
	if (opts.type === "query" || opts.type === "subscription") {
		const input = getInput(opts);
		if (input !== void 0 && opts.methodOverride !== "POST") queryParts.push(`input=${encodeURIComponent(JSON.stringify(input))}`);
	}
	if (queryParts.length) url += "?" + queryParts.join("&");
	return url;
};
const getBody = (opts) => {
	if (opts.type === "query" && opts.methodOverride !== "POST") return;
	const input = getInput(opts);
	return input !== void 0 ? JSON.stringify(input) : void 0;
};
const jsonHttpRequester = (opts) => {
	return httpRequest(_objectSpread2(_objectSpread2({}, opts), {}, {
		contentTypeHeader: "application/json",
		getUrl,
		getBody
	}));
};
/**
* Polyfill for DOMException with AbortError name
*/
var AbortError = class extends Error {
	constructor() {
		const name = "AbortError";
		super(name);
		this.name = name;
		this.message = name;
	}
};
/**
* Polyfill for `signal.throwIfAborted()`
*
* @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/throwIfAborted
*/
const throwIfAborted = (signal) => {
	var _signal$throwIfAborte;
	if (!(signal === null || signal === void 0 ? void 0 : signal.aborted)) return;
	(_signal$throwIfAborte = signal.throwIfAborted) === null || _signal$throwIfAborte === void 0 || _signal$throwIfAborte.call(signal);
	if (typeof DOMException !== "undefined") throw new DOMException("AbortError", "AbortError");
	throw new AbortError();
};
async function fetchHTTPResponse(opts) {
	var _opts$methodOverride, _opts$trpcAcceptHeade;
	throwIfAborted(opts.signal);
	const url = opts.getUrl(opts);
	const body = opts.getBody(opts);
	const method = (_opts$methodOverride = opts.methodOverride) !== null && _opts$methodOverride !== void 0 ? _opts$methodOverride : METHOD[opts.type];
	const resolvedHeaders = await (async () => {
		const heads = await opts.headers();
		if (Symbol.iterator in heads) return Object.fromEntries(heads);
		return heads;
	})();
	const headers = _objectSpread2(_objectSpread2(_objectSpread2({}, opts.contentTypeHeader && method !== "GET" ? { "content-type": opts.contentTypeHeader } : {}), opts.trpcAcceptHeader ? { [(_opts$trpcAcceptHeade = opts.trpcAcceptHeaderKey) !== null && _opts$trpcAcceptHeade !== void 0 ? _opts$trpcAcceptHeade : "trpc-accept"]: opts.trpcAcceptHeader } : void 0), resolvedHeaders);
	return getFetch(opts.fetch)(url, {
		method,
		signal: opts.signal,
		body,
		headers
	});
}
async function httpRequest(opts) {
	const meta = {};
	const res = await fetchHTTPResponse(opts);
	meta.response = res;
	const json = await res.json();
	meta.responseJSON = json;
	return {
		json,
		meta
	};
}
//#endregion
export { jsonHttpRequester as a, allAbortSignals as c, httpRequest as i, raceAbortSignals as l, getBody as n, resolveHTTPLinkOptions as o, getUrl as r, abortSignalToPromise as s, fetchHTTPResponse as t, getFetch as u };

//# sourceMappingURL=httpUtils-CB_100ND.mjs.map