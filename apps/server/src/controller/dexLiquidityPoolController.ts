import { body, Context, request, responses, summary, tags, description } from 'koa-swagger-decorator';
import { Server } from '@gliaswap/types';

import * as utils from '../utils';
import { cellConver, Script } from '../model';
import { dexLiquidityPoolService, DexLiquidityPoolService } from '../service';
import { ScriptSchema, TokenSchema, TransactionSchema } from './swaggerSchema';

const liquidityTag = tags(['Liquidity']);

export default class DexLiquidityPoolController {
  private readonly service: DexLiquidityPoolService;

  constructor() {
    this.service = dexLiquidityPoolService;
  }

  @request('post', '/v1/liquidity-pool')
  @summary('Get my or all of the liquidity pool')
  @description('Get my or all of the liquidity pool')
  @liquidityTag
  @responses({
    200: {
      description: 'success',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            poolId: { type: 'string', required: true },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tokenA: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tokenB: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
          },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument, required: false },
    limit: { type: 'number', required: true },
    skip: { type: 'number', required: true },
  })
  public async getLiquidityPools(ctx: Context): Promise<void> {
    const req = <{ lock: Script; limit: number; skip: number }>ctx.request.body;
    const result = await this.service.getLiquidityPools(cellConver.converScript(req.lock));
    ctx.status = 200;
    ctx.body = result;
  }

  @request('post', '/v1/liquidity-pool/pool-id')
  @summary('Get LP info of user')
  @description('Get LP info of user')
  @liquidityTag
  @responses({
    200: {
      description: 'success',
      schema: {
        type: 'object',
        properties: {
          poolId: { type: 'string', required: true },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tokenA: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tokenB: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument, required: false },
    poolId: { type: 'string', required: true },
  })
  public async getLiquidityPoolByTypeHash(ctx: Context): Promise<void> {
    const req = <{ lock: Script; poolId: string }>ctx.request.body;
    const result = await this.service.getLiquidityPoolByPoolId(req.poolId, cellConver.converScript(req.lock));
    ctx.status = 200;
    ctx.body = result;
  }

  @request('post', '/v1/liquidity-pool/create')
  @summary('Create liquidity pool tx')
  @description('Create liquidity pool tx')
  @liquidityTag
  @responses({
    200: {
      description: 'success',
      schema: {
        type: 'object',
        properties: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tx: { type: 'object', properties: (TransactionSchema as any).swaggerDocument, required: true },
          fee: { type: 'string', required: true },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lpToken: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenA: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenB: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userLock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
  })
  public async createLiquidityPool(ctx: Context): Promise<void> {
    const reqBody = <Server.CreateLiquidityPoolRequest>ctx.request.body;
    const req = {
      tokenA: utils.deserializeToken(reqBody.tokenA),
      tokenB: utils.deserializeToken(reqBody.tokenB),
      userLock: utils.deserializeScript(reqBody.userLock),
    };
    const resp = await this.service.buildCreateLiquidityPoolTx(ctx, req);

    ctx.status = 200;
    ctx.body = utils.serializeCreateLiquidityPoolResponse(resp);
  }

  @request('post', '/v1/liquidity-pool/orders')
  @summary('Get liquidity orders')
  @description('Get liquidity orders')
  @liquidityTag
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
            amountIn: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            amountOut: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
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
            operation: { type: 'string', required: true },
          },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
    limit: { type: 'number', required: true },
    skip: { type: 'number', required: true },
  })
  public async getOrders(ctx: Context): Promise<void> {
    const req = <{ lock: Script }>ctx.request.body;
    const result = await this.service.getOrders(cellConver.converScript(req.lock));
    ctx.status = 200;
    ctx.body = result;
  }

  @request('post', '/v1/liquidity-pool/orders/genesis-liquidity')
  @summary('Create genesis liquidity order tx')
  @description('Create genesis liquidity order tx')
  @liquidityTag
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
    tokenAAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenBAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userLock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
  })
  public async createGenesisLiquidityOrder(ctx: Context): Promise<void> {
    const reqBody = <Server.GenesisLiquidityRequest>ctx.request.body;
    const req = {
      tokenAAmount: utils.deserializeToken(reqBody.tokenAAmount),
      tokenBAmount: utils.deserializeToken(reqBody.tokenBAmount),
      poolId: reqBody.poolId,
      userLock: utils.deserializeScript(reqBody.userLock),
    };
    const txWithFee = await this.service.buildGenesisLiquidityOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = utils.serializeTransactionWithFee(txWithFee);
  }

  @request('post', '/v1/liquidity-pool/orders/add-liquidity')
  @summary('Create add liquidity order tx')
  @description('Create add liquidity order tx')
  @liquidityTag
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
    tokenADesiredAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenAMinAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenBDesiredAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenBMinAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userLock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
  })
  public async createAddLiquidityOrder(ctx: Context): Promise<void> {
    const reqBody = <Server.AddLiquidityRequest>ctx.request.body;
    const req = {
      tokenADesiredAmount: utils.deserializeToken(reqBody.tokenADesiredAmount),
      tokenAMinAmount: utils.deserializeToken(reqBody.tokenAMinAmount),
      tokenBDesiredAmount: utils.deserializeToken(reqBody.tokenBDesiredAmount),
      tokenBMinAmount: utils.deserializeToken(reqBody.tokenBMinAmount),
      poolId: reqBody.poolId,
      userLock: utils.deserializeScript(reqBody.userLock),
    };
    const txWithFee = await this.service.buildAddLiquidityOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = utils.serializeTransactionWithFee(txWithFee);
  }

  @request('post', '/v1/liquidity-pool/liquidity/remove-liquidity')
  @summary('Create remove liquidity order tx')
  @description('Create remove liquidity order tx')
  @liquidityTag
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
    lpTokenAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenAMinAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenBMinAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userLock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
  })
  public async createRemoveLiquidityOrder(ctx: Context): Promise<void> {
    const reqBody = <Server.RemoveLiquidityRequest>ctx.request.body;
    const req = {
      lpTokenAmount: utils.deserializeToken(reqBody.lpTokenAmount),
      tokenAMinAmount: utils.deserializeToken(reqBody.tokenAMinAmount),
      tokenBMinAmount: utils.deserializeToken(reqBody.tokenBMinAmount),
      poolId: reqBody.poolId,
      userLock: utils.deserializeScript(reqBody.userLock),
    };
    const txWithFee = await this.service.buildRemoveLiquidityOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = utils.serializeTransactionWithFee(txWithFee);
  }

  @request('post', '/v1/liquidity-pool/orders/cancel')
  @summary('Create cancel liquidity order tx')
  @description('Create cancel liquidity order tx')
  @liquidityTag
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
    const reqBody = <Server.CancelOrderRequest>ctx.request.body;
    const req = {
      txHash: reqBody.txHash,
      userLock: utils.deserializeScript(reqBody.userLock),
    };
    const txWithFee = await this.service.buildCancelOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = utils.serializeTransactionWithFee(txWithFee);
  }
}
