import { Context } from 'koa';
import {
  BridgeInfoMatchChain,
  BridgeInfoMatchChainFactory,
  Script,
  TokenHolderFactory,
  TransactionWithStatus,
} from '../model';
import { ckbRepository, DexRepository } from '../repository';
import { SWAP_ORDER_LOCK_CODE_HASH, SWAP_ORDER_LOCK_HASH_TYPE } from '../config';
import { QueryOptions } from '@ckb-lumos/base';
import { DexOrderChainFactory } from '../model/orders/dexOrderChainFactory';
import { DexOrderChain, OrderHistory, ORDER_STATUS } from '../model/orders/dexOrderChain';
import { txBuilder } from '.';

export class DexSwapService {
  private readonly txBuilderService: txBuilder.TxBuilderService;
  private readonly dexRepository: DexRepository;

  constructor() {
    this.txBuilderService = new txBuilder.TxBuilderService();
    this.dexRepository = ckbRepository;
  }

  public async buildSwapOrderTx(ctx: Context, req: txBuilder.SwapOrderRequest): Promise<txBuilder.TransactionWithFee> {
    return await this.txBuilderService.buildSwap(ctx, req);
  }

  public async buildCancelOrderTx(
    ctx: Context,
    req: txBuilder.CancelOrderRequest,
  ): Promise<txBuilder.TransactionWithFee> {
    return await this.txBuilderService.buildCancelOrder(ctx, req);
  }

  async orders(lock: Script, ethAddress: string, _limit: number, _skip: number): Promise<OrderHistory[]> {
    const orderLock: Script = new Script(SWAP_ORDER_LOCK_CODE_HASH, SWAP_ORDER_LOCK_HASH_TYPE, lock.toHash());
    const bridgeInfoMatch = await this.getBridgeInfoMatch(lock, ethAddress);

    const orders: DexOrderChain[] = [];
    const crossOrders = await this.getCross(lock, ethAddress, bridgeInfoMatch);
    crossOrders.forEach((x) => orders.push(x));

    const types = TokenHolderFactory.getInstance().getTypeScripts();
    for (let i = 0; i < types.length; i++) {
      const txs = await this.getOrders(orderLock, types[i], bridgeInfoMatch);
      txs.forEach((x) => orders.push(x));
    }

    await this.getCkbOrders(orderLock, orders, bridgeInfoMatch);
    return orders
      .filter((x) => x.getStatus() !== ORDER_STATUS.COMPLETED && x.getStatus() !== ORDER_STATUS.CANCELING)
      .map((x) => x.getOrderHistory())
      .sort((o1, o2) => parseInt(o1.timestamp) - parseInt(o2.timestamp))
      .reverse();
  }

  private async getCkbOrders(orderLock: Script, orders: DexOrderChain[], bridgeInfoMatch: BridgeInfoMatchChain) {
    const queryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      type: 'empty',
      order: 'desc',
    };

    const txHashes = new Set();
    orders.forEach((x) => txHashes.add(x.tx.transaction.hash));
    const txs = await this.dexRepository.collectTransactions(queryOptions, true);
    const factory = new DexOrderChainFactory(true);
    const orders2 = factory.getOrderChains(
      queryOptions.lock,
      null,
      txs.filter((x) => !txHashes.has(x.transaction.hash)),
      bridgeInfoMatch,
    );

    orders2.forEach((x) => orders.push(x));
  }

  private async getCross(
    lock: Script,
    ethAddress: string,
    bridgeInfoMatch: BridgeInfoMatchChain,
  ): Promise<DexOrderChain[]> {
    const pureCrossTxs = await this.dexRepository.getForceBridgeHistory(lock, ethAddress);
    const txs: TransactionWithStatus[] = [];
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

      if (tx.recipient_lockscript.code_hash === SWAP_ORDER_LOCK_CODE_HASH) {
        continue;
      }
      const transaction = await this.dexRepository.getTransaction(tx.ckb_tx_hash);
      txs.push(transaction);
    }

    const orders: DexOrderChain[] = [];
    const factory = new DexOrderChainFactory(true);
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
    // const crossChainOrderTxs = await this.dexRepository.getForceBridgeHistory(lock, ethAddress);
    return BridgeInfoMatchChainFactory.getInstance(pureCrossTxs);
  }

  private async getOrders(
    orderLock: Script,
    type: Script,
    bridgeInfoMatch: BridgeInfoMatchChain,
  ): Promise<DexOrderChain[]> {
    const queryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      type: type.toLumosScript(),
      order: 'desc',
    };
    const txs = await this.dexRepository.collectTransactions(queryOptions, true);
    if (!txs) {
      return [];
    }
    const factory = new DexOrderChainFactory(true);
    const orders = factory.getOrderChains(queryOptions.lock, type, txs, bridgeInfoMatch);

    return orders;
  }
}

export const dexSwapService = new DexSwapService();
