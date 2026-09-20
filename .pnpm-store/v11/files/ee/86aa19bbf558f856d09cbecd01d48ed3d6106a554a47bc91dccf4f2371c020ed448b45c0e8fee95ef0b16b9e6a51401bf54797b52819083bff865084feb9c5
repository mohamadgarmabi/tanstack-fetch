const require_objectSpread2 = require("./objectSpread2-D-dJi1gK.cjs");
let _trpc_server_unstable_core_do_not_import = require("@trpc/server/unstable-core-do-not-import");
//#region src/TRPCClientError.ts
function isTRPCClientError(cause) {
	return cause instanceof TRPCClientError;
}
function isTRPCErrorResponse(obj) {
	return (0, _trpc_server_unstable_core_do_not_import.isObject)(obj) && (0, _trpc_server_unstable_core_do_not_import.isObject)(obj["error"]) && typeof obj["error"]["code"] === "number" && typeof obj["error"]["message"] === "string";
}
function getMessageFromUnknownError(err, fallback) {
	if (typeof err === "string") return err;
	if ((0, _trpc_server_unstable_core_do_not_import.isObject)(err) && typeof err["message"] === "string") return err["message"];
	return fallback;
}
var TRPCClientError = class TRPCClientError extends Error {
	constructor(message, opts) {
		var _opts$result, _opts$result2;
		const cause = opts === null || opts === void 0 ? void 0 : opts.cause;
		super(message, { cause });
		require_objectSpread2._defineProperty(this, "cause", void 0);
		require_objectSpread2._defineProperty(this, "shape", void 0);
		require_objectSpread2._defineProperty(this, "data", void 0);
		require_objectSpread2._defineProperty(this, "meta", void 0);
		this.meta = opts === null || opts === void 0 ? void 0 : opts.meta;
		this.cause = cause;
		this.shape = opts === null || opts === void 0 || (_opts$result = opts.result) === null || _opts$result === void 0 ? void 0 : _opts$result.error;
		this.data = opts === null || opts === void 0 || (_opts$result2 = opts.result) === null || _opts$result2 === void 0 ? void 0 : _opts$result2.error.data;
		this.name = "TRPCClientError";
		Object.setPrototypeOf(this, TRPCClientError.prototype);
	}
	static from(_cause, opts = {}) {
		const cause = _cause;
		if (isTRPCClientError(cause)) {
			if (opts.meta) cause.meta = require_objectSpread2._objectSpread2(require_objectSpread2._objectSpread2({}, cause.meta), opts.meta);
			return cause;
		}
		if (isTRPCErrorResponse(cause)) return new TRPCClientError(cause.error.message, require_objectSpread2._objectSpread2(require_objectSpread2._objectSpread2({}, opts), {}, {
			result: cause,
			cause: opts.cause
		}));
		return new TRPCClientError(getMessageFromUnknownError(cause, "Unknown error"), require_objectSpread2._objectSpread2(require_objectSpread2._objectSpread2({}, opts), {}, { cause }));
	}
};
//#endregion
Object.defineProperty(exports, "TRPCClientError", {
	enumerable: true,
	get: function() {
		return TRPCClientError;
	}
});
Object.defineProperty(exports, "isTRPCClientError", {
	enumerable: true,
	get: function() {
		return isTRPCClientError;
	}
});
