import { QueryOptions } from '@ckb-lumos/base';
import { BigNumber } from 'bignumber.js';
import { Context } from 'koa';

import { CKB_TOKEN_TYPE_HASH, SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE } from '../config';
import {
  INFO_LOCK_CODE_HASH,
  INFO_LOCK_HASH_TYPE,
  INFO_TYPE_CODE_HASH,
  INFO_TYPE_HASH_TYPE,
} from '../config/tokenToken';
import {
  Cell,
  PoolInfoHolder,
  ScriptBuilder,
  Token,
  CellInfoSerializationHolderFactory,
  PoolInfo,
  Script,
  TokenHolderFactory,
  PoolInfoFactory,
} from '../model';

import { DexOrderChain, OrderHistory } from '../model/orders/dexOrderChain';
import { DexOrderChainFactory, ORDER_TYPE } from '../model/orders/dexOrderChainFactory';

import { ckbRepository, DexRepository } from '../repository';
import { txBuilder } from '.';

export class DexLiquidityPoolService {
  private readonly dexRepository: DexRepository;
  private readonly txBuilderServiceFactory: txBuilder.TxBuilderServiceFactory;

  constructor(dexRepository?: DexRepository) {
    this.dexRepository = dexRepository ? dexRepository : ckbRepository;
    this.txBuilderServiceFactory = new txBuilder.TxBuilderServiceFactory();
  }

  async getOrders(poolId: string, lock: Script): Promise<OrderHistory[]> {
    const liquidityOrders: DexOrderChain[] = [];
    const infoCell = await this.getLiquidityPoolByPoolId(poolId);
    const factory = new DexOrderChainFactory(lock, ORDER_TYPE.LIQUIDITY, infoCell);
    const orderLock = ScriptBuilder.buildLiquidityOrderLockScript();
    const queryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      type: infoCell.tokenB.typeScript.toLumosScript(),
      order: 'desc',
    };
    const addOrders = await this.dexRepository.collectTransactions(queryOptions, true, true);
    const orders = factory.getOrderChains(queryOptions.lock, infoCell.tokenB.typeScript, addOrders, null);
    orders.forEach((x) => liquidityOrders.push(x));

    const lpTokenTypeScript = new Script(
      infoCell.tokenB.typeScript.codeHash,
      'type',
      infoCell.infoCell.cellOutput.lock.toHash(),
    );
    const removeQueryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      type: lpTokenTypeScript.toLumosScript(),
      order: 'desc',
    };

    const removeTxs = await this.dexRepository.collectTransactions(removeQueryOptions, true, true);
    const removeOrders = factory.getOrderChains(queryOptions.lock, lpTokenTypeScript, removeTxs, null);
    removeOrders.forEach((x) => liquidityOrders.push(x));

    const userLockHash = lock.toHash().slice(2, 66);

    const typeScript = new Script(SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE, infoCell.infoCell.cellOutput.lock.toHash());
    return liquidityOrders
      .filter((x) => x.filterOrderHistory() && x.cell.lock.args.slice(116, 180) === userLockHash)
      .map((x) => {
        const history = x.getOrderHistory();
        const lpToken = new Token(typeScript.toHash());
        lpToken.balance = CellInfoSerializationHolderFactory.getInstance()
          .getSudtCellSerialization()
          .decodeData(x.data)
          .toString();
        history.lpToken = lpToken;
        return history;
      })
      .sort((o1, o2) => parseInt(o1.timestamp) - parseInt(o2.timestamp))
      .reverse();
  }

  async getLiquidityPools(lock?: Script): Promise<PoolInfo[]> {
    const poolInfoHolder = await this.getPoolInfos();
    if (lock === null || lock === undefined) {
      return poolInfoHolder.getPoolInfos();
    }

    const userLiquiditys = await this.getUserPoolInfos(lock, poolInfoHolder);
    return userLiquiditys;
  }

  async getLiquidityPoolByPoolId(poolId: string, lock?: Script): Promise<PoolInfo> {
    const liquidityInfo = await this.getLiquidityPools(lock);
    return liquidityInfo.find((x) => x.poolId === poolId);
  }

  private async getUserPoolInfos(lock: Script, poolInfoHolder: PoolInfoHolder): Promise<PoolInfo[]> {
    const userLiquiditys: PoolInfo[] = [];
    for (const poolInfo of poolInfoHolder.getPoolInfos()) {
      const typeScript = new Script(
        poolInfo.tokenB.typeScript.codeHash,
        'type',
        poolInfo.infoCell.cellOutput.lock.toHash(),
      );
      const userLiquidityCells = await this.getLiquidityCells(lock, typeScript);
      if (userLiquidityCells.length === 0) {
        continue;
      }

      const lpTokenAmount = userLiquidityCells
        .reduce(
          (total, cell) =>
            total + CellInfoSerializationHolderFactory.getInstance().getPoolCellSerialization().decodeData(cell.data),
          BigInt(0),
        )
        .toString();

      poolInfo.lpToken = new Token(
        new Script(SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE, poolInfo.infoCell.cellOutput.lock.toHash()).toHash(),
      );
      poolInfo.lpToken.balance = lpTokenAmount;

      const data = CellInfoSerializationHolderFactory.getInstance()
        .getInfoCellSerialization()
        .decodeData(poolInfo.infoCell.data);

      poolInfo.tokenA.balance = new BigNumber(data.quoteReserve.toString())
        .multipliedBy(lpTokenAmount)
        .div(data.totalLiquidity.toString())
        .toString();

      poolInfo.tokenB.balance = new BigNumber(data.baseReserve.toString())
        .multipliedBy(lpTokenAmount)
        .div(data.totalLiquidity.toString())
        .toString();

      userLiquiditys.push(poolInfo);
    }

    return userLiquiditys;
  }

  private async getLiquidityCells(lock: Script, typeScript: Script) {
    const queryOptions = {
      lock: lock.toLumosScript(),
      type: typeScript.toLumosScript(),
    };

    const userLiquidityCells = await this.dexRepository.collectCells(queryOptions, true, true);
    return userLiquidityCells;
  }

  private async getPoolInfos(): Promise<PoolInfoHolder> {
    const poolInfos: PoolInfo[] = [];
    const infoCells1 = await this.getPoolInfo();
    const infoCells2 = await this.getSudtSudtPoolInfo();
    infoCells2.forEach((x) => infoCells1.push(x));

    infoCells1.forEach((x) => {
      poolInfos.push(this.toPoolInfo(x, x.cellOutput.type));
    });

    return new PoolInfoHolder(poolInfos);
  }

  private async getSudtSudtPoolInfo(): Promise<Cell[]> {
    const queryOptions: QueryOptions = {
      lock: {
        script: {
          code_hash: INFO_LOCK_CODE_HASH,
          hash_type: INFO_LOCK_HASH_TYPE,
          args: '0x',
        },
        argsLen: 'any',
      },
      type: {
        script: {
          code_hash: INFO_TYPE_CODE_HASH,
          hash_type: INFO_TYPE_HASH_TYPE,
          args: '0x',
        },
        argsLen: 'any',
      },
      order: 'desc',
    };

    const infoCells = await this.dexRepository.collectCells(queryOptions, true);
    const infoCellMap: Map<string, Cell> = new Map();
    infoCells.forEach((x) => {
      const quoteBase = PoolInfoFactory.getQuoteBaseByCell(x);
      if (!quoteBase) {
        return;
      }
      const key = `${quoteBase.quoteToken.info.name}:${quoteBase.baseToken.info.name}`;
      if (infoCellMap.has(key)) {
        const cell = infoCellMap.get(key);
        if (BigInt(cell.blockNumber) < BigInt(x.blockNumber)) {
          infoCellMap.set(key, x);
        }
      } else {
        infoCellMap.set(key, x);
      }
    });

    const result = [];
    infoCellMap.forEach((cell, key) => {
      result.push(cell);
    });

    return result;
  }

  private async getPoolInfo(): Promise<Cell[]> {
    const queryOptions: QueryOptions = {
      lock: {
        script: {
          code_hash: PoolInfo.LOCK_CODE_HASH,
          hash_type: PoolInfo.LOCK_HASH_TYPE,
          args: '0x',
        },
        argsLen: 'any',
      },
      type: {
        script: {
          code_hash: PoolInfo.TYPE_CODE_HASH,
          hash_type: PoolInfo.TYPE_HASH_TYPE,
          args: '0x',
        },
        argsLen: 'any',
      },
      order: 'desc',
    };

    const infoCells = await this.dexRepository.collectCells(queryOptions, true);

    const infoCellMap: Map<string, Cell> = new Map();
    infoCells.forEach((x) => {
      const quoteBase = PoolInfoFactory.getQuoteBaseByCell(x);
      const key = `${quoteBase.quoteToken.info.name}:${quoteBase.baseToken.info.name}`;
      if (infoCellMap.has(key)) {
        const cell = infoCellMap.get(key);
        if (BigInt(cell.blockNumber) < BigInt(x.blockNumber)) {
          infoCellMap.set(key, x);
        }
      } else {
        infoCellMap.set(key, x);
      }
    });

    const result = [];
    infoCellMap.forEach((cell, key) => {
      result.push(cell);
    });

    return result;
  }

  toPoolInfo(infoCell: Cell, type: Script): PoolInfo {
    const argsData = CellInfoSerializationHolderFactory.getInstance()
      .getInfoCellSerialization()
      .decodeData(infoCell.data);
    const quoteBase = PoolInfoFactory.getQuoteBaseByCell(infoCell);

    const tokenB = TokenHolderFactory.getInstance().getTokenByTypeHash(quoteBase.baseToken.typeHash);
    tokenB.balance = argsData.baseReserve.toString();

    // Prevent modification to the same tokenA
    const tokenA =
      quoteBase.quoteToken.info.name === 'CKB'
        ? TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH)
        : TokenHolderFactory.getInstance().getTokenByTypeHash(quoteBase.quoteToken.typeHash);
    tokenA.balance = argsData.quoteReserve.toString();
    const poolInfo = new PoolInfo(
      type.toHash(),
      argsData.totalLiquidity.toString(),
      tokenA,
      tokenB,
      infoCell,
      new Token(new Script(SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE, infoCell.cellOutput.lock.toHash()).toHash()),
    );

    return poolInfo;
  }

  public async buildCreateLiquidityPoolTx(
    ctx: Context,
    req: txBuilder.CreateLiquidityPoolRequest,
  ): Promise<txBuilder.CreateLiquidityPoolResponse> {
    const txBuilder = req.isCkbTokenRequest()
      ? this.txBuilderServiceFactory.ckbToken()
      : this.txBuilderServiceFactory.tokenToken();

    return await txBuilder.buildCreateLiquidityPool(ctx, req);
  }

  public async buildGenesisLiquidityRequestTx(
    ctx: Context,
    req: txBuilder.GenesisLiquidityRequest,
  ): Promise<txBuilder.TransactionWithFee> {
    const txBuilder = req.isCkbTokenRequest()
      ? this.txBuilderServiceFactory.ckbToken()
      : this.txBuilderServiceFactory.tokenToken();

    return await txBuilder.buildGenesisLiquidity(ctx, req);
  }

  public async buildAddLiquidityRequestTx(
    ctx: Context,
    req: txBuilder.AddLiquidityRequest,
  ): Promise<txBuilder.TransactionWithFee> {
    const txBuilder = req.isCkbTokenRequest()
      ? this.txBuilderServiceFactory.ckbToken()
      : this.txBuilderServiceFactory.tokenToken();

    return await txBuilder.buildAddLiquidity(ctx, req);
  }

  public async buildRemoveLiquidityRequestTx(
    ctx: Context,
    req: txBuilder.RemoveLiquidityRequest,
  ): Promise<txBuilder.TransactionWithFee> {
    const txBuilder = req.isCkbTokenRequest()
      ? this.txBuilderServiceFactory.ckbToken()
      : this.txBuilderServiceFactory.tokenToken();

    return await txBuilder.buildRemoveLiquidity(ctx, req);
  }

  public async buildCancelRequestTx(ctx: Context, req: txBuilder.CancelRequest): Promise<txBuilder.TransactionWithFee> {
    return await this.txBuilderServiceFactory.cancel().build(ctx, req);
  }
}

export const dexLiquidityPoolService = new DexLiquidityPoolService();
