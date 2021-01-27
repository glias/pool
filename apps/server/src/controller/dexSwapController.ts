import { body, Context, request, responses, summary, tags, description } from 'koa-swagger-decorator';
import { CKB_TYPE_HASH } from '@gliaswap/constants';

import * as config from '../config';
import { Script } from '../model';
import * as commons from '@gliaswap/commons';
import { dexSwapService, DexSwapService, txBuilder } from '../service';
import { AssetSchema, ScriptSchema, StepSchema, TransactionToSignSchema } from './swaggerSchema';
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
            amountIn: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            amountOut: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
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
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
    ethAddress: { type: 'string', required: true },
    limit: { type: 'number', required: false },
    skip: { type: 'number', required: false },
  })
  public async getSwapOrders(ctx: Context): Promise<void> {
    const req = ctx.request.body;
    const { lock, ethAddress, limit, skip } = req;
    const result = await this.service.orders(cellConver.converScript(lock), ethAddress, limit, skip);
    ctx.status = 200;
    ctx.body = result.map((x) => {
      return {
        transactionHash: x.transactionHash,
        timestamp: x.timestamp,
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
          tx: { type: 'object', properties: (TransactionToSignSchema as any).swaggerDocument, required: true },
          fee: { type: 'string', required: true },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assetInWithAmount: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assetOutWithMinAmount: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tips: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
  })
  public async createSwapOrderTx(ctx: Context): Promise<void> {
    const reqBody = ctx.request.body as commons.GenerateSwapTransactionPayload;
    const { assetInWithAmount, assetOutWithMinAmount, lock, tips } = reqBody;

    if (assetInWithAmount.typeHash != CKB_TYPE_HASH || assetOutWithMinAmount.typeHash != CKB_TYPE_HASH) {
      ctx.throw(400, 'sudt/sudt pool isnt support yet');
    }
    if (assetInWithAmount.balance == undefined || BigInt(assetInWithAmount) == 0n) {
      ctx.throw(400, 'assetInWithAmount balance is zero');
    }

    if (!config.LOCK_DEPS[lock.codeHash]) {
      ctx.throw(400, `unknown user lock code hash: ${lock.codeHash}`);
    }

    const req = {
      tokenInAmount: Token.fromAsset(assetInWithAmount as AssetSchema),
      tokenOutMinAmount: Token.fromAsset(assetOutWithMinAmount as AssetSchema),
      userLock: Script.deserialize(lock),
      tips: Token.fromAsset(tips as AssetSchema),
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
          tx: { type: 'object', properties: (TransactionToSignSchema as any).swaggerDocument, required: true },
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
