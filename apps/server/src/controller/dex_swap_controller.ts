import { body, Context, request, responses, summary, tags, description } from 'koa-swagger-decorator';
import { Server } from '@gliaswap/types';

import { dexSwapService, DexSwapService } from '../service';
import { ScriptSchema, TokenSchema } from './swagger_schema';

const swapTag = tags(['Swap']);

export default class DexSwapController {
  private readonly service: DexSwapService;

  constructor() {
    this.service = dexSwapService;
  }

  @request('post', '/v1/swap/orders')
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

  @request('post', '/v1/swap/orders/cancel')
  @summary('Create cancel swap order tx')
  @description('Create cancel swap order tx')
  @swapTag
  @responses({
    200: {
      description: 'success',
      schema: {
        type: 'object',
        properties: {
          // FIXME: real pw transaction
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pwTransaction: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
          fee: { type: 'string', required: true },
        },
      },
    },
  })
  @body({
    txHash: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userLock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
  })
  public async createCancelOrderTx(ctx: Context): Promise<void> {
    const req = <Server.CancelOrderRequest>ctx.request.body;
    const txWithFee = await this.service.buildCancelOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee;
  }
}
