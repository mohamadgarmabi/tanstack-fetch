import { observable } from "@trpc/server/observable";
//#region src/links/internals/createChain.ts
/** @internal */
function createChain(opts) {
	return observable((observer) => {
		function execute(index = 0, op = opts.op) {
			const next = opts.links[index];
			if (!next) throw new Error("No more links to execute - did you forget to add an ending link?");
			return next({
				op,
				next(nextOp) {
					return execute(index + 1, nextOp);
				}
			});
		}
		return execute().subscribe(observer);
	});
}
//#endregion
//#region src/links/splitLink.ts
function asArray(value) {
	return Array.isArray(value) ? value : [value];
}
function splitLink(opts) {
	return (runtime) => {
		const yes = asArray(opts.true).map((link) => link(runtime));
		const no = asArray(opts.false).map((link) => link(runtime));
		return (props) => {
			return observable((observer) => {
				const links = opts.condition(props.op) ? yes : no;
				return createChain({
					op: props.op,
					links
				}).subscribe(observer);
			});
		};
	};
}
//#endregion
export { createChain as n, splitLink as t };

//# sourceMappingURL=splitLink-BZPioDdG.mjs.map