import { body, Context, request, responses, summary, tags, description } from 'koa-swagger-decorator';
import { ScriptSchema, TokenSchema } from './swagger_schema';

const swapTag = tags(['Swap']);

export default class DexTokenController {
  @request('post', '​/v1​/swap​/orders')
  @summary('Get swap orders')
  @description('Get swap orders')
  @swapTag
  @responses({
    200: {
      description: 'success',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            transactionHash: { type: 'string', required: true },
            timestamp: { type: 'string', required: true },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            amountIn: { tyep: 'object', properties: (TokenSchema as any).swaggerDocument },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            amountOut: { tyep: 'object', properties: (TokenSchema as any).swaggerDocument },
            stage: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step: { type: 'string', required: true },
                  message: { type: 'string', required: true },
                  data: { type: 'string', required: true },
                },
              },
            },
            type: { type: 'string', required: true },
          },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { tyep: 'object', properties: (ScriptSchema as any).swaggerDocument },
    limit: { type: 'number', required: true },
    skip: { type: 'number', required: true },
  })
  public async getSwapOrders(ctx: Context): Promise<void> {
    console.log(ctx);
  }
}
