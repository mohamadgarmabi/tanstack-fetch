import { n as _objectSpread2 } from "../../getErrorShape-B0JBUs-i.mjs";
import { t as resolveResponse } from "../../resolveResponse-JtMyT9TQ.mjs";
import { i as incomingMessageToRequest } from "../../node-http-BUlb5EdB.mjs";
import { n as getWSConnectionHandler, r as handleKeepAlive } from "../../ws-C7ZOJJeA.mjs";
//#region src/adapters/fastify/fastifyRequestHandler.ts
async function fastifyRequestHandler(opts) {
	const createContext = async (innerOpts) => {
		var _opts$createContext;
		return await ((_opts$createContext = opts.createContext) === null || _opts$createContext === void 0 ? void 0 : _opts$createContext.call(opts, _objectSpread2(_objectSpread2({}, opts), innerOpts)));
	};
	const incomingMessage = opts.req.raw;
	if ("body" in opts.req) incomingMessage.body = opts.req.body;
	const req = incomingMessageToRequest(incomingMessage, opts.res.raw, { maxBodySize: null });
	const res = await resolveResponse(_objectSpread2(_objectSpread2({}, opts), {}, {
		req,
		error: null,
		createContext,
		onError(o) {
			var _opts$onError;
			opts === null || opts === void 0 || (_opts$onError = opts.onError) === null || _opts$onError === void 0 || _opts$onError.call(opts, _objectSpread2(_objectSpread2({}, o), {}, { req: opts.req }));
		}
	}));
	await opts.res.send(res);
}
//#endregion
//#region src/adapters/fastify/fastifyTRPCPlugin.ts
function fastifyTRPCPlugin(fastify, opts, done) {
	var _opts$prefix;
	fastify.removeContentTypeParser("application/json");
	fastify.addContentTypeParser("application/json", { parseAs: "string" }, function(_, body, _done) {
		_done(null, body);
	});
	fastify.removeContentTypeParser("multipart/form-data");
	fastify.addContentTypeParser("multipart/form-data", {}, function(_, body, _done) {
		_done(null, body);
	});
	let prefix = (_opts$prefix = opts.prefix) !== null && _opts$prefix !== void 0 ? _opts$prefix : "";
	if (typeof fastifyTRPCPlugin.default !== "function") prefix = "";
	fastify.all(`${prefix}/:path`, async (req, res) => {
		const path = req.params.path;
		await fastifyRequestHandler(_objectSpread2(_objectSpread2({}, opts.trpcOptions), {}, {
			req,
			res,
			path
		}));
	});
	if (opts.useWSS) {
		var _prefix;
		const trpcOptions = opts.trpcOptions;
		const onConnection = getWSConnectionHandler(_objectSpread2({}, trpcOptions));
		fastify.get((_prefix = prefix) !== null && _prefix !== void 0 ? _prefix : "/", { websocket: true }, (socket, req) => {
			var _trpcOptions$keepAliv;
			onConnection(socket, req.raw);
			if (trpcOptions === null || trpcOptions === void 0 || (_trpcOptions$keepAliv = trpcOptions.keepAlive) === null || _trpcOptions$keepAliv === void 0 ? void 0 : _trpcOptions$keepAliv.enabled) {
				const { pingMs, pongWaitMs } = trpcOptions.keepAlive;
				handleKeepAlive(socket, pingMs, pongWaitMs);
			}
		});
	}
	done();
}
//#endregion
export { fastifyRequestHandler, fastifyTRPCPlugin };

//# sourceMappingURL=index.mjs.map