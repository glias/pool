import { Server } from '@gliaswap/types';
import { Context } from 'koa';
import { TxBuilderService, CancelOrderType } from '.';
import { Script, SwapOrderCellInfoSerialization, TokenTokenHolderFactory } from '../model';
import { ckbRepository, DexRepository } from '../repository';
import { SWAP_ORDER_LOCK_CODE_HASH, SWAP_ORDER_LOCK_CODE_TYPE_HASH } from '../config';
import { HashType, QueryOptions } from '@ckb-lumos/base';
import { DexOrderChainFactory } from '../model/orders/dexOrderChainFactory';
import * as pw from '@lay2/pw-core';
import { MockRepositoryFactory } from '../tests/mockRepositoryFactory';
import { DexOrderChain } from '../model/orders/dexOrderChain';
import { mockDev } from '../tests/mock_data';

export class DexSwapService {
  private readonly txBuilderService: TxBuilderService;
  private readonly dexRepository: DexRepository;

  constructor() {
    this.txBuilderService = new TxBuilderService();
    this.dexRepository = ckbRepository;
  }

  public async buildSwapOrderTx(ctx: Context, req: Server.SwapOrderRequest): Promise<Server.TransactionWithFee> {
    return await this.txBuilderService.buildSwap(ctx, req);
  }

  public async buildCancelOrderTx(ctx: Context, req: Server.CancelOrderRequest): Promise<Server.TransactionWithFee> {
    return await this.txBuilderService.buildCancelOrder(ctx, req, CancelOrderType.Swap);
  }

  async orders(lock: Script, limit: number, skip: number): Promise<[]> {
    const types = TokenTokenHolderFactory.getInstance().getTypeScripts();
    const orderLock: Script = new Script(SWAP_ORDER_LOCK_CODE_HASH, SWAP_ORDER_LOCK_CODE_TYPE_HASH, lock.toHash());

    const orders: DexOrderChain[] = [];
    for (let i = 0; i < types.length; i++) {
      const txs = await this.getNormalOrders(orderLock, types[i]);
      txs.forEach((x) => orders.push(x));
    }

    console.log(orders[0].getOrderInfo());

    // const forceBridgeTxs = await this.dexRepository.getForceBridgeHistory(lock, false);
    // console.log(forceBridgeTxs);

    return [];
  }
  private async getNormalOrders(orderLock: Script, type: Script): Promise<DexOrderChain[]> {
    // const queryOptions: QueryOptions = {
    //   lock: {
    //     script: orderLock.toLumosScript(),
    //     argsLen: 'any',
    //   },
    //   type: type.toLumosScript(),
    //   order: 'desc',
    // };
    // const txs = await this.dexRepository.collectTransactions(queryOptions);

    const mock = MockRepositoryFactory.getDexRepositoryInstance();
    mock.mockCollectTransactions().resolves(mockDev);
    const txs = await mock.collectTransactions(null);

    const factory = new DexOrderChainFactory();
    const orders = factory.getOrderChains(orderLock, type, txs);

    return orders;
  }
}

export const dexSwapService = new DexSwapService();
