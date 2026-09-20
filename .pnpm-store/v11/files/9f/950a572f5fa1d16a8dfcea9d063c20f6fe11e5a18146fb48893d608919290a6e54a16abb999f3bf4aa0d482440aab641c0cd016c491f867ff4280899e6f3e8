import { Cn as TRPCRequestInfo, J as AnyRouter, _n as HTTPBaseHandlerOptions, ft as inferRouterContext, yt as CreateContextCallback } from "../../unstable-core-do-not-import-B9ZnrQAU.cjs";
import { APIGatewayProxyEvent, APIGatewayProxyEventV2, APIGatewayProxyResult, APIGatewayProxyStructuredResultV2, Context, StreamifyHandler } from "aws-lambda";
//#region src/adapters/aws-lambda/getPlanner.d.ts
type LambdaEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;
/** 1:1 mapping of v1 or v2 input events, deduces which is which.
 * @internal
 **/
type inferAPIGWReturn<TEvent> = TEvent extends APIGatewayProxyEvent ? APIGatewayProxyResult : TEvent extends APIGatewayProxyEventV2 ? APIGatewayProxyStructuredResultV2 : never;
//#endregion
//#region src/adapters/aws-lambda/index.d.ts
export type CreateAWSLambdaContextOptions<TEvent extends LambdaEvent> = {
  event: TEvent;
  context: Context;
  info: TRPCRequestInfo;
};
export type AWSLambdaOptions<TRouter extends AnyRouter, TEvent extends LambdaEvent> = HTTPBaseHandlerOptions<TRouter, TEvent> & CreateContextCallback<inferRouterContext<AnyRouter>, AWSLambdaCreateContextFn<TRouter, TEvent>>;
export type AWSLambdaCreateContextFn<TRouter extends AnyRouter, TEvent extends LambdaEvent> = ({ event, context, info }: CreateAWSLambdaContextOptions<TEvent>) => inferRouterContext<TRouter> | Promise<inferRouterContext<TRouter>>;
export declare function awsLambdaRequestHandler<TRouter extends AnyRouter, TEvent extends LambdaEvent>(opts: AWSLambdaOptions<TRouter, TEvent>): (event: TEvent, context: Context) => Promise<inferAPIGWReturn<TEvent>>;
export declare function awsLambdaStreamingRequestHandler<TRouter extends AnyRouter, TEvent extends LambdaEvent>(opts: AWSLambdaOptions<TRouter, TEvent>): StreamifyHandler<TEvent>;
//#endregion
//# sourceMappingURL=index.d.cts.map