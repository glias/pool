import { Context } from 'koa';
import { BridgeInfoMatchChain, BridgeInfoMatchChainFactory, Script, TransactionWithStatus } from '../model';
import { ckbRepository, DexRepository } from '../repository';
import { SWAP_LOCK_CODE_HASH, SWAP_LOCK_HASH_TYPE } from '../config';
import { QueryOptions } from '@ckb-lumos/base';
import { DexOrderChainFactory, ORDER_TYPE } from '../model/orders/dexOrderChainFactory';
import { DexOrderChain, OrderHistory } from '../model/orders/dexOrderChain';
import { txBuilder } from '.';
import { StopWatch } from "../model";

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

  public buildSwapOrderLock(req: txBuilder.SwapOrderRequest): Script {
    return this.txBuilderService.buildSwapLock(req);
  }

  async orders(lock: Script, ethAddress: string, _limit: number, _skip: number): Promise<OrderHistory[]> {
    const orderLock: Script = new Script(SWAP_LOCK_CODE_HASH, SWAP_LOCK_HASH_TYPE, '0x');
    const orders: DexOrderChain[] = [];
    const queryOptions: QueryOptions = {
      lock: {
        script: orderLock.toLumosScript(),
        argsLen: 'any',
      },
      order: 'desc',
    };
    const sw = new StopWatch()
    sw.start();

    const txs = await this.dexRepository.collectTransactions(queryOptions, true, true);

    console.log("query txs:", sw.split());

    const bridgeInfoMatch = await this.getBridgeInfoMatch(lock, ethAddress);
    console.log("bridgeInfoMatch:", sw.split());

    const crossOrders = await this.getCross(lock, ethAddress, bridgeInfoMatch);
    crossOrders.forEach((x) => orders.push(x));
    console.log("crossOrders:", sw.split());


    const factory = new DexOrderChainFactory(ORDER_TYPE.SWAP, null);
    const ckbOrders = factory.getOrderChains(queryOptions.lock, null, txs, bridgeInfoMatch);
    const userLockHash = lock.toHash().slice(2, 66);
    ckbOrders.forEach((x) => {
      if (x.cell.lock.args.slice(100, 164) === userLockHash) {
        orders.push(x);
      }
    });

    console.log("total:", sw.total());

    return orders
      .filter((x) => x.filterOrderHistory())
      .map((x) => x.getOrderHistory())
      .sort((o1, o2) => parseInt(o1.timestamp) - parseInt(o2.timestamp))
      .reverse();
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

      if (tx.recipient_lockscript.code_hash === SWAP_LOCK_CODE_HASH) {
        continue;
      }
      const transaction = await this.dexRepository.getTransaction(tx.ckb_tx_hash);
      txs.push(transaction);
    }

    const orders: DexOrderChain[] = [];
    const factory = new DexOrderChainFactory(ORDER_TYPE.CROSS_CHAIN, null);

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
}

export const dexSwapService = new DexSwapService();
