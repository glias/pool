import { Context } from 'koa';
import { txBuilder } from './';
import { QueryOptions } from '@ckb-lumos/base';
import { Cell, ScriptBuilder, Token } from '../model';
import { DexOrderChainFactory, OrderType } from '../model/orders/dexOrderChainFactory';
import { DexOrderChain, OrderHistory, ORDER_STATUS } from '../model/orders/dexOrderChain';

import { CellInfoSerializationHolderFactory, PoolInfo, Script, TokenHolderFactory } from '../model';
import {
  CKB_TOKEN_TYPE_HASH,
  POOL_INFO_TYPE_SCRIPT,
  INFO_LOCK_CODE_HASH,
  INFO_LOCK_HASH_TYPE,
  POOL_INFO_TYPE_ARGS,
  SUDT_TYPE_CODE_HASH,
  SUDT_TYPE_HASH_TYPE,
} from '../config';
import { ckbRepository, DexRepository } from '../repository';

export class DexLiquidityPoolService {
  private readonly dexRepository: DexRepository;
  private readonly txBuilderService: txBuilder.TxBuilderService;

  constructor(dexRepository?: DexRepository) {
    this.dexRepository = dexRepository ? dexRepository : ckbRepository;
    this.txBuilderService = new txBuilder.TxBuilderService();
  }

  async getOrders(poolId: string, lock: Script): Promise<OrderHistory[]> {
    const liquidityOrders: DexOrderChain[] = [];
    const factory = new DexOrderChainFactory(OrderType.LIQUIDITY);
    const infoCell = await this.getLiquidityPoolByPoolId(poolId);
    const orderLock = ScriptBuilder.buildLiquidityOrderLockScript();
    const queryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      type: infoCell.tokenB.typeScript.toLumosScript(),
      order: 'desc',
    };
    const addOrders = await this.dexRepository.collectTransactions(queryOptions, true);
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

    const removeTxs = await this.dexRepository.collectTransactions(removeQueryOptions, true);
    const removeOrders = factory.getOrderChains(queryOptions.lock, lpTokenTypeScript, removeTxs, null);
    removeOrders.forEach((x) => liquidityOrders.push(x));

    const userLockHash = lock.toHash().slice(2, 66);
    return liquidityOrders
      .filter((x) => x.getStatus() !== ORDER_STATUS.COMPLETED && x.cell.lock.args.slice(116, 180) === userLockHash)
      .map((x) => x.getOrderHistory())
      .sort((o1, o2) => parseInt(o1.timestamp) - parseInt(o2.timestamp))
      .reverse();
  }

  async getLiquidityPools(lock?: Script): Promise<PoolInfo[]> {
    const poolInfos = await this.getPoolInfos();
    if (lock === null || lock === undefined) {
      return poolInfos;
    }

    const userLiquiditys = await this.getUserPoolInfos(lock, poolInfos);
    return userLiquiditys;
  }

  async getLiquidityPoolByPoolId(poolId: string, lock?: Script): Promise<PoolInfo> {
    const liquidityInfo = await this.getLiquidityPools(lock);
    return liquidityInfo.find((x) => x.poolId === poolId);
  }

  private async getUserPoolInfos(lock: Script, poolInfos: PoolInfo[]): Promise<PoolInfo[]> {
    const userLiquiditys: PoolInfo[] = [];
    for (const poolInfo of poolInfos) {
      const typeScript = new Script(
        poolInfo.tokenB.typeScript.codeHash,
        'type',
        poolInfo.infoCell.cellOutput.lock.toHash(),
      );
      const queryOptions = {
        lock: lock.toLumosScript(),
        type: typeScript.toLumosScript(),
      };

      const userLiquidityCells = await this.dexRepository.collectCells(queryOptions);
      if (userLiquidityCells.length === 0) {
        continue;
      }

      const ckbBalance = userLiquidityCells.reduce(
        (total, cell) => total + BigInt(cell.cellOutput.capacity),
        BigInt(0),
      );
      poolInfo.tokenA.balance = ckbBalance.toString();

      const sudtBalance = userLiquidityCells
        .reduce(
          (total, cell) =>
            total + CellInfoSerializationHolderFactory.getInstance().getSudtCellSerialization().decodeData(cell.data),
          BigInt(0),
        )
        .toString();

      poolInfo.tokenB.balance = sudtBalance;

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

      userLiquiditys.push(poolInfo);
    }

    return userLiquiditys;
  }

  private async getPoolInfos(): Promise<PoolInfo[]> {
    const poolInfos: PoolInfo[] = [];
    for (const type of POOL_INFO_TYPE_SCRIPT) {
      const queryOptions: QueryOptions = {
        lock: {
          script: {
            code_hash: INFO_LOCK_CODE_HASH,
            hash_type: INFO_LOCK_HASH_TYPE,
            args: '0x',
          },
          argsLen: 'any',
        },
        type: type.toLumosScript(),
        order: 'desc',
      };

      const infoCells = await this.dexRepository.collectCells(queryOptions, true);
      if (infoCells.length === 0) {
        continue;
      }

      poolInfos.push(this.toPoolInfo(infoCells[0], type));
    }

    return poolInfos;
  }

  toPoolInfo(infoCell: Cell, type: Script): PoolInfo {
    const argsData = CellInfoSerializationHolderFactory.getInstance()
      .getInfoCellSerialization()
      .decodeData(infoCell.data);
    const sudtType = this.getSudtSymbol(infoCell);
    const tokenB = TokenHolderFactory.getInstance().getTokenBySymbol(sudtType);
    tokenB.balance = argsData.sudtReserve.toString();

    // Prevent modification to the same tokenA
    const tokenA = TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH);
    tokenA.balance = argsData.ckbReserve.toString();
    const poolInfo: PoolInfo = {
      total: argsData.totalLiquidity.toString(),
      lpToken: new Token(
        new Script(SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE, infoCell.cellOutput.lock.toHash()).toHash(),
      ),
      poolId: type.toHash(),
      tokenA: tokenA,
      tokenB: tokenB,
      infoCell: infoCell,
    };
    return poolInfo;
  }

  private getSudtSymbol(poolCell: Cell) {
    let sudtType = '';
    if (POOL_INFO_TYPE_ARGS['GLIA'] === poolCell.cellOutput.type.args) {
      sudtType = 'GLIA';
    }

    if (POOL_INFO_TYPE_ARGS['ckETH'] === poolCell.cellOutput.type.args) {
      sudtType = 'ckETH';
    }

    if (POOL_INFO_TYPE_ARGS['ckDAI'] === poolCell.cellOutput.type.args) {
      sudtType = 'ckDAI';
    }

    if (POOL_INFO_TYPE_ARGS['ckUSDC'] === poolCell.cellOutput.type.args) {
      sudtType = 'ckUSDC';
    }

    if (POOL_INFO_TYPE_ARGS['ckUSDT'] === poolCell.cellOutput.type.args) {
      sudtType = 'ckUSDT';
    }
    return sudtType;
  }

  public async buildCreateLiquidityPoolTx(
    ctx: Context,
    req: txBuilder.CreateLiquidityPoolRequest,
  ): Promise<txBuilder.CreateLiquidityPoolResponse> {
    return await this.txBuilderService.buildCreateLiquidityPool(ctx, req);
  }

  public async buildGenesisLiquidityOrderTx(
    ctx: Context,
    req: txBuilder.GenesisLiquidityRequest,
  ): Promise<txBuilder.TransactionWithFee> {
    return await this.txBuilderService.buildGenesisLiquidity(ctx, req);
  }

  public async buildAddLiquidityOrderTx(
    ctx: Context,
    req: txBuilder.AddLiquidityRequest,
  ): Promise<txBuilder.TransactionWithFee> {
    return await this.txBuilderService.buildAddLiquidity(ctx, req);
  }

  public async buildRemoveLiquidityOrderTx(
    ctx: Context,
    req: txBuilder.RemoveLiquidityRequest,
  ): Promise<txBuilder.TransactionWithFee> {
    return await this.txBuilderService.buildRemoveLiquidity(ctx, req);
  }

  public async buildCancelOrderTx(
    ctx: Context,
    req: txBuilder.CancelOrderRequest,
  ): Promise<txBuilder.TransactionWithFee> {
    return await this.txBuilderService.buildCancelOrder(ctx, req);
  }
}

export const dexLiquidityPoolService = new DexLiquidityPoolService();
