import { Context } from 'koa';
import { txBuilder } from './';
import { QueryOptions } from '@ckb-lumos/base';
import { Cell, PoolInfoHolder, ScriptBuilder, Token } from '../model';
import { DexOrderChainFactory, ORDER_TYPE } from '../model/orders/dexOrderChainFactory';
import { DexOrderChain, OrderHistory } from '../model/orders/dexOrderChain';

import { CellInfoSerializationHolderFactory, PoolInfo, Script, TokenHolderFactory } from '../model';
import { CKB_TOKEN_TYPE_HASH, SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE } from '../config';
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
    const infoCell = await this.getLiquidityPoolByPoolId(poolId);
    const factory = new DexOrderChainFactory(ORDER_TYPE.LIQUIDITY, infoCell);
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
    for (const type of PoolInfo.getTypeScripts()) {
      const queryOptions: QueryOptions = {
        lock: {
          script: {
            code_hash: PoolInfo.LOCK_CODE_HASH,
            hash_type: PoolInfo.LOCK_HASH_TYPE,
            args: '0x',
          },
          argsLen: 'any',
        },
        type: type.toLumosScript(),
        order: 'desc',
      };

      const infoCells = await this.dexRepository.collectCells(queryOptions, false);
      if (infoCells.length === 0) {
        continue;
      }

      poolInfos.push(this.toPoolInfo(infoCells[infoCells.length - 1], type));
    }

    return new PoolInfoHolder(poolInfos);
  }

  toPoolInfo(infoCell: Cell, type: Script): PoolInfo {
    const argsData = CellInfoSerializationHolderFactory.getInstance()
      .getInfoCellSerialization()
      .decodeData(infoCell.data);
    const sudtType = PoolInfo.getSudtSymbol(infoCell);
    const tokenB = TokenHolderFactory.getInstance().getTokenBySymbol(sudtType);
    tokenB.balance = argsData.sudtReserve.toString();

    // Prevent modification to the same tokenA
    const tokenA = TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH);
    tokenA.balance = argsData.ckbReserve.toString();
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
