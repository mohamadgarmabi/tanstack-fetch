import { r as _defineProperty } from "../getErrorShape-B0JBUs-i.mjs";
import { g as getTRPCErrorFromUnknown, m as TRPCError } from "../tracked-D4jU_Hb3.mjs";
import { formDataToObject } from "../unstable-core-do-not-import.mjs";
import * as nextNavigation from "next/navigation";
//#region src/adapters/next-app-dir/redirect.ts
/**
* @internal
*/
var TRPCRedirectError = class extends TRPCError {
	constructor(url, redirectType) {
		super({
			code: "UNPROCESSABLE_CONTENT",
			message: `Redirect error to "${url}" that will be handled by Next.js`
		});
		_defineProperty(this, "args", void 0);
		this.args = [url.toString(), redirectType];
	}
};
/**
* Like `next/navigation`'s `redirect()` but throws a `TRPCError` that later will be handled by Next.js
* This provides better typesafety than the `next/navigation`'s `redirect()` since the action continues
* to execute on the frontend even if Next's `redirect()` has a return type of `never`.
* @public
* @remark You should only use this if you're also using `nextAppDirCaller`.
*/
const redirect = (url, redirectType) => {
	return new TRPCRedirectError(url, redirectType);
};
//#endregion
//#region src/adapters/next-app-dir/rethrowNextErrors.ts
/**
* @remarks The helpers from `next/dist/client/components/*` has been removed in Next.js 15.
* Inlining them here instead...
* @see https://github.com/vercel/next.js/blob/5ae286ffd664e5c76841ed64f6e2da85a0835922/packages/next/src/client/components/redirect.ts#L97-L123
*/
const REDIRECT_ERROR_CODE = "NEXT_REDIRECT";
function isRedirectError(error) {
	if (typeof error !== "object" || error === null || !("digest" in error) || typeof error.digest !== "string") return false;
	const [errorCode, type, destination, status] = error.digest.split(";", 4);
	const statusCode = Number(status);
	return errorCode === REDIRECT_ERROR_CODE && (type === "replace" || type === "push") && typeof destination === "string" && !isNaN(statusCode);
}
/**
* @remarks The helpers from `next/dist/client/components/*` has been removed in Next.js 15.
* Inlining them here instead...
* @see https://github.com/vercel/next.js/blob/5ae286ffd664e5c76841ed64f6e2da85a0835922/packages/next/src/client/components/not-found.ts#L33-L39
*/
const NOT_FOUND_ERROR_CODE = "NEXT_NOT_FOUND";
function isNotFoundError(error) {
	if (typeof error !== "object" || error === null || !("digest" in error)) return false;
	return error.digest === NOT_FOUND_ERROR_CODE;
}
/**
* Rethrow errors that should be handled by Next.js
*/
const rethrowNextErrors = (error) => {
	if (error.code === "NOT_FOUND") nextNavigation.notFound();
	if (error instanceof TRPCRedirectError) nextNavigation.redirect(...error.args);
	const { cause } = error;
	if ("unstable_rethrow" in nextNavigation && typeof nextNavigation.unstable_rethrow === "function") nextNavigation.unstable_rethrow(cause);
	if (isRedirectError(cause) || isNotFoundError(cause)) throw cause;
};
//#endregion
//#region src/adapters/next-app-dir/nextAppDirCaller.ts
/**
* Create a caller that works with Next.js React Server Components & Server Actions
*/
function nextAppDirCaller(config) {
	const { normalizeFormData = true } = config;
	const createContext = async () => {
		var _config$createContext, _config$createContext2;
		return (_config$createContext = config === null || config === void 0 || (_config$createContext2 = config.createContext) === null || _config$createContext2 === void 0 ? void 0 : _config$createContext2.call(config)) !== null && _config$createContext !== void 0 ? _config$createContext : {};
	};
	return async (opts) => {
		var _config$pathExtractor, _config$pathExtractor2;
		const path = (_config$pathExtractor = (_config$pathExtractor2 = config.pathExtractor) === null || _config$pathExtractor2 === void 0 ? void 0 : _config$pathExtractor2.call(config, { meta: opts._def.meta })) !== null && _config$pathExtractor !== void 0 ? _config$pathExtractor : "";
		const ctx = await createContext().catch((cause) => {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create context",
				cause
			});
		});
		const handleError = (cause) => {
			var _config$onError;
			const error = getTRPCErrorFromUnknown(cause);
			(_config$onError = config.onError) === null || _config$onError === void 0 || _config$onError.call(config, {
				ctx,
				error,
				input: opts.args[0],
				path,
				type: opts._def.type
			});
			rethrowNextErrors(error);
			throw error;
		};
		switch (opts._def.type) {
			case "mutation": {
				/**
				* When you wrap an action with useFormState, it gets an extra argument as its first argument.
				* The submitted form data is therefore its second argument instead of its first as it would usually be.
				* The new first argument that gets added is the current state of the form.
				* @see https://react.dev/reference/react-dom/hooks/useFormState#my-action-can-no-longer-read-the-submitted-form-data
				*/
				let input = opts.args.length === 1 ? opts.args[0] : opts.args[1];
				if (normalizeFormData && input instanceof FormData) input = formDataToObject(input);
				return await opts.invoke({
					type: opts._def.type,
					ctx,
					getRawInput: async () => input,
					path,
					input,
					signal: void 0,
					batchIndex: 0
				}).then((data) => {
					if (data instanceof TRPCRedirectError) throw data;
					return data;
				}).catch(handleError);
			}
			case "query": {
				const input = opts.args[0];
				return await opts.invoke({
					type: opts._def.type,
					ctx,
					getRawInput: async () => input,
					path,
					input,
					signal: void 0,
					batchIndex: 0
				}).then((data) => {
					if (data instanceof TRPCRedirectError) throw data;
					return data;
				}).catch(handleError);
			}
			default: throw new TRPCError({
				code: "NOT_IMPLEMENTED",
				message: `Not implemented for type ${opts._def.type}`
			});
		}
	};
}
//#endregion
//#region src/adapters/next-app-dir/notFound.ts
/**
* Like `next/navigation`'s `notFound()` but throws a `TRPCError` that later will be handled by Next.js
* @public
*/
const notFound = () => {
	throw new TRPCError({ code: "NOT_FOUND" });
};
//#endregion
export { nextAppDirCaller as experimental_nextAppDirCaller, notFound as experimental_notFound, redirect as experimental_redirect, rethrowNextErrors };

//# sourceMappingURL=next-app-dir.mjs.map