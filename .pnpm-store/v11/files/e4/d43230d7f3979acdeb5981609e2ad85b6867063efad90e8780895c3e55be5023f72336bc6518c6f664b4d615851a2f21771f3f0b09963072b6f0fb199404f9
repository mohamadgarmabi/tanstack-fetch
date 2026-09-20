import { a as assert, c as isAsyncIterable, d as mergeWithoutOverrides, f as noop, i as abortSignalsAnyPonyfill, l as isFunction, m as sleep, n as TRPC_ERROR_CODES_BY_NUMBER, o as emptyObject, p as run, r as retryableRpcCodes, s as identity, t as TRPC_ERROR_CODES_BY_KEY, u as isObject } from "./codes-D5Ya6_Bi.mjs";
import { a as JSONRPC2_TO_HTTP_CODE, c as getStatusCodeFromKey, d as createRecursiveProxy, i as HTTP_CODE_TO_JSONRPC2, l as getStatusKeyFromCode, o as getHTTPStatusCode, s as getHTTPStatusCodeFromError, t as getErrorShape, u as createFlatProxy } from "./getErrorShape-B0JBUs-i.mjs";
import { _ as defaultFormatter, a as createCallerFactory, c as lazy, d as getDataTransformer, f as transformResult, g as getTRPCErrorFromUnknown, h as getCauseFromUnknown, i as callProcedure, l as mergeRouters, m as TRPCError, n as sse, o as createRouterFactory, p as transformTRPCResponse, r as tracked, s as getProcedureAtPath, t as isTrackedEnvelope, u as defaultTransformer } from "./tracked-D4jU_Hb3.mjs";
import { n as procedureTypes, t as parseTRPCMessage } from "./parseTRPCMessage-MJWDg1vX.mjs";
import { _ as getAcceptHeader, a as isPromise, b as parseConnectionParamsFromUnknown, c as createDeferred, f as makeAsyncResource, g as throwAbortError, h as isAbortError, i as sseStreamProducer, l as iteratorResource, m as Unpromise, n as sseHeaders, o as jsonlStreamConsumer, p as makeResource, r as sseStreamConsumer, s as jsonlStreamProducer, t as resolveResponse, u as takeWithGrace, v as getRequestInfo, y as parseConnectionParamsFromString } from "./resolveResponse-JtMyT9TQ.mjs";
import { t as octetInputParser } from "./contentTypeParsers-KFMy_fwz.mjs";
import { a as StandardSchemaV1Error, c as createOutputMiddleware, i as getParseFn, l as experimental_standaloneMiddleware, n as isServerDefault, o as createInputMiddleware, r as createBuilder, s as createMiddlewareFactory, t as initTRPC, u as middlewareMarker } from "./initTRPC-B259os3T.mjs";
//#region src/unstable-core-do-not-import/http/formDataToObject.ts
const isNumberString = (str) => /^\d+$/.test(str);
function set(obj, path, value) {
	if (path.length > 1) {
		const newPath = [...path];
		const key = newPath.shift();
		const nextKey = newPath[0];
		if (!Object.hasOwn(obj, key)) obj[key] = isNumberString(nextKey) ? [] : emptyObject();
		else if (Array.isArray(obj[key]) && !isNumberString(nextKey)) obj[key] = Object.fromEntries(Object.entries(obj[key]));
		set(obj[key], newPath, value);
		return;
	}
	const p = path[0];
	if (obj[p] === void 0) obj[p] = value;
	else if (Array.isArray(obj[p])) obj[p].push(value);
	else obj[p] = [obj[p], value];
}
function formDataToObject(formData) {
	const obj = emptyObject();
	for (const [key, value] of formData.entries()) set(obj, key.split(/[\.\[\]]/).filter(Boolean), value);
	return obj;
}
//#endregion
export { HTTP_CODE_TO_JSONRPC2, JSONRPC2_TO_HTTP_CODE, StandardSchemaV1Error, TRPCError, TRPC_ERROR_CODES_BY_KEY, TRPC_ERROR_CODES_BY_NUMBER, Unpromise, abortSignalsAnyPonyfill, assert, callProcedure, createBuilder, createCallerFactory, createDeferred, createFlatProxy, createInputMiddleware, createMiddlewareFactory, createOutputMiddleware, createRecursiveProxy, createRouterFactory, defaultFormatter, defaultTransformer, emptyObject, experimental_standaloneMiddleware, formDataToObject, getAcceptHeader, getCauseFromUnknown, getDataTransformer, getErrorShape, getHTTPStatusCode, getHTTPStatusCodeFromError, getParseFn, getProcedureAtPath, getRequestInfo, getStatusCodeFromKey, getStatusKeyFromCode, getTRPCErrorFromUnknown, identity, initTRPC, isAbortError, isAsyncIterable, isFunction, isObject, isPromise, isServerDefault, isTrackedEnvelope, iteratorResource, jsonlStreamConsumer, jsonlStreamProducer, lazy, makeAsyncResource, makeResource, mergeRouters, mergeWithoutOverrides, middlewareMarker, noop, octetInputParser, parseConnectionParamsFromString, parseConnectionParamsFromUnknown, parseTRPCMessage, procedureTypes, resolveResponse, retryableRpcCodes, run, sleep, sse, sseHeaders, sseStreamConsumer, sseStreamProducer, takeWithGrace, throwAbortError, tracked, transformResult, transformTRPCResponse };

//# sourceMappingURL=unstable-core-do-not-import.mjs.map