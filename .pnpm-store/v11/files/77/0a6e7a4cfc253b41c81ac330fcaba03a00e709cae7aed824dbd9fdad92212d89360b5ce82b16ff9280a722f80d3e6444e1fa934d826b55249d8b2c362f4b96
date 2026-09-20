import { t as _objectSpread2 } from "../objectSpread2-weooBxVk.mjs";
import { observable, tap } from "@trpc/server/observable";
//#region src/links/loggerLink.ts
function isFormData(value) {
	if (typeof FormData === "undefined") return false;
	return value instanceof FormData;
}
const palettes = {
	css: {
		query: ["72e3ff", "3fb0d8"],
		mutation: ["c5a3fc", "904dfc"],
		subscription: ["ff49e1", "d83fbe"]
	},
	ansi: {
		regular: {
			query: ["\x1B[30;46m", "\x1B[97;46m"],
			mutation: ["\x1B[30;45m", "\x1B[97;45m"],
			subscription: ["\x1B[30;42m", "\x1B[97;42m"]
		},
		bold: {
			query: ["\x1B[1;30;46m", "\x1B[1;97;46m"],
			mutation: ["\x1B[1;30;45m", "\x1B[1;97;45m"],
			subscription: ["\x1B[1;30;42m", "\x1B[1;97;42m"]
		}
	}
};
function constructPartsAndArgs(opts) {
	const { direction, type, withContext, path, id, input } = opts;
	const parts = [];
	const args = [];
	if (opts.colorMode === "none") parts.push(direction === "up" ? ">>" : "<<", type, `#${id}`, path);
	else if (opts.colorMode === "ansi") {
		const [lightRegular, darkRegular] = palettes.ansi.regular[type];
		const [lightBold, darkBold] = palettes.ansi.bold[type];
		parts.push(direction === "up" ? lightRegular : darkRegular, direction === "up" ? ">>" : "<<", type, direction === "up" ? lightBold : darkBold, `#${id}`, path, "\x1B[0m");
	} else {
		const [light, dark] = palettes.css[type];
		const css = `
    background-color: #${direction === "up" ? light : dark};
    color: ${direction === "up" ? "black" : "white"};
    padding: 2px;
  `;
		parts.push("%c", direction === "up" ? ">>" : "<<", type, `#${id}`, `%c${path}%c`, "%O");
		args.push(css, `${css}; font-weight: bold;`, `${css}; font-weight: normal;`);
	}
	if (direction === "up") args.push(withContext ? {
		input,
		context: opts.context
	} : { input });
	else args.push(_objectSpread2({
		input,
		result: opts.result,
		elapsedMs: opts.elapsedMs
	}, withContext && { context: opts.context }));
	return {
		parts,
		args
	};
}
const defaultLogger = ({ c = console, colorMode = "css", withContext }) => (props) => {
	const rawInput = props.input;
	const input = isFormData(rawInput) ? Object.fromEntries(rawInput) : rawInput;
	const { parts, args } = constructPartsAndArgs(_objectSpread2(_objectSpread2({}, props), {}, {
		colorMode,
		input,
		withContext
	}));
	c[props.direction === "down" && props.result && (props.result instanceof Error || "error" in props.result.result && props.result.result.error) ? "error" : "log"].apply(null, [parts.join(" ")].concat(args));
};
/**
* @see https://trpc.io/docs/v11/client/links/loggerLink
*/
function loggerLink(opts = {}) {
	var _opts$colorMode, _opts$withContext;
	const { enabled = () => true } = opts;
	const colorMode = (_opts$colorMode = opts.colorMode) !== null && _opts$colorMode !== void 0 ? _opts$colorMode : typeof window === "undefined" ? "ansi" : "css";
	const withContext = (_opts$withContext = opts.withContext) !== null && _opts$withContext !== void 0 ? _opts$withContext : colorMode === "css";
	const { logger = defaultLogger({
		c: opts.console,
		colorMode,
		withContext
	}) } = opts;
	return () => {
		return ({ op, next }) => {
			return observable((observer) => {
				if (enabled(_objectSpread2(_objectSpread2({}, op), {}, { direction: "up" }))) logger(_objectSpread2(_objectSpread2({}, op), {}, { direction: "up" }));
				const requestStartTime = Date.now();
				function logResult(result) {
					const elapsedMs = Date.now() - requestStartTime;
					if (enabled(_objectSpread2(_objectSpread2({}, op), {}, {
						direction: "down",
						result
					}))) logger(_objectSpread2(_objectSpread2({}, op), {}, {
						direction: "down",
						elapsedMs,
						result
					}));
				}
				return next(op).pipe(tap({
					next(result) {
						logResult(result);
					},
					error(result) {
						logResult(result);
					}
				})).subscribe(observer);
			});
		};
	};
}
//#endregion
export { loggerLink };

//# sourceMappingURL=loggerLink.mjs.map