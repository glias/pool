import { QueryOptions } from '@ckb-lumos/base';
import { Context } from 'koa';
import { BLOCK_NUMBER, SWAP_LOCK_CODE_HASH, SWAP_LOCK_HASH_TYPE } from '../config/index';
import * as tokenToken from '../config/tokenToken';
import { Logger } from '../logger';
import {
  BridgeInfo,
  BridgeInfoMatchChain,
  BridgeInfoMatchChainFactory,
  Script,
  TransactionWithStatus,
  StopWatch,
} from '../model';
import { DexOrderChain, OrderHistory } from '../model/orders/dexOrderChain';
import { DexOrderChainFactory, ORDER_TYPE } from '../model/orders/dexOrderChainFactory';
import { ckbRepository, DexRepository } from '../repository';

import { dexLiquidityPoolService, DexLiquidityPoolService, txBuilder } from '.';

export class DexSwapService {
  private readonly dexRepository: DexRepository;
  private readonly txBuilderServiceFactory: txBuilder.TxBuilderServiceFactory;
  private readonly poolService: DexLiquidityPoolService = dexLiquidityPoolService;

  constructor() {
    this.dexRepository = ckbRepository;
    this.txBuilderServiceFactory = new txBuilder.TxBuilderServiceFactory();
  }

  public async buildSwapTx(ctx: Context, req: txBuilder.SwapRequest): Promise<txBuilder.TransactionWithFee> {
    const txBuilder = req.isCkbTokenRequest()
      ? this.txBuilderServiceFactory.ckbToken()
      : this.txBuilderServiceFactory.tokenToken();

    return await txBuilder.buildSwap(ctx, req);
  }

  public async buildCancelRequestTx(ctx: Context, req: txBuilder.CancelRequest): Promise<txBuilder.TransactionWithFee> {
    return await this.txBuilderServiceFactory.cancel().build(ctx, req);
  }

  public buildSwapLock(req: txBuilder.SwapRequest): Script {
    const txBuilder = req.isCkbTokenRequest()
      ? this.txBuilderServiceFactory.ckbToken()
      : this.txBuilderServiceFactory.tokenToken();

    return txBuilder.buildSwapLock(req);
  }

  async orders(lock: Script, ethAddress: string, _limit: number, _skip: number): Promise<OrderHistory[]> {
    const sw = new StopWatch();
    sw.start();

    const orders: DexOrderChain[] = [];

    const orderLock: Script = new Script(SWAP_LOCK_CODE_HASH, SWAP_LOCK_HASH_TYPE, '0x');
    const queryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      order: 'desc',
      fromBlock: BLOCK_NUMBER,
    };

    const txs = await this.dexRepository.collectTransactions(queryOptions, true, true);
    Logger.info('query txs:', sw.split());

    const pureCrossTxs = await this.dexRepository.getForceBridgeHistory(lock, ethAddress);
    const bridgeInfoMatch = BridgeInfoMatchChainFactory.getInstance(pureCrossTxs);
    const crossOrders = await this.getCross(lock, ethAddress, bridgeInfoMatch, pureCrossTxs);

    crossOrders.forEach((x) => orders.push(x));
    Logger.info('crossOrders:', sw.split());

    const poolInfos = await this.poolService.getLiquidityPools();

    const factory = new DexOrderChainFactory(lock, ORDER_TYPE.SWAP, null, poolInfos);
    const ckbOrders = factory.getOrderChains(queryOptions.lock, null, txs, bridgeInfoMatch);
    const userLockHash = lock.toHash().slice(2, 66);
    ckbOrders.forEach((x) => {
      if (x.cell.lock.args.slice(66, 130) === userLockHash) {
        orders.push(x);
      }
    });

    const sudtOrders = await this.getSudtSudt(lock, bridgeInfoMatch);
    sudtOrders.forEach((x) => {
      if (x.cell.lock.args.slice(66, 130) === userLockHash) {
        orders.push(x);
      }
    });

    Logger.info('total:', sw.total());

    return orders
      .filter((x) => x.filterOrderHistory())
      .map((x) => x.getOrderHistory())
      .sort((o1, o2) => parseInt(o1.timestamp) - parseInt(o2.timestamp))
      .reverse();
  }

  private async getSudtSudt(lock: Script, bridgeInfoMatch: BridgeInfoMatchChain) {
    const orderLock: Script = new Script(tokenToken.SWAP_LOCK_CODE_HASH, tokenToken.SWAP_LOCK_HASH_TYPE, '0x');
    const queryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      order: 'desc',
      fromBlock: BLOCK_NUMBER,
    };
    const poolInfos = await this.poolService.getLiquidityPools();

    const txs = await this.dexRepository.collectTransactions(queryOptions, true, true);
    const factory2 = new DexOrderChainFactory(lock, ORDER_TYPE.SWAP, null, poolInfos);
    const sudtOrders = factory2.getOrderChains(queryOptions.lock, null, txs, bridgeInfoMatch);
    return sudtOrders;
  }

  private async getCross(
    lock: Script,
    ethAddress: string,
    bridgeInfoMatch: BridgeInfoMatchChain,
    pureCrossTxs: { eth_to_ckb: BridgeInfo[]; ckb_to_eth: BridgeInfo[] },
  ): Promise<DexOrderChain[]> {
    // const pureCrossTxs = await this.dexRepository.getForceBridgeHistory(lock, ethAddress);
    let txs: TransactionWithStatus[] = [];
    for (const tx of pureCrossTxs.ckb_to_eth) {
      if (tx.status !== 'success') {
        continue;
      }
      const transaction = await this.dexRepository.getTransaction(tx.ckb_tx_hash);
      txs.push(transaction);
    }

    for (const tx of pureCrossTxs.eth_to_ckb) {
      if (tx.status !== 'success') {
        continue;
      }

      if (tx.recipient_lockscript.code_hash === SWAP_LOCK_CODE_HASH) {
        continue;
      }
      const transaction = await this.dexRepository.getTransaction(tx.ckb_tx_hash);
      txs.push(transaction);
    }

    const timestamp = await this.dexRepository.getTimestampByBlockNumber(BLOCK_NUMBER);
    txs = txs.filter((x) => BigInt(x.txStatus.timestamp) > BigInt(timestamp));

    const poolInfos = await this.poolService.getLiquidityPools();

    const orders: DexOrderChain[] = [];
    const factory = new DexOrderChainFactory(lock, ORDER_TYPE.CROSS_CHAIN, null, poolInfos);

    txs.forEach((x) => {
      const pureCrossOrders = factory.getOrderChains(lock, null, [x], bridgeInfoMatch);
      if (pureCrossOrders[0]) {
        orders.push(pureCrossOrders[0]);
      }
    });

    return orders;
  }

  private async getBridgeInfoMatch(lock: Script, ethAddress: string): Promise<BridgeInfoMatchChain> {
    const pureCrossTxs = await this.dexRepository.getForceBridgeHistory(lock, ethAddress);
    return BridgeInfoMatchChainFactory.getInstance(pureCrossTxs);
  }
}

export const dexSwapService = new DexSwapService();
