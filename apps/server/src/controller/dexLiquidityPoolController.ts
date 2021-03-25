import * as commons from '@gliaswap/commons';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import { body, Context, description, request, responses, summary, tags } from 'koa-swagger-decorator';
import { DateTime, Duration } from 'luxon';

import * as config from '../config';
import { cellConver, Script, Token, TokenHolderFactory, TokenHolder, PoolInfo } from '../model';
import { dexLiquidityPoolService, DexLiquidityPoolService, txBuilder } from '../service';
import { AssetSchema, ScriptSchema, StepSchema, TokenSchema, TransactionToSignSchema } from './swaggerSchema';

const liquidityTag = tags(['Liquidity']);
const PENDING_POOL_CREATION_TIMEOUT_MINUTES = 10;

export default class DexLiquidityPoolController {
  private readonly service: DexLiquidityPoolService;
  private readonly tokenHolder: TokenHolder;

  constructor() {
    this.service = dexLiquidityPoolService;
    this.tokenHolder = TokenHolderFactory.getInstance();
  }

  @request('post', '/v1/liquidity-pool-status')
  @summary('match tokenA tokenB')
  @description('match tokenA tokenB')
  @liquidityTag
  @responses({
    200: {
      description: 'success',
      schema: {
        type: 'object',
        properties: {
          poolId: { type: 'string', required: true },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lpToken: { type: 'object', properties: (AssetSchema as any).swaggerDocument, required: false },
          total: { type: 'string', required: true },
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
    tokenAHash: { type: 'string', required: false },
    tokenBHash: { type: 'string', required: false },
  })
  public async poolInfoWithStatus(ctx: Context): Promise<void> {
    const req = <{ tokenAHash: string; tokenBHash: string }>ctx.request.body;
    const infoCell = await this.service.poolInfoWithStatus(req.tokenAHash, req.tokenBHash);
    ctx.status = 200;
    if (infoCell) {
      ctx.body = this.toLiquidityInfo(infoCell);
    } else {
      ctx.body = null;
    }
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
            lpToken: { type: 'object', properties: (AssetSchema as any).swaggerDocument, required: false },
            total: { type: 'string', required: true },
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
    ctx.body = result.map((x) => this.toLiquidityInfo(x));
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
          lpToken: { type: 'object', properties: (AssetSchema as any).swaggerDocument, required: false },
          total: { type: 'string', required: true },
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
    if (result) {
      ctx.body = this.toLiquidityInfo(result);
    } else {
      ctx.body = null;
    }
  }

  private toLiquidityInfo(poolInfo: PoolInfo) {
    if (poolInfo.lpToken) {
      return {
        poolId: poolInfo.poolId,
        lpToken: poolInfo.lpToken,
        total: poolInfo.total,
        assets: [poolInfo.tokenA.toAsset(), poolInfo.tokenB.toAsset()],
        model: 'UNISWAP',
        status: poolInfo.status,
        poolCell: poolInfo.infoCell,
      };
    }
    return {
      poolId: poolInfo.poolId,
      total: poolInfo.total,
      assets: [poolInfo.tokenA.toAsset(), poolInfo.tokenB.toAsset()],
      model: 'UNISWAP',
      status: poolInfo.status,
      poolCell: poolInfo.infoCell,
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
    assets: {
      type: 'array',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: { type: 'object', properties: (AssetSchema as any).swaggerDocument, required: true },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument, required: true },
  })
  public async createLiquidityPool(ctx: Context): Promise<void> {
    const { assets, lock } = ctx.request.body as commons.GenerateCreateLiquidityPoolTransactionPayload;

    if (assets.length != 2) {
      ctx.throw(400, 'only support create pool with two liquidity assets now');
    }
    if (!config.LOCK_DEPS[lock.codeHash]) {
      ctx.throw(400, `unknown user lock code hash: ${lock.codeHash}`);
    }

    const [tokenA, tokenB] = assets.map(
      (asset, idx): Token => {
        if (asset.balance != undefined && BigInt(asset.balance) != 0n) {
          ctx.throw(400, 'create pool dont need asset balance');
        }

        let token = Token.fromAsset(asset as AssetSchema);
        if (token.typeScript == undefined) {
          token = this.tokenHolder.getTokenByTypeHash(asset.typeHash);
        }
        if (!token) {
          ctx.throw(400, `asset ${idx} type hash: ${asset.typeHash} not in token list`);
        }

        return token;
      },
    );

    const livePoolExists = await this.service.poolInfoWithStatus(tokenA.typeHash, tokenB.typeHash);
    if (livePoolExists) {
      ctx.throw(400, 'pool already created');
    }

    if (!(await this.service.lockPool(tokenA.typeHash, tokenB.typeHash))) {
      ctx.throw(500, 'pool lock failed');
    }

    const now = Date.now();
    const pendingPoolCreationDate = await this.service.poolCreationDate(tokenA.typeHash, tokenB.typeHash);
    if (pendingPoolCreationDate) {
      const timeout = PENDING_POOL_CREATION_TIMEOUT_MINUTES * 60 * 1000;
      if (pendingPoolCreationDate + timeout > now) {
        ctx.throw(
          400,
          `The pool is creating, please try again later. eta: ${
            (pendingPoolCreationDate + timeout - now) / 1000
          } minute(s)`,
        );
      }
    }

    this.service.setPoolCreationDate(tokenA.typeHash, tokenB.typeHash, now);

    const req = new txBuilder.CreateLiquidityPoolRequest(tokenA, tokenB, Script.deserialize(lock));
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
            poolId: { type: 'string', required: true },
            transactionHash: { type: 'string', required: true },
            timestamp: { type: 'string', required: true },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tokenA: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tokenB: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
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
            operation: { type: 'string', required: true },
          },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
    poolId: { type: 'string', required: false },
    limit: { type: 'number', required: false },
    skip: { type: 'number', required: false },
  })
  public async getOrders(ctx: Context): Promise<void> {
    const req = <{ poolId: string; lock: Script }>ctx.request.body;
    let result;
    if (!req.poolId) {
      result = await this.service.getBatchOrders(cellConver.converScript(req.lock));
    } else {
      result = await this.service.getOrders(req.poolId, cellConver.converScript(req.lock));
    }

    ctx.status = 200;
    ctx.body = result.map((x) => {
      return {
        poolId: x.poolId,
        lpToken: x.lpToken,
        timestamp: parseInt(x.timestamp, 16),
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
    assets: {
      type: 'array',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
      required: true,
    },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument, required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tips: { type: 'object', properties: (TokenSchema as any).swaggerDocument, required: true },
  })
  public async createGenesisLiquidityOrder(ctx: Context): Promise<void> {
    const { assets, lock, poolId, tips } = ctx.request.body as commons.GenerateGenesisLiquidityTransactionPayload;

    if (assets.length != 2) {
      ctx.throw(400, 'only support adding liquidity to pool with two assets now');
    }
    if (!config.LOCK_DEPS[lock.codeHash]) {
      ctx.throw(400, `unknown user lock code hash: ${lock.codeHash}`);
    }

    const [tokenAAmount, tokenBAmount] = assets.map(
      (asset, idx): Token => {
        if (asset.balance == undefined || BigInt(asset.balance) == 0n) {
          ctx.throw(400, 'asset balance is zero');
        }

        let token = Token.fromAsset(asset as AssetSchema);
        if (token.typeScript == undefined) {
          token = this.tokenHolder.getTokenByTypeHash(asset.typeHash);
        }
        if (!token) {
          ctx.throw(400, `asset ${idx} type hash: ${asset.typeHash} not in token list`);
        }
        token = token.clone();
        token.balance = asset.balance;

        return token;
      },
    );

    const req = new txBuilder.GenesisLiquidityRequest(
      tokenAAmount,
      tokenBAmount,
      poolId,
      Script.deserialize(lock),
      Token.fromAsset(tips as AssetSchema),
    );
    const txWithFee = await this.service.buildGenesisLiquidityRequestTx(ctx, req);

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
      items: { type: 'object', properties: (AssetSchema as any).swaggerDocument, required: true },
    },
    assetsWithMinAmount: {
      type: 'array',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: { type: 'object', properties: (AssetSchema as any).swaggerDocument, required: true },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument, required: true },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tips: { type: 'object', properties: (AssetSchema as any).swaggerDocument, required: true },
  })
  public async createAddLiquidityOrder(ctx: Context): Promise<void> {
    const reqBody = ctx.request.body as commons.GenerateAddLiquidityTransactionPayload;
    const { assetsWithDesiredAmount, assetsWithMinAmount, lock, poolId, tips } = reqBody;
    if (assetsWithDesiredAmount.length != 2 || assetsWithMinAmount.length != 2) {
      ctx.throw(400, 'only support adding liquidity to pool with two assets now');
    }
    if (!config.LOCK_DEPS[lock.codeHash]) {
      ctx.throw(400, `unknown user lock code hash: ${lock.codeHash}`);
    }

    const [tokenA, tokenB] = assetsWithDesiredAmount.map((assetDesire, idx): Token[] => {
      const assetMin = assetsWithMinAmount[idx];
      if (assetDesire.typeHash != assetMin.typeHash) {
        ctx.throw(400, `asset ${idx} type hash mismatch, desired: ${assetDesire.typeHash}, min: ${assetMin.typeHash}`);
      }
      if (assetDesire.balance == undefined || BigInt(assetDesire.balance) == 0n) {
        ctx.throw(400, 'asset ${idx} desired balance is zero');
      }
      if (assetMin.balance == undefined || BigInt(assetMin.balance) == 0n) {
        ctx.throw(400, 'asset ${idx} min balance is zero');
      }

      let tokenDesiredAmount = Token.fromAsset(assetDesire as AssetSchema);
      if (tokenDesiredAmount.typeScript == undefined) {
        tokenDesiredAmount = this.tokenHolder.getTokenByTypeHash(assetDesire.typeHash);
      }
      if (!tokenDesiredAmount) {
        ctx.throw(400, `asset ${idx} type hash: ${assetDesire.typeHash} not in token list`);
      }

      const tokenMinAmount = tokenDesiredAmount.clone();
      tokenDesiredAmount.balance = assetDesire.balance;
      tokenMinAmount.balance = assetMin.balance;

      return [tokenDesiredAmount, tokenMinAmount];
    });

    const [tokenADesiredAmount, tokenAMinAmount] = tokenA;
    const [tokenBDesiredAmount, tokenBMinAmount] = tokenB;

    const req = new txBuilder.AddLiquidityRequest(
      tokenADesiredAmount,
      tokenAMinAmount,
      tokenBDesiredAmount,
      tokenBMinAmount,
      poolId,
      Script.deserialize(lock),
      Token.fromAsset(tips as AssetSchema),
    );
    const txWithFee = await this.service.buildAddLiquidityRequestTx(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee.serialize();
  }

  @request('post', '/v1/liquidity-pool/orders/remove-liquidity')
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
      items: { type: 'object', properties: (AssetSchema as any).swaggerDocument, required: true },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lpToken: { type: 'object', properties: (AssetSchema as any).swaggerDocument, required: true },
    poolId: { type: 'string', required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { type: 'object', properties: (ScriptSchema as any).swaggerDocument, required: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tips: { type: 'object', properties: (AssetSchema as any).swaggerDocument, required: true },
  })
  public async createRemoveLiquidityOrder(ctx: Context): Promise<void> {
    const reqBody = ctx.request.body as commons.GenerateRemoveLiquidityTransactionPayload;
    const { assetsWithMinAmount, lock, lpToken, poolId, tips } = reqBody;

    if (assetsWithMinAmount.length != 2) {
      ctx.throw(400, 'only support removing from pool with two assets now');
    }
    if (lpToken.balance == undefined || BigInt(lpToken.balance) == 0n) {
      ctx.throw(400, 'lp token balance is zero');
    }
    if (!config.LOCK_DEPS[lock.codeHash]) {
      ctx.throw(400, `unknown user lock code hash: ${lock.codeHash}`);
    }

    const [tokenAMinAmount, tokenBMinAmount] = assetsWithMinAmount.map(
      (asset, idx): Token => {
        if (asset.balance == undefined || BigInt(asset.balance) == 0n) {
          ctx.throw(400, `asset ${idx} type hash ${asset.typeHash}'s balance is zero`);
        }

        let token = Token.fromAsset(asset as AssetSchema);
        if (token.typeScript == undefined) {
          token = this.tokenHolder.getTokenByTypeHash(asset.typeHash);
        }
        if (!token) {
          ctx.throw(400, `asset ${idx} type hash: ${asset.typeHash} not in token list`);
        }
        token = token.clone();
        token.balance = asset.balance;

        return token;
      },
    );

    const lpTokenAmount = Token.fromAsset(lpToken as AssetSchema);
    if (!lpTokenAmount.typeScript) {
      const tokenLPTypeScriptBuilder = new txBuilder.TxBuilderServiceFactory().tokenLPTypeScript();
      let hashes = [tokenAMinAmount.typeHash, tokenBMinAmount.typeHash].map((hash) => {
        return hash == CKB_TYPE_HASH ? 'ckb' : hash;
      });
      if (hashes[1] == 'ckb') {
        hashes = [hashes[1], hashes[0]];
      }

      const lpTokenTypeScript = tokenLPTypeScriptBuilder.build(poolId, hashes);
      lpTokenAmount.typeScript = lpTokenTypeScript;
    }

    const req = new txBuilder.RemoveLiquidityRequest(
      lpTokenAmount,
      tokenAMinAmount,
      tokenBMinAmount,
      poolId,
      Script.deserialize(lock),
      Token.fromAsset(tips as AssetSchema),
    );
    const txWithFee = await this.service.buildRemoveLiquidityRequestTx(ctx, req);

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
    const txWithFee = await this.service.buildCancelRequestTx(ctx, req);

    ctx.status = 200;
    ctx.body = txWithFee.serialize();
  }
}
