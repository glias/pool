import * as commons from '@gliaswap/commons';
import { body, Context, description, request, responses, summary, tags } from 'koa-swagger-decorator';

import * as config from '../config';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import { cellConver, Script, Token, TokenHolderFactory, TokenHolder } from '../model';
import { dexLiquidityPoolService, DexLiquidityPoolService, txBuilder } from '../service';
import { AssetSchema, ScriptSchema, TokenSchema, TransactionToSignSchema } from './swaggerSchema';

const liquidityTag = tags(['Liquidity']);

export default class DexLiquidityPoolController {
  private readonly service: DexLiquidityPoolService;
  private readonly tokenHolder: TokenHolder;

  constructor() {
    this.service = dexLiquidityPoolService;
    this.tokenHolder = TokenHolderFactory.getInstance();
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
            assets: {
              type: 'array',
              items: {
                type: 'object',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                properties: (AssetSchema as any).swaggerDocument,
              },
            },
            model: { type: 'string', required: true },
          },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument, required: false },
    limit: { type: 'number', required: false },
    skip: { type: 'number', required: false },
  })
  public async getLiquidityPools(ctx: Context): Promise<void> {
    const req = <{ lock: Script; limit: number; skip: number }>ctx.request.body;
    const result = await this.service.getLiquidityPools(cellConver.converScript(req.lock));
    ctx.status = 200;
    ctx.body = result.map((x) => {
      return {
        poolId: x.poolId,
        assets: [x.tokenA.toAsset(), x.tokenB.toAsset()],
        model: 'UNISWAP',
      };
    });
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
          assets: {
            type: 'array',
            items: {
              type: 'object',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              properties: (AssetSchema as any).swaggerDocument,
            },
          },
          model: { type: 'string', required: true },
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
    ctx.body = {
      poolId: result.poolId,
      assets: [result.tokenA.toAsset(), result.tokenB.toAsset()],
      model: 'UNISWAP',
    };
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
          tx: { type: 'object', properties: (TransactionToSignSchema as any).swaggerDocument, required: true },
          fee: { type: 'string', required: true },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lpToken: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assets: { type: 'array', items: { type: 'object', properties: (AssetSchema as any).swaggerDocument } },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
  })
  public async createLiquidityPool(ctx: Context): Promise<void> {
    const { assets, lock } = ctx.request.body as commons.GenerateCreateLiquidityPoolTransactionPayload;

    if (assets.length != 2) {
      ctx.throw(400, 'only support create pool with two liquidity assets now');
    }
    assets.forEach((asset, idx) => {
      if (!this.tokenHolder.getTokenByTypeHash(asset.typeHash)) {
        ctx.throw(400, `asset ${idx} type hash: ${asset.typeHash} not in token list`);
      }
      if (asset.balance != undefined || BigInt(asset.balance) != 0n) {
        ctx.throw(400, 'create pool dont need asset balance');
      }
    });
    if (!config.LOCK_DEPS[lock.codeHash]) {
      ctx.throw(400, `unknown user lock code hash: ${lock.codeHash}`);
    }

    const [assetA, assetB] = assets;
    if (assetA.typeHash != CKB_TYPE_HASH && assetB.typeHash != CKB_TYPE_HASH) {
      ctx.throw(400, 'pool without ckb isnt support yet');
    }

    const req = {
      tokenA: Token.fromAsset(assetA as AssetSchema),
      tokenB: Token.fromAsset(assetB as AssetSchema),
      userLock: Script.deserialize(lock),
    };
    const resp = await this.service.buildCreateLiquidityPoolTx(ctx, req);

    ctx.status = 200;
    ctx.body = resp.serialize();
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
            tokenA: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tokenB: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
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
    ctx.body = result.map((x) => {
      return {
        transactionHash: x.transactionHash,
        tokenA: x.amountIn.toAsset(),
        tokenB: x.amountOut.toAsset(),
        stage: x.stage,
        type: x.type,
      };
    });
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
          tx: { type: 'object', properties: (TransactionToSignSchema as any).swaggerDocument, required: true },
          fee: { type: 'string', required: true },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assets: { type: 'array', items: { type: 'object', properties: (AssetSchema as any).swaggerDocument } },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tips: { type: 'object', properties: (TokenSchema as any).swaggerDocument },
  })
  public async createGenesisLiquidityOrder(ctx: Context): Promise<void> {
    const { assets, lock, poolId, tips } = ctx.request.body as commons.GenerateGenesisLiquidityTransactionPayload;

    if (assets.length != 2) {
      ctx.throw(400, 'only support adding liquidity to pool with two assets now');
    }
    assets.forEach((asset, idx) => {
      if (!this.tokenHolder.getTokenByTypeHash(asset.typeHash)) {
        ctx.throw(400, `asset ${idx} type hash: ${asset.typeHash} not in token list`);
      }
      if (asset.balance == undefined || BigInt(asset.balance) == 0n) {
        ctx.throw(400, 'asset balance is zero');
      }
    });
    if (!config.LOCK_DEPS[lock.codeHash]) {
      ctx.throw(400, `unknown user lock code hash: ${lock.codeHash}`);
    }

    const [assetAAmount, assetBAmount] = assets;
    if (assetAAmount.typeHash != CKB_TYPE_HASH && assetBAmount.typeHash != CKB_TYPE_HASH) {
      ctx.throw(400, 'pool without ckb isnt support yet');
    }

    const req = {
      tokenAAmount: Token.fromAsset(assetAAmount as AssetSchema),
      tokenBAmount: Token.fromAsset(assetBAmount as AssetSchema),
      poolId: poolId,
      userLock: Script.deserialize(lock),
      tips: Token.fromAsset(tips as AssetSchema),
    };
    const txWithFee = await this.service.buildGenesisLiquidityOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee.serialize();
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
          tx: { type: 'object', properties: (TransactionToSignSchema as any).swaggerDocument, required: true },
          fee: { type: 'string', required: true },
        },
      },
    },
  })
  @body({
    assetsWithDesiredAmount: {
      type: 'array',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
    },
    assetsWithMinAmount: {
      type: 'array',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tips: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
  })
  public async createAddLiquidityOrder(ctx: Context): Promise<void> {
    const reqBody = ctx.request.body as commons.GenerateAddLiquidityTransactionPayload;
    const { assetsWithDesiredAmount, assetsWithMinAmount, lock, poolId, tips } = reqBody;
    if (assetsWithDesiredAmount.length != 2 || assetsWithMinAmount.length != 2) {
      ctx.throw(400, 'only support adding liquidity to pool with two assets now');
    }
    assetsWithDesiredAmount.forEach((assetDesire, idx) => {
      const assetMin = assetsWithMinAmount[idx];
      if (assetDesire.typeHash != assetMin.typeHash) {
        ctx.throw(400, `asset ${idx} type hash mismatch, desired: ${assetDesire.typeHash}, min: ${assetMin.typeHash}`);
      }
      if (!this.tokenHolder.getTokenByTypeHash(assetDesire.typeHash)) {
        ctx.throw(400, `asset ${idx} type hash: ${assetDesire.typeHash} not in token list`);
      }
      if (assetDesire.balance == undefined || BigInt(assetDesire.balance) == 0n) {
        ctx.throw(400, 'asset balance is zero');
      }
    });
    if (!config.LOCK_DEPS[lock.codeHash]) {
      ctx.throw(400, `unknown user lock code hash: ${lock.codeHash}`);
    }

    const [assetAWithDesiredAmount, assetBWithDesiredAmount] = assetsWithDesiredAmount;
    const [assetAWithMinAmount, assetBWithMinAmount] = assetsWithMinAmount;

    if (assetAWithMinAmount.typeHash != CKB_TYPE_HASH && assetBWithDesiredAmount.typeHash != CKB_TYPE_HASH) {
      ctx.throw(400, 'pool without ckb isnt support yet');
    }

    const req = {
      tokenADesiredAmount: Token.fromAsset(assetAWithDesiredAmount as AssetSchema),
      tokenAMinAmount: Token.fromAsset(assetAWithMinAmount as AssetSchema),
      tokenBDesiredAmount: Token.fromAsset(assetBWithDesiredAmount as AssetSchema),
      tokenBMinAmount: Token.fromAsset(assetBWithMinAmount as AssetSchema),
      poolId,
      userLock: Script.deserialize(lock),
      tips: Token.fromAsset(tips as AssetSchema),
    };
    const txWithFee = await this.service.buildAddLiquidityOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee.serialize();
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
          tx: { type: 'object', properties: (TransactionToSignSchema as any).swaggerDocument, required: true },
          fee: { type: 'string', required: true },
        },
      },
    },
  })
  @body({
    assetsWithMinAmount: {
      type: 'array',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lpToken: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tips: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
  })
  public async createRemoveLiquidityOrder(ctx: Context): Promise<void> {
    const reqBody = ctx.request.body as commons.GenerateRemoveLiquidityTransactionPayload;
    const { assetsWithMinAmount, lock, lpToken, poolId, tips } = reqBody;

    if (assetsWithMinAmount.length != 2) {
      ctx.throw(400, 'only support removing from pool with two assets now');
    }
    assetsWithMinAmount.forEach((asset, idx) => {
      if (!this.tokenHolder.getTokenByTypeHash(asset.typeHash)) {
        ctx.throw(400, `asset ${idx} type hash: ${asset.typeHash} not in token list`);
      }
    });
    if (lpToken.balance == undefined || BigInt(lpToken.balance) == 0n) {
      ctx.throw(400, 'lp token balance is zero');
    }
    if (!config.LOCK_DEPS[lock.codeHash]) {
      ctx.throw(400, `unknown user lock code hash: ${lock.codeHash}`);
    }

    const [assetAWithMinAmount, assetBWithMinAmount] = assetsWithMinAmount;
    if (assetAWithMinAmount.typeHash != CKB_TYPE_HASH && assetBWithMinAmount.typeHash != CKB_TYPE_HASH) {
      ctx.throw(400, 'pool without ckb isnt support yet');
    }

    const req = {
      lpTokenAmount: Token.fromAsset(lpToken as AssetSchema),
      tokenAMinAmount: Token.fromAsset(assetAWithMinAmount as AssetSchema),
      tokenBMinAmount: Token.fromAsset(assetBWithMinAmount as AssetSchema),
      poolId: poolId,
      userLock: Script.deserialize(lock),
      tips: Token.fromAsset(tips as AssetSchema),
    };
    const txWithFee = await this.service.buildRemoveLiquidityOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee.serialize();
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
          tx: { type: 'object', properties: (TransactionToSignSchema as any).swaggerDocument, required: true },
          fee: { type: 'string', required: true },
        },
      },
    },
  })
  @body({
    txHash: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument, required: true },
  })
  public async createCancelOrderTx(ctx: Context): Promise<void> {
    const { txHash, lock } = ctx.request.body as commons.GenerateCancelRequestTransactionPayload;

    if (!config.LOCK_DEPS[lock.codeHash]) {
      ctx.throw(400, `unknown user lock code hash: ${lock.codeHash}`);
    }

    const req = {
      txHash,
      userLock: Script.deserialize(lock),
      requestType: txBuilder.CancelRequestType.Liquidity,
    };
    const txWithFee = await this.service.buildCancelOrderTx(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee.serialize();
  }
}
