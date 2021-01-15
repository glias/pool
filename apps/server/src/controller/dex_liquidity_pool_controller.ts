import { body, Context, request, responses, summary, tags, description } from 'koa-swagger-decorator';
import { Script } from '../model';
import { dexLiquidityPoolService, DexLiquidityPoolService } from '../service';
import { ScriptSchema, TokenSchema } from './swagger_schema';
import { Server } from '@gliaswap/types';
import { OrderBuilder, CellCollector } from '../service';

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
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
    limit: { type: 'number', required: true },
    skip: { type: 'number', required: true },
  })
  public async getLiquidityPools(ctx: Context): Promise<void> {
    const req = <{ lock: Script; limit: number; skip: number }>ctx.request.body;
    await this.service.getLiquidityPools(req.lock, req.limit, req.skip);
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
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
    poolId: { type: 'string', required: true },
  })
  public async getLiquidityPoolByTypeHash(ctx: Context): Promise<void> {
    console.log(ctx);
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
    console.log(ctx);
  }

  @request('post', '/v1/liquidity-pool/genesis-liquidity')
  @summary('Create genesis liquidity order')
  @description('Create genesis liquidity order')
  @liquidityTag
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenAAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    tokenBAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userLock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
  })
  public async createGenesisLiquidityOrder(ctx: Context): Promise<void> {
    const req = <Server.GenesisLiquidityRequest>ctx.request.body;

    // TODO: ensure req token type script exists
    const orderBuilder = new OrderBuilder(new CellCollector());
    const txWithFee = await orderBuilder.buildGenesisLiquidityOrder(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee;
  }

  @request('post', '/v1/liquidity-pool/add-liquidity')
  @summary('Create add liquidity order')
  @description('Create add liquidity order')
  @liquidityTag
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenADesiredAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenAMinAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    tokenBDesiredAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenBMinAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userLock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
  })
  public async createAddLiquidityOrder(ctx: Context): Promise<void> {
    const req = <Server.AddLiquidityRequest>ctx.request.body;

    // TODO: ensure req token type script exists
    const orderBuilder = new OrderBuilder(new CellCollector());
    const txWithFee = await orderBuilder.buildAddLiquidityOrder(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee;
  }

  @request('post', '/v1/liquidity-pool/remove-liquidity')
  @summary('Create remove liquidity order')
  @description('Create remove liquidity order')
  @liquidityTag
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    liquidityTokenAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenAMinAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    tokenBMinAmount: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userLock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
  })
  public async createRemoveLiquidityOrder(ctx: Context): Promise<void> {
    const req = <Server.RemoveLiquidityRequest>ctx.request.body;

    // TODO: ensure req token type script exists
    const orderBuilder = new OrderBuilder(new CellCollector());
    const txWithFee = await orderBuilder.buildRemoveLiquidityOrder(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee;
  }
}
