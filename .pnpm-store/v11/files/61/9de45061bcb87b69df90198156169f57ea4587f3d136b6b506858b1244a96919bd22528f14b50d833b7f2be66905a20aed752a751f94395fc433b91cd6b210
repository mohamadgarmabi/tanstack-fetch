import { d as mergeWithoutOverrides, u as isObject } from "./codes-D5Ya6_Bi.mjs";
import { n as _objectSpread2, r as _defineProperty } from "./getErrorShape-B0JBUs-i.mjs";
import { _ as defaultFormatter, a as createCallerFactory, d as getDataTransformer, g as getTRPCErrorFromUnknown, l as mergeRouters, m as TRPCError, o as createRouterFactory, u as defaultTransformer } from "./tracked-D4jU_Hb3.mjs";
//#region src/unstable-core-do-not-import/middleware.ts
/** @internal */
const middlewareMarker = "middlewareMarker";
/**
* @internal
*/
function createMiddlewareFactory() {
	function createMiddlewareInner(middlewares) {
		return {
			_middlewares: middlewares,
			unstable_pipe(middlewareBuilderOrFn) {
				const pipedMiddleware = "_middlewares" in middlewareBuilderOrFn ? middlewareBuilderOrFn._middlewares : [middlewareBuilderOrFn];
				return createMiddlewareInner([...middlewares, ...pipedMiddleware]);
			}
		};
	}
	function createMiddleware(fn) {
		return createMiddlewareInner([fn]);
	}
	return createMiddleware;
}
/**
* Create a standalone middleware
* @see https://trpc.io/docs/v11/server/middlewares#experimental-standalone-middlewares
* @deprecated use `.concat()` instead
*/
const experimental_standaloneMiddleware = () => ({ create: createMiddlewareFactory() });
/**
* @internal
* Please note, `trpc-openapi` uses this function.
*/
function createInputMiddleware(parse) {
	const inputMiddleware = async function inputValidatorMiddleware(opts) {
		let parsedInput;
		const rawInput = await opts.getRawInput();
		try {
			parsedInput = await parse(rawInput);
		} catch (cause) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				cause
			});
		}
		const combinedInput = isObject(opts.input) && isObject(parsedInput) ? _objectSpread2(_objectSpread2({}, opts.input), parsedInput) : parsedInput;
		return opts.next({ input: combinedInput });
	};
	inputMiddleware._type = "input";
	return inputMiddleware;
}
/**
* @internal
*/
function createOutputMiddleware(parse) {
	const outputMiddleware = async function outputValidatorMiddleware({ next }) {
		const result = await next();
		if (!result.ok) return result;
		try {
			const data = await parse(result.data);
			return _objectSpread2(_objectSpread2({}, result), {}, { data });
		} catch (cause) {
			throw new TRPCError({
				message: "Output validation failed",
				code: "INTERNAL_SERVER_ERROR",
				cause
			});
		}
	};
	outputMiddleware._type = "output";
	return outputMiddleware;
}
//#endregion
//#region src/vendor/standard-schema-v1/error.ts
/** A schema error with useful information. */
var StandardSchemaV1Error = class extends Error {
	/**
	* Creates a schema error with useful information.
	*
	* @param issues The schema issues.
	*/
	constructor(issues) {
		var _issues$;
		super((_issues$ = issues[0]) === null || _issues$ === void 0 ? void 0 : _issues$.message);
		_defineProperty(this, "issues", void 0);
		this.name = "SchemaError";
		this.issues = issues;
	}
};
//#endregion
//#region src/unstable-core-do-not-import/parser.ts
function getParseFn(procedureParser) {
	const parser = procedureParser;
	const isStandardSchema = "~standard" in parser;
	if (typeof parser === "function" && typeof parser.assert === "function") return parser.assert.bind(parser);
	if (typeof parser === "function" && !isStandardSchema) return parser;
	if (typeof parser.parseAsync === "function") return parser.parseAsync.bind(parser);
	if (typeof parser.parse === "function") return parser.parse.bind(parser);
	if (typeof parser.validateSync === "function") return parser.validateSync.bind(parser);
	if (typeof parser.create === "function") return parser.create.bind(parser);
	if (typeof parser.assert === "function") return (value) => {
		parser.assert(value);
		return value;
	};
	if (isStandardSchema) return async (value) => {
		const result = await parser["~standard"].validate(value);
		if (result.issues) throw new StandardSchemaV1Error(result.issues);
		return result.value;
	};
	throw new Error("Could not find a validator fn");
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/objectWithoutPropertiesLoose.js
function _objectWithoutPropertiesLoose(r, e) {
	if (null == r) return {};
	var t = {};
	for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
		if (e.includes(n)) continue;
		t[n] = r[n];
	}
	return t;
}
//#endregion
//#region \0@oxc-project+runtime@0.149.0/helpers/esm/objectWithoutProperties.js
function _objectWithoutProperties(e, t) {
	if (null == e) return {};
	var o, r, i = _objectWithoutPropertiesLoose(e, t);
	if (Object.getOwnPropertySymbols) {
		var s = Object.getOwnPropertySymbols(e);
		for (r = 0; r < s.length; r++) o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
	}
	return i;
}
//#endregion
//#region src/unstable-core-do-not-import/procedureBuilder.ts
const _excluded = [
	"middlewares",
	"inputs",
	"meta"
];
function createNewBuilder(def1, def2) {
	const { middlewares = [], inputs, meta } = def2, rest = _objectWithoutProperties(def2, _excluded);
	return createBuilder(_objectSpread2(_objectSpread2({}, mergeWithoutOverrides(def1, rest)), {}, {
		inputs: [...def1.inputs, ...inputs !== null && inputs !== void 0 ? inputs : []],
		middlewares: [...def1.middlewares, ...middlewares],
		meta: def1.meta && meta ? _objectSpread2(_objectSpread2({}, def1.meta), meta) : meta !== null && meta !== void 0 ? meta : def1.meta
	}));
}
function createBuilder(initDef = {}) {
	const _def = _objectSpread2({
		procedure: true,
		inputs: [],
		middlewares: []
	}, initDef);
	return {
		_def,
		input(input) {
			const parser = getParseFn(input);
			return createNewBuilder(_def, {
				inputs: [input],
				middlewares: [createInputMiddleware(parser)]
			});
		},
		output(output) {
			const parser = getParseFn(output);
			return createNewBuilder(_def, {
				output,
				middlewares: [createOutputMiddleware(parser)]
			});
		},
		meta(meta) {
			return createNewBuilder(_def, { meta });
		},
		use(middlewareBuilderOrFn) {
			const middlewares = "_middlewares" in middlewareBuilderOrFn ? middlewareBuilderOrFn._middlewares : [middlewareBuilderOrFn];
			return createNewBuilder(_def, { middlewares });
		},
		unstable_concat(builder) {
			return createNewBuilder(_def, builder._def);
		},
		concat(builder) {
			return createNewBuilder(_def, builder._def);
		},
		query(resolver) {
			return createResolver(_objectSpread2(_objectSpread2({}, _def), {}, { type: "query" }), resolver);
		},
		mutation(resolver) {
			return createResolver(_objectSpread2(_objectSpread2({}, _def), {}, { type: "mutation" }), resolver);
		},
		subscription(resolver) {
			return createResolver(_objectSpread2(_objectSpread2({}, _def), {}, { type: "subscription" }), resolver);
		},
		experimental_caller(caller) {
			return createNewBuilder(_def, { caller });
		}
	};
}
function createResolver(_defIn, resolver) {
	const finalBuilder = createNewBuilder(_defIn, {
		resolver,
		middlewares: [async function resolveMiddleware(opts) {
			const data = await resolver(opts);
			return {
				marker: middlewareMarker,
				ok: true,
				data,
				ctx: opts.ctx
			};
		}]
	});
	const _def = _objectSpread2(_objectSpread2({}, finalBuilder._def), {}, {
		type: _defIn.type,
		experimental_caller: Boolean(finalBuilder._def.caller),
		meta: finalBuilder._def.meta,
		$types: null
	});
	const invoke = createProcedureCaller(finalBuilder._def);
	const callerOverride = finalBuilder._def.caller;
	if (!callerOverride) return invoke;
	const callerWrapper = async (...args) => {
		return await callerOverride({
			args,
			invoke,
			_def
		});
	};
	callerWrapper._def = _def;
	return callerWrapper;
}
const codeblock = `
This is a client-only function.
If you want to call this function on the server, see https://trpc.io/docs/v11/server/server-side-calls
`.trim();
async function callRecursive(index, _def, opts) {
	try {
		const middleware = _def.middlewares[index];
		return await middleware(_objectSpread2(_objectSpread2({}, opts), {}, {
			meta: _def.meta,
			input: opts.input,
			next(_nextOpts) {
				var _nextOpts$getRawInput;
				const nextOpts = _nextOpts;
				return callRecursive(index + 1, _def, _objectSpread2(_objectSpread2({}, opts), {}, {
					ctx: (nextOpts === null || nextOpts === void 0 ? void 0 : nextOpts.ctx) ? _objectSpread2(_objectSpread2({}, opts.ctx), nextOpts.ctx) : opts.ctx,
					input: nextOpts && "input" in nextOpts ? nextOpts.input : opts.input,
					getRawInput: (_nextOpts$getRawInput = nextOpts === null || nextOpts === void 0 ? void 0 : nextOpts.getRawInput) !== null && _nextOpts$getRawInput !== void 0 ? _nextOpts$getRawInput : opts.getRawInput
				}));
			}
		}));
	} catch (cause) {
		return {
			ok: false,
			error: getTRPCErrorFromUnknown(cause),
			marker: middlewareMarker
		};
	}
}
function createProcedureCaller(_def) {
	async function procedure(opts) {
		if (!opts || !("getRawInput" in opts)) throw new Error(codeblock);
		const result = await callRecursive(0, _def, opts);
		if (!result) throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "No result from middlewares - did you forget to `return next()`?"
		});
		if (!result.ok) throw result.error;
		return result.data;
	}
	procedure._def = _def;
	procedure.procedure = true;
	procedure.meta = _def.meta;
	return procedure;
}
//#endregion
//#region src/unstable-core-do-not-import/rootConfig.ts
var _globalThis$process;
var _globalThis$process2;
var _globalThis$process3;
/**
* The default check to see if we're in a server
*/
const isServerDefault = typeof window === "undefined" || "Deno" in window || ((_globalThis$process = globalThis.process) === null || _globalThis$process === void 0 || (_globalThis$process = _globalThis$process.env) === null || _globalThis$process === void 0 ? void 0 : _globalThis$process["NODE_ENV"]) === "test" || !!((_globalThis$process2 = globalThis.process) === null || _globalThis$process2 === void 0 || (_globalThis$process2 = _globalThis$process2.env) === null || _globalThis$process2 === void 0 ? void 0 : _globalThis$process2["JEST_WORKER_ID"]) || !!((_globalThis$process3 = globalThis.process) === null || _globalThis$process3 === void 0 || (_globalThis$process3 = _globalThis$process3.env) === null || _globalThis$process3 === void 0 ? void 0 : _globalThis$process3["VITEST_WORKER_ID"]);
/**
* Builder to initialize the tRPC root object - use this exactly once per backend
* @see https://trpc.io/docs/v11/quickstart
*/
const initTRPC = new class TRPCBuilder {
	/**
	* Add a context shape as a generic to the root object
	* @see https://trpc.io/docs/v11/server/context
	*/
	context() {
		return new TRPCBuilder();
	}
	/**
	* Add a meta shape as a generic to the root object
	* @see https://trpc.io/docs/v11/quickstart
	*/
	meta() {
		return new TRPCBuilder();
	}
	/**
	* Create the root object
	* @see https://trpc.io/docs/v11/server/routers#initialize-trpc
	*/
	create(opts) {
		var _opts$transformer, _opts$isDev, _globalThis$process, _opts$allowOutsideOfS, _opts$errorFormatter, _opts$isServer;
		const config = _objectSpread2(_objectSpread2({}, opts), {}, {
			transformer: getDataTransformer((_opts$transformer = opts === null || opts === void 0 ? void 0 : opts.transformer) !== null && _opts$transformer !== void 0 ? _opts$transformer : defaultTransformer),
			isDev: (_opts$isDev = opts === null || opts === void 0 ? void 0 : opts.isDev) !== null && _opts$isDev !== void 0 ? _opts$isDev : ((_globalThis$process = globalThis.process) === null || _globalThis$process === void 0 ? void 0 : _globalThis$process.env["NODE_ENV"]) !== "production",
			allowOutsideOfServer: (_opts$allowOutsideOfS = opts === null || opts === void 0 ? void 0 : opts.allowOutsideOfServer) !== null && _opts$allowOutsideOfS !== void 0 ? _opts$allowOutsideOfS : false,
			errorFormatter: (_opts$errorFormatter = opts === null || opts === void 0 ? void 0 : opts.errorFormatter) !== null && _opts$errorFormatter !== void 0 ? _opts$errorFormatter : defaultFormatter,
			isServer: (_opts$isServer = opts === null || opts === void 0 ? void 0 : opts.isServer) !== null && _opts$isServer !== void 0 ? _opts$isServer : isServerDefault,
			/**
			* These are just types, they can't be used at runtime
			* @internal
			*/
			$types: null
		});
		var _opts$isServer2;
		if (!((_opts$isServer2 = opts === null || opts === void 0 ? void 0 : opts.isServer) !== null && _opts$isServer2 !== void 0 ? _opts$isServer2 : isServerDefault) && (opts === null || opts === void 0 ? void 0 : opts.allowOutsideOfServer) !== true) throw new Error(`You're trying to use @trpc/server in a non-server environment. This is not supported by default.`);
		return {
			/**
			* Your router config
			* @internal
			*/
			_config: config,
			/**
			* Builder object for creating procedures
			* @see https://trpc.io/docs/v11/server/procedures
			*/
			procedure: createBuilder({ meta: opts === null || opts === void 0 ? void 0 : opts.defaultMeta }),
			/**
			* Create reusable middlewares
			* @see https://trpc.io/docs/v11/server/middlewares
			*/
			middleware: createMiddlewareFactory(),
			/**
			* Create a router
			* @see https://trpc.io/docs/v11/server/routers
			*/
			router: createRouterFactory(config),
			/**
			* Merge Routers
			* @see https://trpc.io/docs/v11/server/merging-routers
			*/
			mergeRouters,
			/**
			* Create a server-side caller for a router
			* @see https://trpc.io/docs/v11/server/server-side-calls
			*/
			createCallerFactory: createCallerFactory()
		};
	}
}();
//#endregion
export { StandardSchemaV1Error as a, createOutputMiddleware as c, getParseFn as i, experimental_standaloneMiddleware as l, isServerDefault as n, createInputMiddleware as o, createBuilder as r, createMiddlewareFactory as s, initTRPC as t, middlewareMarker as u };

//# sourceMappingURL=initTRPC-B259os3T.mjs.map