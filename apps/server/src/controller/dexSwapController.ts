import { body, Context, request, responses, summary, tags, description } from 'koa-swagger-decorator';

import { Script } from '../model';
import { dexSwapService, DexSwapService, txBuilder } from '../service';
import { ScriptSchema, StepSchema, TokenSchema, TransactionSchema } from './swaggerSchema';
import { cellConver, Token } from '../model';

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
              type: 'object',
              properties: {
                status: { type: 'string', required: true },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    properties: (StepSchema as any).swaggerDocument,
                  },
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
    const req = ctx.request.body;
    const { lock, limit, skip } = req;
    const result = await this.service.orders(cellConver.converScript(lock), limit, skip);
    ctx.status = 200;
    ctx.body = result.map((x) => {
      return {
        transactionHash: x.transactionHash,
        amountIn: x.amountIn.toAsset(),
        amountOut: x.amountOut.toAsset(),
        stage: x.stage,
        type: x.type,
      };
    });
  }

  @request('post', '/v1/swap/orders/swap')
  @summary('Create swap order tx')
  @description('Create swap order tx')
  @swapTag
  @responses({
    200: {
      description: 'success',
      schema: {
        type: 'object',
        properties: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tx: { type: 'object', properties: (TransactionSchema as any).swaggerDocument, required: true },
          fee: { type: 'string', required: true },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenInAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenOutMinAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userLock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tips: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
  })
  public async createSwapOrderTx(ctx: Context): Promise<void> {
    const reqBody = <txBuilder.SwapOrderRequest>ctx.request.body;
    const req = {
      tokenInAmount: Token.deserialize(reqBody.tokenInAmount),
      tokenOutMinAmount: Token.deserialize(reqBody.tokenOutMinAmount),
      userLock: Script.deserialize(reqBody.userLock),
      tips: Token.deserialize(reqBody.tips),
    };

    const txWithFee = await this.service.buildSwapOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee.serialize();
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tx: { type: 'object', properties: (TransactionSchema as any).swaggerDocument, required: true },
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
    const reqBody = <txBuilder.CancelOrderRequest>ctx.request.body;
    const req: txBuilder.CancelOrderRequest = {
      txHash: reqBody.txHash,
      userLock: Script.deserialize(reqBody.userLock),
      requestType: txBuilder.CancelRequestType.Swap,
    };

    const txWithFee = await this.service.buildCancelOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee.serialize();
  }
}
