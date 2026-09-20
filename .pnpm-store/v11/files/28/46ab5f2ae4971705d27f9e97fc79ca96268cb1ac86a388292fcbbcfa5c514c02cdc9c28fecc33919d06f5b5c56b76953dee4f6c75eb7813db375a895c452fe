import { J as AnyRouter, _n as HTTPBaseHandlerOptions } from "../../unstable-core-do-not-import-B9ZnrQAU.cjs";
import { o as NodeHTTPCreateContextFnOptions, s as NodeHTTPCreateContextOption } from "../../index-BHatz_Pu.cjs";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
//#region src/adapters/fastify/fastifyRequestHandler.d.ts
export type FastifyHandlerOptions<TRouter extends AnyRouter, TRequest extends FastifyRequest, TResponse extends FastifyReply> = HTTPBaseHandlerOptions<TRouter, TRequest> & NodeHTTPCreateContextOption<TRouter, TRequest, TResponse>;
type FastifyRequestHandlerOptions<TRouter extends AnyRouter, TRequest extends FastifyRequest, TResponse extends FastifyReply> = FastifyHandlerOptions<TRouter, TRequest, TResponse> & {
  req: TRequest;
  res: TResponse;
  path: string;
};
export declare function fastifyRequestHandler<TRouter extends AnyRouter, TRequest extends FastifyRequest, TResponse extends FastifyReply>(opts: FastifyRequestHandlerOptions<TRouter, TRequest, TResponse>): Promise<void>;
//#endregion
//#region src/adapters/fastify/fastifyTRPCPlugin.d.ts
export interface FastifyTRPCPluginOptions<TRouter extends AnyRouter> {
  prefix?: string;
  useWSS?: boolean;
  trpcOptions: FastifyHandlerOptions<TRouter, FastifyRequest, FastifyReply>;
}
export type CreateFastifyContextOptions = NodeHTTPCreateContextFnOptions<FastifyRequest, FastifyReply>;
export declare function fastifyTRPCPlugin<TRouter extends AnyRouter>(fastify: FastifyInstance, opts: FastifyTRPCPluginOptions<TRouter>, done: (err?: Error) => void): void;
//#endregion
//# sourceMappingURL=index.d.cts.map