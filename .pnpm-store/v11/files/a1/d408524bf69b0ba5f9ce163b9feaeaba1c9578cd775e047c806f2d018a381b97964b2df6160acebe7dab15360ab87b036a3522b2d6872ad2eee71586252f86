const require_objectSpread2 = require("./objectSpread2-D-dJi1gK.cjs");
const require_TRPCClientError = require("./TRPCClientError-CmHlBkPF.cjs");
const require_httpUtils = require("./httpUtils-cggqcHz0.cjs");
let _trpc_server_observable = require("@trpc/server/observable");
let _trpc_server_unstable_core_do_not_import = require("@trpc/server/unstable-core-do-not-import");
//#region src/internals/dataLoader.ts
/**
* A function that should never be called unless we messed something up.
*/
const throwFatalError = () => {
	throw new Error("Something went wrong. Please submit an issue at https://github.com/trpc/trpc/issues/new");
};
/**
* Dataloader that's very inspired by https://github.com/graphql/dataloader
* Less configuration, no caching, and allows you to cancel requests
* When cancelling a single fetch the whole batch will be cancelled only when _all_ items are cancelled
*/
function dataLoader(batchLoader) {
	let pendingItems = null;
	let dispatchTimer = null;
	const destroyTimerAndPendingItems = () => {
		clearTimeout(dispatchTimer);
		dispatchTimer = null;
		pendingItems = null;
	};
	/**
	* Iterate through the items and split them into groups based on the `batchLoader`'s validate function
	*/
	function groupItems(items) {
		const groupedItems = [[]];
		let index = 0;
		while (true) {
			const item = items[index];
			if (!item) break;
			const lastGroup = groupedItems[groupedItems.length - 1];
			if (item.aborted) {
				var _item$reject;
				(_item$reject = item.reject) === null || _item$reject === void 0 || _item$reject.call(item, /* @__PURE__ */ new Error("Aborted"));
				index++;
				continue;
			}
			if (batchLoader.validate(lastGroup.concat(item).map((it) => it.key))) {
				lastGroup.push(item);
				index++;
				continue;
			}
			if (lastGroup.length === 0) {
				var _item$reject2;
				(_item$reject2 = item.reject) === null || _item$reject2 === void 0 || _item$reject2.call(item, /* @__PURE__ */ new Error("Input is too big for a single dispatch"));
				index++;
				continue;
			}
			groupedItems.push([]);
		}
		return groupedItems;
	}
	function dispatch() {
		const groupedItems = groupItems(pendingItems);
		destroyTimerAndPendingItems();
		for (const items of groupedItems) {
			if (!items.length) continue;
			const batch = { items };
			for (const item of items) item.batch = batch;
			batchLoader.fetch(batch.items.map((_item) => _item.key)).then(async (result) => {
				await Promise.all(result.map(async (valueOrPromise, index) => {
					const item = batch.items[index];
					try {
						var _item$resolve;
						const value = await Promise.resolve(valueOrPromise);
						(_item$resolve = item.resolve) === null || _item$resolve === void 0 || _item$resolve.call(item, value);
					} catch (cause) {
						var _item$reject3;
						(_item$reject3 = item.reject) === null || _item$reject3 === void 0 || _item$reject3.call(item, cause);
					}
					item.batch = null;
					item.reject = null;
					item.resolve = null;
				}));
				for (const item of batch.items) {
					var _item$reject4;
					(_item$reject4 = item.reject) === null || _item$reject4 === void 0 || _item$reject4.call(item, /* @__PURE__ */ new Error("Missing result"));
					item.batch = null;
				}
			}).catch((cause) => {
				for (const item of batch.items) {
					var _item$reject5;
					(_item$reject5 = item.reject) === null || _item$reject5 === void 0 || _item$reject5.call(item, cause);
					item.batch = null;
				}
			});
		}
	}
	function load(key) {
		var _dispatchTimer;
		const item = {
			aborted: false,
			key,
			batch: null,
			resolve: throwFatalError,
			reject: throwFatalError
		};
		const promise = new Promise((resolve, reject) => {
			var _pendingItems;
			item.reject = reject;
			item.resolve = resolve;
			(_pendingItems = pendingItems) !== null && _pendingItems !== void 0 || (pendingItems = []);
			pendingItems.push(item);
		});
		(_dispatchTimer = dispatchTimer) !== null && _dispatchTimer !== void 0 || (dispatchTimer = setTimeout(dispatch));
		return promise;
	}
	return { load };
}
//#endregion
//#region src/links/httpBatchLink.ts
/**
* @see https://trpc.io/docs/client/links/httpBatchLink
*/
function httpBatchLink(opts) {
	var _opts$maxURLLength, _opts$maxItems;
	const resolvedOpts = require_httpUtils.resolveHTTPLinkOptions(opts);
	const maxURLLength = (_opts$maxURLLength = opts.maxURLLength) !== null && _opts$maxURLLength !== void 0 ? _opts$maxURLLength : Infinity;
	const maxItems = (_opts$maxItems = opts.maxItems) !== null && _opts$maxItems !== void 0 ? _opts$maxItems : Infinity;
	return () => {
		const batchLoader = (type) => {
			return {
				validate(batchOps) {
					if (maxURLLength === Infinity && maxItems === Infinity) return true;
					if (batchOps.length > maxItems) return false;
					const path = batchOps.map((op) => op.path).join(",");
					const inputs = batchOps.map((op) => op.input);
					return require_httpUtils.getUrl(require_objectSpread2._objectSpread2(require_objectSpread2._objectSpread2({}, resolvedOpts), {}, {
						type,
						path,
						inputs,
						signal: null
					})).length <= maxURLLength;
				},
				async fetch(batchOps) {
					const path = batchOps.map((op) => op.path).join(",");
					const inputs = batchOps.map((op) => op.input);
					const signal = require_httpUtils.allAbortSignals(...batchOps.map((op) => op.signal));
					const res = await require_httpUtils.jsonHttpRequester(require_objectSpread2._objectSpread2(require_objectSpread2._objectSpread2({}, resolvedOpts), {}, {
						path,
						inputs,
						type,
						headers() {
							if (!opts.headers) return {};
							if (typeof opts.headers === "function") return opts.headers({ opList: batchOps });
							return opts.headers;
						},
						signal
					}));
					return (Array.isArray(res.json) ? res.json : batchOps.map(() => res.json)).map((item) => ({
						meta: res.meta,
						json: item
					}));
				}
			};
		};
		const loaders = {
			query: dataLoader(batchLoader("query")),
			mutation: dataLoader(batchLoader("mutation"))
		};
		return ({ op }) => {
			return (0, _trpc_server_observable.observable)((observer) => {
				/* istanbul ignore if -- @preserve */
				if (op.type === "subscription") throw new Error("Subscriptions are unsupported by `httpLink` - use `httpSubscriptionLink` or `wsLink`");
				const ac = new AbortController();
				const promise = loaders[op.type].load(require_objectSpread2._objectSpread2(require_objectSpread2._objectSpread2({}, op), {}, { signal: require_httpUtils.raceAbortSignals(op.signal, ac.signal) }));
				let isDone = false;
				let _res = void 0;
				promise.then((res) => {
					isDone = true;
					_res = res;
					const transformed = (0, _trpc_server_unstable_core_do_not_import.transformResult)(res.json, resolvedOpts.transformer.output);
					if (!transformed.ok) {
						observer.error(require_TRPCClientError.TRPCClientError.from(transformed.error, { meta: res.meta }));
						return;
					}
					observer.next({
						context: res.meta,
						result: transformed.result
					});
					observer.complete();
				}).catch((err) => {
					isDone = true;
					observer.error(require_TRPCClientError.TRPCClientError.from(err, { meta: _res === null || _res === void 0 ? void 0 : _res.meta }));
				});
				return () => {
					if (!isDone) ac.abort();
				};
			});
		};
	};
}
//#endregion
Object.defineProperty(exports, "dataLoader", {
	enumerable: true,
	get: function() {
		return dataLoader;
	}
});
Object.defineProperty(exports, "httpBatchLink", {
	enumerable: true,
	get: function() {
		return httpBatchLink;
	}
});
