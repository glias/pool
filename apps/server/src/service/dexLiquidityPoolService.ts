import { QueryOptions, ScriptWrapper } from '@ckb-lumos/base';
import { BigNumber } from 'bignumber.js';
import { Context } from 'koa';
import { DateTime } from 'luxon';

import { dexCache } from '../cache';
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
  scriptEquals,
  CellOutput,
  TransactionWithStatus,
} from '../model';

import { DexOrderChain, OrderHistory } from '../model/orders/dexOrderChain';
import { DexOrderChainFactory, ORDER_TYPE } from '../model/orders/dexOrderChainFactory';

import { ckbRepository, DexRepository } from '../repository';
import { txBuilder } from '.';

export class DexLiquidityPoolService {
  private readonly dexRepository: DexRepository;
  private readonly txBuilderServiceFactory: txBuilder.TxBuilderServiceFactory;
  private readonly blockNumber = `0x${Number(1379791).toString(16)}`;

  constructor(dexRepository?: DexRepository) {
    this.dexRepository = dexRepository ? dexRepository : ckbRepository;
    this.txBuilderServiceFactory = new txBuilder.TxBuilderServiceFactory();
  }

  async poolInfoWithStatus(tokenAHash: string, tokenBHash: string): Promise<PoolInfo> {
    const pendingCells = await this.getPendingInfo();
    const poolInfos = [];
    pendingCells.forEach((x) => {
      poolInfos.push(this.toPoolInfo(x, x.cellOutput.type));
    });

    const poolInfo = poolInfos.find((x) => {
      const hashes1 = PoolInfoFactory.sortTypeHash(tokenAHash, tokenBHash);
      const hashes2 = PoolInfoFactory.sortTypeHash(x.tokenA.typeHash, x.tokenB.typeHash);

      if (hashes1[0] === hashes2[0] && hashes1[1] === hashes2[1]) {
        return true;
      }

      return false;
    });

    return poolInfo;
  }

  async getBatchOrders(lock: Script): Promise<OrderHistory[]> {
    const liquidityOrders: OrderHistory[] = [];
    const orderLock1 = ScriptBuilder.buildLiquidityOrderLockScript();
    const removeQueryOptions1: QueryOptions = {
      lock: {
        script: orderLock1.toLumosScript(),
        argsLen: 'any',
      },
      order: 'desc',
      fromBlock: this.blockNumber,
    };

    const orderLock2 = ScriptBuilder.buildSudtSudtLiquidityOrderLockScript();
    const removeQueryOptions2: QueryOptions = {
      lock: {
        script: orderLock2.toLumosScript(),
        argsLen: 'any',
      },
      order: 'desc',
      fromBlock: this.blockNumber,
    };

    const infoPools = await this.getLiquidityPools();

    const userLockHash = lock.toHash().slice(2, 66);
    const removeTxs1 = await this.dexRepository.collectTransactions(removeQueryOptions1, true, true);
    const removeTxs2 = await this.dexRepository.collectTransactions(removeQueryOptions2, true, true);
    const infoCells = await this.getLiquidityPools();
    infoCells.forEach((x) => {
      const factory = new DexOrderChainFactory(lock, ORDER_TYPE.LIQUIDITY, x, infoCells);
      const lpTokenTypeScript = new Script(x.tokenB.typeScript.codeHash, 'type', x.infoCell.cellOutput.lock.toHash());
      const orders1 = factory.getOrderChains(removeQueryOptions1.lock, lpTokenTypeScript, removeTxs1, null);
      const orders2 = factory.getOrderChains(removeQueryOptions2.lock, lpTokenTypeScript, removeTxs2, null);
      orders1.forEach((x) => orders2.push(x));

      const typeScript = new Script(SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE, x.infoCell.cellOutput.lock.toHash());
      orders2
        .filter(
          (x) =>
            x.filterOrderHistory() &&
            (x.cell.lock.args.slice(116, 180) === userLockHash || x.cell.lock.args.slice(66, 130) === userLockHash),
        )
        .forEach((x) => {
          const history = x.getOrderHistory();
          const lpToken = new Token(typeScript.toHash());
          lpToken.balance = CellInfoSerializationHolderFactory.getInstance()
            .getSudtCellSerialization()
            .decodeData(x.data)
            .toString();
          history.lpToken = lpToken;
          liquidityOrders.push(history);
        });
    });

    const addOrders = await this.batchAddOrder(lock);
    addOrders.forEach((x) => liquidityOrders.push(x));

    return liquidityOrders.sort((o1, o2) => parseInt(o1.timestamp) - parseInt(o2.timestamp)).reverse();
  }

  async batchAddOrder(lock: Script): Promise<OrderHistory[]> {
    const liquidityOrders: OrderHistory[] = [];
    const orderLock1 = ScriptBuilder.buildLiquidityOrderLockScript();
    const queryOptions1: QueryOptions = {
      lock: {
        script: orderLock1.toLumosScript(),
        argsLen: 'any',
      },
      order: 'desc',
      fromBlock: this.blockNumber,
    };

    const orderLock2 = ScriptBuilder.buildSudtSudtLiquidityOrderLockScript();
    const queryOptions2: QueryOptions = {
      lock: {
        script: orderLock2.toLumosScript(),
        argsLen: 'any',
      },
      order: 'desc',
      fromBlock: this.blockNumber,
    };

    const userLockHash = lock.toHash().slice(2, 66);
    const addOrders1 = await this.dexRepository.collectTransactions(queryOptions1, true, true);
    const addOrders2 = await this.dexRepository.collectTransactions(queryOptions2, true, true);
    const infoCells = await this.getLiquidityPools();
    infoCells.forEach((x) => {
      const factory = new DexOrderChainFactory(lock, ORDER_TYPE.LIQUIDITY, x, infoCells);
      const orders1 = factory.getOrderChains(queryOptions1.lock, x.tokenB.typeScript, addOrders1, null);
      const orders2 = factory.getOrderChains(queryOptions2.lock, x.tokenB.typeScript, addOrders2, null);
      orders1.forEach((x) => orders2.push(x));

      const typeScript = new Script(SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE, x.infoCell.cellOutput.lock.toHash());
      orders2
        .filter(
          (x) =>
            x.filterOrderHistory() &&
            (x.cell.lock.args.slice(116, 180) === userLockHash || x.cell.lock.args.slice(66, 130) === userLockHash),
        )
        .forEach((x) => {
          const history = x.getOrderHistory();
          const lpToken = new Token(typeScript.toHash());
          lpToken.balance = CellInfoSerializationHolderFactory.getInstance()
            .getSudtCellSerialization()
            .decodeData(x.data)
            .toString();
          history.lpToken = lpToken;
          liquidityOrders.push(history);
        });
    });

    return liquidityOrders;
  }

  async getOrders(poolId: string, lock: Script): Promise<OrderHistory[]> {
    const liquidityOrders: DexOrderChain[] = [];
    const infoCell = await this.getLiquidityPoolByPoolId(poolId);
    const infoCells = await this.getLiquidityPools();
    const orderLock = this.getOrderLock(infoCell);
    const factory = new DexOrderChainFactory(lock, ORDER_TYPE.LIQUIDITY, infoCell, infoCells);

    const queryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      type: infoCell.tokenB.typeScript.toLumosScript(),
      order: 'desc',
      fromBlock: this.blockNumber,
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
      fromBlock: this.blockNumber,
    };

    const removeTxs = await this.dexRepository.collectTransactions(removeQueryOptions, true, true);
    const removeOrders = factory.getOrderChains(queryOptions.lock, lpTokenTypeScript, removeTxs, null);
    removeOrders.forEach((x) => liquidityOrders.push(x));

    const userLockHash = lock.toHash().slice(2, 66);

    const typeScript = new Script(SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE, infoCell.infoCell.cellOutput.lock.toHash());
    return liquidityOrders
      .filter(
        (x) =>
          x.filterOrderHistory() &&
          (x.cell.lock.args.slice(116, 180) === userLockHash || x.cell.lock.args.slice(66, 130) === userLockHash),
      )
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

  private getOrderLock(infoCell: PoolInfo): Script {
    const tokens = PoolInfoFactory.getTokensByCell(infoCell.infoCell);
    if (!tokens.isSudtSudt()) {
      return ScriptBuilder.buildLiquidityOrderLockScript();
    }

    return ScriptBuilder.buildSudtSudtLiquidityOrderLockScript();
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

    return userLiquidityCells.filter((x) => BigInt(x.blockNumber) > BigInt(this.blockNumber));
  }

  private async getPoolInfos(): Promise<PoolInfoHolder> {
    const poolInfos: PoolInfo[] = [];
    const infoCells1 = await this.getPoolInfo();
    const infoCells2 = await this.getSudtSudtPoolInfo();
    // const infoCells3 = await this.getPendingInfo();

    infoCells2.forEach((x) => infoCells1.push(x));
    // infoCells3.forEach((x) => infoCells1.push(x));

    infoCells1.forEach((x) => {
      poolInfos.push(this.toPoolInfo(x, x.cellOutput.type));
    });

    return new PoolInfoHolder(poolInfos);
  }

  private async getPendingInfo(): Promise<Cell[]> {
    const poolTxs = await this.dexRepository.getPoolTxs();
    const result = [];

    const ckbLock: ScriptWrapper = {
      script: {
        code_hash: PoolInfo.LOCK_CODE_HASH,
        hash_type: PoolInfo.LOCK_HASH_TYPE,
        args: '0x',
      },
      argsLen: 'any',
    };
    const ckbType: ScriptWrapper = {
      script: {
        code_hash: PoolInfo.TYPE_CODE_HASH,
        hash_type: PoolInfo.TYPE_HASH_TYPE,
        args: '0x',
      },
      argsLen: 'any',
    };
    const sudtLock: ScriptWrapper = {
      script: {
        code_hash: INFO_LOCK_CODE_HASH,
        hash_type: INFO_LOCK_HASH_TYPE,
        args: '0x',
      },
      argsLen: 'any',
    };
    const sudtType: ScriptWrapper = {
      script: {
        code_hash: INFO_TYPE_CODE_HASH,
        hash_type: INFO_TYPE_HASH_TYPE,
        args: '0x',
      },
      argsLen: 'any',
    };

    for (const tx of poolTxs) {
      for (let i = 0; i < tx.transaction.outputs.length; i++) {
        const cell = tx.transaction.outputs[i];
        if (!cell.type) {
          continue;
        }

        if (
          scriptEquals.matchLockScriptWapper(ckbLock, cell.lock) &&
          scriptEquals.matchTypeScriptWapper(ckbType, cell.type)
        ) {
          result.push(this.buildPendingCell(cell, tx, i));
        }

        if (
          scriptEquals.matchLockScriptWapper(sudtLock, cell.lock) &&
          scriptEquals.matchTypeScriptWapper(sudtType, cell.type)
        ) {
          result.push(this.buildPendingCell(cell, tx, i));
        }
      }
    }

    return result;
  }

  private buildPendingCell(cellOutput: CellOutput, tx: TransactionWithStatus, i: number): Cell {
    return {
      cellOutput: {
        capacity: cellOutput.capacity,
        lock: cellOutput.lock,
        type: cellOutput.type,
      },
      outPoint: {
        txHash: tx.transaction.hash,
        index: `0x${i.toString(16)}`,
      },
      blockHash: tx.txStatus.blockHash,
      blockNumber: '0',
      data: tx.transaction.outputsData[i],
    };
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
      fromBlock: this.blockNumber,
    };

    const infoCells = await this.dexRepository.collectCells(queryOptions, false);
    const infoCellMap: Map<string, Cell> = new Map();
    infoCells.forEach((x) => {
      const tokens = PoolInfoFactory.getTokensByCell(x);
      if (!tokens) {
        return;
      }
      const key = `${tokens.tokenA.info.name}:${tokens.tokenB.info.name}`;
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
    for (const cell of infoCellMap.values()) {
      result.push(cell);
    }

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
      fromBlock: this.blockNumber,
      order: 'desc',
    };

    const infoCells = await this.dexRepository.collectCells(queryOptions, false);

    const infoCellMap: Map<string, Cell> = new Map();
    infoCells.forEach((x) => {
      const tokens = PoolInfoFactory.getTokensByCell(x);
      const key = `${tokens.tokenA.info.name}:${tokens.tokenB.info.name}`;
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
    for (const cell of infoCellMap.values()) {
      result.push(cell);
    }

    return result;
  }

  toPoolInfo(infoCell: Cell, type: Script): PoolInfo {
    const argsData = CellInfoSerializationHolderFactory.getInstance()
      .getInfoCellSerialization()
      .decodeData(infoCell.data);
    const tokens = PoolInfoFactory.getTokensByCell(infoCell);

    const tokenB = TokenHolderFactory.getInstance().getTokenByTypeHash(tokens.tokenB.typeHash);
    tokenB.balance = argsData.baseReserve.toString();

    // Prevent modification to the same tokenA
    const tokenA =
      tokens.tokenA.info.name === 'CKB'
        ? TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH)
        : TokenHolderFactory.getInstance().getTokenByTypeHash(tokens.tokenA.typeHash);
    tokenA.balance = argsData.quoteReserve.toString();
    const poolInfo = new PoolInfo(
      type.toHash(),
      argsData.totalLiquidity.toString(),
      tokenA,
      tokenB,
      infoCell,
      new Token(new Script(SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE, infoCell.cellOutput.lock.toHash()).toHash()),
      infoCell.blockNumber === '0' ? 'pending' : 'completed',
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

  async poolCreationDate(tokenAHash: string, tokenBHash: string): Promise<DateTime> {
    const poolKey = PoolInfoFactory.sortTypeHash(tokenAHash, tokenBHash).join('');

    try {
      const dateString = await dexCache.get(poolKey);
      if (dateString === '') {
        return DateTime.now();
      }

      return DateTime.fromJSDate(new Date(dateString));
    } catch (e) {
      return DateTime.now();
    }
  }

  async setPoolCreationDate(tokenAHash: string, tokenBHash: string, date: DateTime): Promise<void> {
    const poolKey = PoolInfoFactory.sortTypeHash(tokenAHash, tokenBHash).join('');

    if (!(await dexCache.getLock(poolKey))) {
      throw new Error('get dex cache lock failed');
    }

    dexCache.set(poolKey, date.toJSDate().toLocaleString());
  }
}

export const dexLiquidityPoolService = new DexLiquidityPoolService();
